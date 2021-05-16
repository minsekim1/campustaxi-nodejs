const express = require("express");
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const port = 3000;
import { send } from "./config/firebase/firebase";
import {
  Message,
  sql_message_insert,
  sql_message_select,
} from "./types/Message";
import { appEnter, ch, chatClose, chatEnter, Logout } from "./types/socket";
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
    // data : conn.room_id conn.nickname 
    socket.on("chatEnter", (conn: any) => {
      console.log(
        new Date().toLocaleString(),
        "]cE/",
        conn.room_id,
        "/",
        conn.nickname,
        "/",
        socket.id
      );

      // 채팅방 채팅 "들어갔음" 소켓 전송
      let enter_send_users = ch.rooms.get(conn.room_id)?.socket;
      if (!!enter_send_users) {
        enter_send_users.map((user) => {
          io.to(user.socket_id).emit("chatEnter", {
            nickname: conn.nickname,
            date: new Date(),
          });
        });
      }
        chatEnter(conn.nickname, conn.room_id).then((b) => {
          //접속한 사용자에게 이전 메세지 전달
          if (b) {
            //#region SELECT MESSAGE
            sql_message_select(db_conn, conn.room_id).then((r) => {
              io.to(socket.id).emit("chatEnter chat", {
                data: r,
              });
            });
          }
          //#endregion SELECT MESSAGE
          console.log("chatEnter", ch);
        });
    });
    //#endregion chatEnter 채팅방 접속

    //#region chatClose 채팅방 나가기
    // data : None 
    socket.on("chatClose", () => {
      console.log(
        new Date().toLocaleString(),
        "]cC/",
        socket.id
      );
      chatClose(socket.id).then((b) => {
        console.log("chatClose", ch, b);
      });
    });
    //#endregion chatClose 채팅방 나가기

    //#region appEnter 앱 접속
    // data :  nickname  token
    socket.on("appEnter", (conn: any) => {
      console.log(
        new Date().toLocaleString(),
        "]aE/",
        conn.nickname,
        "/",
        socket.id,
        "/",
        !!conn.firebaseToken
      );
      appEnter(conn.nickname, socket.id, conn.token).then((b) => {
        console.log("appEnter", ch, b);
      });
    });
    //#endregion appEnter 앱 접속

    //#region chat 사용자 채팅 전송
    type ChatProps = {
      room_id: string;
      nickname: string;
      msg: string;
      firebaseToken: string;
    };
    socket.on("chat", (props: ChatProps) => {
      // 방안에 모든 유저에게 메세지 및 알림을 전송

            //socket는 방안에 접속해 있는 유저
      let chat_send_user_socket = ch.rooms.get(props.room_id)?.socket;
      if (!!chat_send_user_socket) {
        // 웹소켓 채팅 데이터 전송 (나를 포함한 소켓 전송)
        chat_send_user_socket.map((user) => {
          let other = ch.users.get(user.nickname)
          if (!!other) {
            io.to(other.socket_id).emit("chat", {
              nickname: props.nickname,
              chatTime: new Date(),
              msg: props.msg,
            });
              
            }
        });
      }

      //token은 현재 채팅을하진 않지만 들어가 있는 채팅방 멤버 => FCM알림
      let fcm_send_user_token = ch.rooms.get(props.room_id)?.token;
      //Firebase 토큰 FCM 전송 (나를 제외한 FCM 전송)
      if (!!fcm_send_user_token) {
        fcm_send_user_token.map((user) => {
          if (user.nickname != props.nickname) {
            let other = ch.users.get(user.nickname)
            if (!!other)
              send({
                clientToken: other.token_id,
                title: props.nickname,
                mesage: props.msg,
                // click_action: "string",
                // icon: ""
              });
          }
        });
      }

      //#region GET USER ID
      sql_userid_get(db_conn, props.nickname).then((id) => {
        if (!!id[0]) {
          let user_id = id[0].id;
          //#region INSERT MESSAGE
          sql_message_insert(
            db_conn,
            props.msg,
            user_id,
            Number(props.room_id),
            user_id
          );
          //#endregion INSERT MESSAGE
        }
      });
      //#endregion GET USER ID
      console.log(
        new Date().toLocaleString(),
        "]chat/",
        props.room_id,
        "/",
        props.nickname,
        "/",
        socket.id,
        "/",
        props.msg
      );
    });
    // #endregion 사용자 채팅 전송

    //#region disconnect 앱 종료
    // 사용자 어플에서 종료, 많은 소켓 disconnect가 한번에 들어옴.
    socket.on("disconnect", () => {
      chatClose(socket.id).then((b) => {
        console.log(new Date().toLocaleString(), "]disc/", socket.id);
        // console.log("disconnect", ch, b);
        //socket delete
        ch.sockets.delete(socket.id)
      });
    });
    //#endregion 앱 종료

    // #region logout 로그아웃
    socket.on("logout", () => {
      Logout(socket.id).then((b) => {
        console.log(new Date().toLocaleString(), "]logu/", socket.id);
        // console.log("logout", ch, b);
      });
    });
    //#endregion logout 로그아웃
    //#endregion 웹소켓 설정
  });

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
