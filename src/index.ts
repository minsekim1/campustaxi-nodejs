const express = require("express");
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const port = 3000;
import {} from "./premium/premium";
import { logger } from "./config/winston";

import { send } from "./config/firebase/firebase";
import * as rc from "./config/redis/redis";
import { arraysEqual, l } from "./config/redis/redis_test";
import {
  Message,
  sql_message_insert,
  sql_message_select,
} from "./types/Message";
import * as soc from "./types/socket";
import {
  appEnter,
  chatClose,
  chatEnter,
  chatExit,
  Logout,
} from "./types/socket";
import { sql_userid_get, sql_usernicknames, User } from "./types/User";
import { ChatRoom, sql_room_get, sql_room_get_map } from "./types/ChatRoom";

//#region     서버 배포 설정
app.prepare().then(() => {
  const server = express();
  let isAppGoingToBeClosed = false; // SIGINT 시그널을 받았는지 여부. 앱이 곧 종료될 것임을 의미한다.
  server.use((req: any, res: any, next: any) => {
    // 프로세스 종료 예정이라면 리퀘스트를 처리하지 않는다
    if (isAppGoingToBeClosed) {
      res.set("Connection", "close");
    }
    next();
  });

  var db_config = require("./config/mysql/database.js");
  var db_conn = db_config.init();
  db_config.connect(db_conn);

  const httpServer = require("http").createServer((req: any, res: any) => {
    // URL을 받아올 변수를 선언합니다.
    const url = require("url");
    const fs = require("fs");
    let path = url.parse(req.url).pathname;
    const client_id =
      "1054249413075-50k4d1kiibquaus5thlgtkqt2me6g1a5.apps.googleusercontent.com";
    const client_secret = "DN63ztA6GtAP8bK_epO4kVt-";
    const redirect_uri =
      "https://726c9e683d2c.ngrok.io/googleiab/token/redirect"; //google api로 https로 설정
    const request = require("request");

    //#region 라우팅 설정: 페이지를 구분합니다.
    if (path == "/") {
      // index.html로 응답합니다.
      fs.readFile("./src/index/index.html", (err: any, data: any) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      });
    } else if (path == "/googleiab/token/request") {
      //#region 구글 정기결제 확인 api
      const CLIENT_ID =
        "1054249413075-50k4d1kiibquaus5thlgtkqt2me6g1a5.apps.googleusercontent.com";
      const AUTHORIZE_URI = "https://accounts.google.com/o/oauth2/v2/auth";
      const { google } = require("googleapis");
      const OAuth2 = google.auth.OAuth2;
      const TOKEN_PATH = "./config/googletoken.json";
      //구글 API 중 접근해야할 곳을 다수로 요청할 수 있다.
      const scopes = ["https://www.googleapis.com/auth/androidpublisher"];

      let oauth2Client = new OAuth2(client_id, client_secret, redirect_uri);
      let url = oauth2Client.generateAuthUrl({
        access_type: "offline", // 'online'이 기본인데 refresh_token을 얻으러면 'offline'으로 입력
        scope: scopes, // string으로된 Array 형태의 scope
        approval_prompt: "force",
      });
      logger.info("url", url);
      // res.redirect(url);
      //#endregion 구글 정기결제 확인 api
    } else if (path == "/googleiab/token/redirect") {
      let tokenStorage = {
        access_token: null,
        token_type: null,
        expires_in: null,
        refresh_token: null,
      };
      if (req.query.code === null || req.query.code === undefined) {
        res.send(tokenStorage);
        return;
      }

      //authorization code를 포함하면 access token과 교환할 수 있도록 한다.
      let url = "https://www.googleapis.com/oauth2/v4/token";
      let payload = {
        grant_type: "authorization_code", //OAuth 2.0 스펙에 포함된 필드로 반드시 'authorization_code'로 입력한다.
        code: req.query.code, //토큰 요청을 통해서 얻은 코드
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirect_uri,
      };

      request.post(
        url,
        { form: payload },
        function (error: any, response: any, body: any) {
          let parseBody = JSON.parse(body);
          tokenStorage.access_token = parseBody.access_token;
          tokenStorage.token_type = parseBody.token_type;
          tokenStorage.expires_in = parseBody.expires_in;
          tokenStorage.refresh_token = parseBody.refresh_token;
          //TODO : refresh_token으로 1시간이 되기 전에 access token으로 교환되도록 한다.

          res.send(tokenStorage);
        }
      );
    }
    //#endregion 라우팅 설정: 페이지를 구분합니다.
  });
  const io = require("socket.io")(httpServer);

  //#endregion  서버 배포 설정

  //#region 웹소켓 설정
  io.on("connection", (socket: any) => {
    //#region chatEnter 채팅방 접속
    // data : c.room_id c.nickname
    socket.on("chatEnter", (c: any) => {
      logger.info("cE " + c.room_id + " " + c.nickname + " " + socket.id);
      chatEnter(c.nickname, c.room_id);
      // 채팅방 채팅 "들어갔음" 소켓 전송
      rc.getNicknamesInRoomSocket(c.room_id).then((nicknames) => {
        nicknames.map((nickname) =>
          rc.getUserSocId(nickname).then((socid) =>
            io.to(socid).emit("chatEnter", {
              nickname: c.nickname,
              date: new Date(),
            })
          )
        );
      });
      //접속한 사용자에게 이전 메세지 전달
      //#region SELECT MESSAGE
      sql_message_select(db_conn, c.room_id).then((r) => {
        io.to(socket.id).emit("chatEnter chat", {
          data: r,
        });
      });
      //#endregion SELECT MESSAGE
    });
    //#endregion chatEnter 채팅방 접속

    //#region chatClose 채팅방 닫기 (fcm활성화)
    // data : c.room_id c.nickname
    socket.on("chatClose", (c: any) => {
      logger.info("cC " + c.room_id + " " + c.nickname + " " + socket.id);
      chatClose(c.nickname, c.room_id);
    });
    //#endregion chatClose 채팅방 나가기

    //#region chatExit 채팅방 나가기
    socket.on("chatExit", (c: any) => {
      logger.info("cE " + c.room_id + " " + c.nickname);
      chatExit(c.nickname, c.room_id);
    });
    //#endregion chatExit 채팅방 나가기
    //#region 유저 방 목록 가져오기
    socket.on("chatRooms", (c: { nickname: string }) => {
      rc.getRoomidsInUser(c.nickname).then((roomids) => {
        //#region Get ROOM

        if (!arraysEqual(roomids, [])) {
          db_conn.query(
            sql_room_get(roomids),
            (err: any, chatRooms: ChatRoom[]) => {
              if (err) {
                logger.error("error connecting: " + err.stack);
                return;
              }
              //현재인원 추가하기
              let maxlength = chatRooms.length - 1;
              let chatRoomsNow: ChatRoom[] = [];
              chatRooms.map(async (chatRoom, i) => {
                let length = await rc.getLengthInRoomUsers(chatRoom.id);
                chatRoomsNow.push({ ...chatRoom, current: length });
                if (maxlength == i) {
                  io.to(socket.id).emit("chatRooms", {
                    chatRooms: chatRoomsNow,
                  });
                }
              });
            }
          );
        } else
          io.to(socket.id).emit("chatRooms", {
            chatRooms: [],
          });
        //#endregion Get ROOM
      });
    });
    //#endregion 유저 방 목록 가져오기

    //#region appEnter 앱 접속
    // data :  nickname  token
    socket.on("appEnter", (c: any) => {
      logger.info("aE " + c.nickname + " " + socket.id);
      appEnter(c.nickname, socket.id, c.token);
    });
    //#endregion appEnter 앱 접속

    //#region chat 사용자 채팅 전송
    type ChatProps = {
      room_id: string;
      nickname: string;
      msg: string;
      firebaseToken: string;
    };
    socket.on("chat", (c: ChatProps) => {
      // 방안에 모든 유저에게 메세지 및 알림을 전송
      //c.room_id
      logger.info(
        "chat " + c.room_id + " " + c.nickname + " " + c.msg + " " + socket.id
      );
      //socket 방안에 접속해 있는 유저에게 채팅전송
      rc.getNicknamesInRoomSocket(c.room_id).then((nicknames) =>
        nicknames.map((nickname) =>
          rc.getUserSocId(nickname).then((socid) =>
            io.to(socid).emit("chat", {
              nickname: c.nickname,
              chatTime: new Date(),
              msg: c.msg,
            })
          )
        )
      );

      //token은 현재 채팅을하진 않지만 들어가 있는 채팅방 멤버 => FCM알림
      rc.getNicknamesInRoomToken(c.room_id).then((nicknames) =>
        nicknames.map((nickname) =>
          rc.getUserTokId(nickname).then((tokid) =>
            send({
              clientToken: tokid,
              title: c.nickname,
              mesage: c.msg,
              // click_action: "string",
              // icon: ""
            })
          )
        )
      );

      //mysql에 채팅 데이터 저장
      //#region GET USER ID
      sql_userid_get(db_conn, c.nickname).then((id) => {
        if (!!id[0]) {
          let user_id = id[0].id;
          //#region INSERT MESSAGE
          sql_message_insert(
            db_conn,
            c.msg,
            user_id,
            Number(c.room_id),
            user_id
          );
          //#endregion INSERT MESSAGE
        }
      });
      //#endregion GET USER ID
    });
    // #endregion 사용자 채팅 전송

    //#region disconnect 앱 종료
    // 사용자 어플에서 종료, 많은 소켓 disconnect가 한번에 들어옴.
    socket.on("disconnect", () => {
      logger.info("disc " + socket.id);
      //socet to token
      rc.getNicknameBySocket(socket.id).then((nickname) =>
        chatClose(socket.id, nickname)
      );
      //socket delete
      rc.removeSocket(socket.id);
    });
    //#endregion 앱 종료

    //#region logout 로그아웃
    socket.on("logout", (c: { nickname: string }) => {
      Logout(c.nickname);
      logger.info("logu " + c.nickname + " " + socket.id);
    });
    //#endregion logout 로그아웃

    //#region 지도 데이터
    socket.on(
      "chatRoomsInMap",
      (c: {
        minLat: number;
        maxLat: number;
        minLon: number;
        maxLon: number;
      }) => {
        //#region Get ROOM map
        db_conn.query(
          sql_room_get_map,
          [
            c.maxLat,
            c.maxLon,
            c.minLat,
            c.minLon,
            c.maxLat,
            c.maxLon,
            c.minLat,
            c.minLon,
          ],
          (err: any, chatRooms: ChatRoom[]) => {
            if (err) {
              logger.error("error connecting: " + err.stack);
              return;
            }
            //현재인원 추가하기
            let maxlength = chatRooms.length - 1;
            let chatRoomsNow: ChatRoom[] = [];
            chatRooms.map(async (chatRoom, i) => {
              let length = await rc.getLengthInRoomUsers(chatRoom.id);
              chatRoomsNow.push({ ...chatRoom, current: length });
              if (maxlength == i) {
                io.to(socket.id).emit("chatRoomsInMap", {
                  chatRooms: chatRoomsNow,
                });
              }
            });
          }
        );
        //#endregion Get ROOM map
      }
    );
    //#endregion 지도 데이터

    //#region 채팅방 정보 유저들 정보를 반환
    socket.on("chatRoomsInUsers", async (c: { room_id: any }) => {
      let nicknames = await rc.getNicknamesInRoomSocket(c.room_id);
      nicknames = nicknames.concat(await rc.getNicknamesInRoomToken(c.room_id));
      db_conn.query(
        sql_usernicknames(nicknames),
        (err: any, chatUsers: any) => {
          if (err) {
            logger.error("error connecting: " + err.stack);
            return;
          }
          io.to(socket.id).emit("chatRoomsInUsers", {
            chatUsers: chatUsers,
          });
        }
      );
    });
    //#endregion 채팅방 정보 유저들 정보를 반환

    //#region 강퇴하기
    socket.on(
      "kickUser",
      async (c: { room_id: any; nickname: string; hostname: string }) => {
        rc.removeNicknameInRoomSocket(c.room_id, c.nickname);
        rc.removeNicknameInRoomToken(c.room_id, c.nickname);
        rc.removeRoomidInUser(c.nickname, c.room_id);
        //강퇴 당한 사람에게 소켓전송
        rc.getUserSocId(c.nickname).then((socid) =>
          io
            .to(socid)
            .emit("kicked", { hostname: c.hostname, room_id: c.room_id })
        );
        //강퇴 당한 사람에게 FCM전송
        rc.getUserTokId(c.nickname).then((tokid) =>
          send({
            clientToken: tokid,
            title: c.hostname + " 유저의 방",
            mesage: "해당 유저의 방에서 강퇴 당하셨습니다. 방번호:" + c.room_id,
            // click_action: "string",
            // icon: ""
          })
        );
        //강퇴하고 나서 유저 목록을 해당방 유저들한테 다시 전송함
        let nicknames = await rc.getNicknamesInRoomSocket(c.room_id);
        nicknames = nicknames.concat(
          await rc.getNicknamesInRoomToken(c.room_id)
        );
        db_conn.query(
          sql_usernicknames(nicknames),
          (err: any, chatUsers: any) => {
            if (err) {
              logger.error("error connecting: " + err.stack);
              return;
            }
            nicknames.map((nickname) =>
              rc.getUserSocId(nickname).then((socid) =>
                io.to(socket.id).emit("chatRoomsInUsers", {
                  chatUsers: chatUsers,
                })
              )
            );
          }
        );
      }
    );
    //#endregion 강퇴하기
  });
  //#endregion 웹소켓 설정

  //#region pm2 설정

  const listeningServer = server.listen((err: any) => {
    if (err) throw err;
    logger.info(`> Ready on http://localhost:${port}`);

    // PM2에게 앱 구동이 완료되었음을 전달한다
    if (process.send) {
      process.send("ready");
      logger.info("sent ready signal to PM2 at", new Date());
    }
  });

  process.on("SIGINT", () => {
    logger.info("> received SIGNIT signal");
    isAppGoingToBeClosed = true; // 앱이 종료될 것

    // pm2 재시작 신호가 들어오면 서버를 종료시킨다.
    listeningServer.close((err: any) => {
      logger.warn("server closed");
      process.exit(err ? 1 : 0);
    });
  });

  httpServer.listen(port);
});
//#endregion pm2 설정
