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
import {
  addSocket,
  addToken,
  ch,
  closeSocket,
  closeToken,
} from "./types/socket";
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
  //#endregion  서버 배포 설정

  //#region 서버 연동 설정

  var db_config = require("./config/mysql/database.js");
  var db_conn = db_config.init();
  db_config.connect(db_conn);

  //#endregion 서버 연동 설정

  //#region 웹소켓 설정

  const httpServer = require("http").createServer();
  const io = require("socket.io")(httpServer);

  io.on("connection", (socket: any) => {
    //#region enter 채팅방 접속
    // data : conn.room_id socket.id conn.username conn. 삭제=>firebaseToken<=삭제
    socket.on("enter", (conn: any) => {
      console.log(
        new Date().toLocaleString(),
        "]enter/",
        conn.room_id,
        "/",
        conn.username,
        "/",
        socket.id
      );

      addSocket(conn.username, socket.id, conn.room_id).then((c) => {
        //방에 있는 이미 들어온 유저에게 접속 전달
        let enter_send_users = ch.rooms.get(conn.room_id);
        if (enter_send_users) {
          enter_send_users.map((user) => {
            io.to(user.socket_id).emit("enter", {
              username: conn.username,
              date: new Date(),
            });
          });
          //접속한 사용자에게 이전 메세지 전달
          //#region SELECT MESSAGE
          sql_message_select(db_conn, conn.room_id).then((r) => {
            io.to(socket.id).emit("enter chat", {
              data: r,
            });
          });
          //#endregion SELECT MESSAGE
        }
      });
      console.log("enter", ch);
    });
    //#endregion 채팅방 접속

    //#region 채팅방 나가기
    // data : None
    socket.on("exit", (conn: any) => {
      console.log(new Date().toLocaleString(), "]exit/", socket.id);
      closeSocket(socket.id);
      console.log("exit", ch);
    });
    //#endregion 채팅방 나가기

    //#region enter 앱 접속
    // data : conn.username conn.firebaseToken
    socket.on("OToke", (conn: any) => {
      console.log(
        new Date().toLocaleString(),
        "]OToke/",
        conn.username,
        "/",
        socket.id,
        "/",
        !!conn.firebaseToken
      );
      addToken(conn.username, conn.firebaseToken);
      console.log("OToke", ch);
    });
    //#endregion 앱 접속

    //#region chat 사용자 채팅 전송
    type ChatProps = {
      room_id: string;
      username: string;
      id: string;
      msg: string;
      firebaseToken: string;
    };

    socket.on("chat", (props: ChatProps) => {
      // 방 번호를 통해서 방안에 모든 유저에게 메세지를 전송
      let chat_send_user = ch.rooms.get(props.room_id);
      if (!!chat_send_user)
        chat_send_user.map((user) => {
          //Firebase 토큰 FCM 전송 (나를 제외한 FCM 전송)
          if (user.nickname != props.username)
            send({
              clientToken: user.firebaseToken,
              title: props.username,
              mesage: props.msg,
              // click_action: "string",
              // icon: ""
            });
          // 웹소켓 채팅 데이터 전송 (나를 포함한 소켓 전송)
          io.to(user.socket_id).emit("chat", {
            username: props.username,
            chatTime: new Date(),
            msg: props.msg,
          });
        });
      //#region GET USER ID
      sql_userid_get(db_conn, props.username).then((id) => {
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
        "]chat /",
        props.room_id,
        "/",
        props.username,
        "/",
        socket.id,
        "/",
        props.msg
      );
    });
    // #endregion 사용자 채팅 전송

    //#region 앱 종료
    // 사용자 어플에서 종료, 많은 소켓 disconnect가 한번에 들어옴.
    socket.on("disconnect", () => {
      closeSocket(socket.id).then((c) => {
        if (c) {
          let conn = ch.users.get(c.nickname);
          if (conn) closeToken(conn.firebaseToken);
        }
        console.log(
          new Date().toLocaleString(),
          "]discn/",
          c?.nickname,
          "/",
          socket.id
        );
      console.log("disconnect", ch);

      });
      //#endregion 앱 종료
    });

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
