const express = require("express");
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const port = 3000;
import { send } from "./config/firebase/firebase";
import * as rc from "./config/redis/redis";
import { l } from "./config/redis/redis_test";
import {
  Message,
  sql_message_insert,
  sql_message_select,
} from "./types/Message";
import * as soc from "./types/socket";
import { appEnter, chatClose, chatEnter, Logout } from "./types/socket";
import { sql_userid_get, User } from "./types/User";

//#region     서버 배포 설정
app.prepare().then(() => {
  const server = express();
  const http = require("http").Server(app);
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

  const httpServer = require("http").createServer();
  const io = require("socket.io")(httpServer);
  //#endregion  서버 배포 설정

  //#region 웹소켓 설정
  io.on("connection", (socket: any) => {
    //#region chatEnter 채팅방 접속
    // data : c.room_id c.nickname
    socket.on("chatEnter", (c: any) => {
      l("cE", c.room_id, c.nickname, socket.id);
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
      l("cC", c.room_id, c.nickname, socket.id);
      chatClose(c.nickname, c.room_id);
    });
    //#endregion chatClose 채팅방 나가기

    //#region appEnter 앱 접속
    // data :  nickname  token
    socket.on("appEnter", (c: any) => {
      l("aE", c.nickname, socket.id);
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
      l("chat", c.room_id, c.nickname, c.msg, socket.id);
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
      l("disc", socket.id);
      rc.getNicknameBySocket(socket.id).then((nickname) =>
        chatClose(socket.id, nickname)
      );
    });
    //#endregion 앱 종료

    // #region logout 로그아웃
    socket.on("logout", () => {
      rc.getNicknameBySocket(socket.id).then((nickname) => {
        Logout(nickname);
        l("logu", nickname, socket.id);
      });
    });
    //#endregion logout 로그아웃
  });
  //#endregion 웹소켓 설정

  //#region pm2 설정

  const listeningServer = server.listen((err: any) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);

    // PM2에게 앱 구동이 완료되었음을 전달한다
    if (process.send) {
      process.send("ready");
      console.log("sent ready signal to PM2 at", new Date());
    }
  });

  process.on("SIGINT", function () {
    console.log("> received SIGNIT signal");
    isAppGoingToBeClosed = true; // 앱이 종료될 것

    // pm2 재시작 신호가 들어오면 서버를 종료시킨다.
    listeningServer.close(function (err: any) {
      console.log("server closed");
      process.exit(err ? 1 : 0);
    });
  });

  httpServer.listen(3000);
});
//#endregion pm2 설정
