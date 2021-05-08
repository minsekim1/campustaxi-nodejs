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
import { sql_userid_get, User } from "./types/User";

//#region     서버 배포 설정
app.prepare().then(() => {
  const server = express();
  const http = require("http").Server(app);
  let isAppGoingToBeClosed = false; // SIGINT 시그널을 받았는지 여부. 앱이 곧 종료될 것임을 의미한다.

  server.use(function (req: any, res: any, next: any) {
    // 프로세스 종료 예정이라면 리퀘스트를 처리하지 않는다
    if (isAppGoingToBeClosed) {
      res.set("Connection", "close");
    }
    next();
  });

  //#region firebase 설정
  // https://nicgoon.tistory.com/196

  //#region FCM 설정

  // var firebase = require("./config/firebase/firebase.ts");

  //#endregion FCM 설정
  //#endregion firebase 설정

  //#region 서버 연동 설정

  var db_config = require("./config/mysql/database.js");
  var db_conn = db_config.init();
  db_config.connect(db_conn);

  //#endregion 서버 연동 설정

  //#region API 설정

  // const messsage_insert = (msg, room_id) => {
  //   // id
  //   // created_at
  //   // updated_at
  //   // massage
  //   // massage_type
  //   // is_deleted
  //   // deleted_at
  //   // created_by_id
  //   // room_id
  //   // updated_by_id
  //   messsage_query(
  //     "INSERT INTO `campustaxi_db`.`massage_tb` (`massage`, `room_id`,`created_at`, `massage_type`, `is_deleted`) VALUES ('hi~!', 75, now(), 'NORMAL', false);"
  //   );
  // };

  //#endregion API 설정

  //#region 웹소켓 설정
  const httpServer = require("http").createServer();
  const io = require("socket.io")(httpServer);
  type Connection = {
    room_id: string;
    username: string;
    firebaseToken: string;
    socket_id: string;
    enterTime: Date;
  };
  var clients = new Map<string, Connection>(); // key: socket_id value: 1개 방
  var rooms = new Map<string, Connection[]>(); // key: room_id value: 여러개 소켓
  io.on("connection", (socket: any) => {
    //#region enter 사용자 접속
    // data : room_id, username(nickname) firebaseToken
    socket.on("enter", async function (conn: Connection) {
      console.log(
        new Date().toLocaleString(),
        "]enter/",
        conn.room_id,
        "/",
        conn.username,
        "/",
        socket.id,
        "/",
        !!conn.firebaseToken
      );

      if (rooms.get(conn.room_id) == undefined)
        rooms.set(conn.room_id, new Array());

      let new_connect: any = new Object();
      new_connect.room_id = conn.room_id;
      new_connect.socket_id = socket.id;
      new_connect.enterTime = new Date();
      new_connect.username = conn.username;
      new_connect.firebaseToken = conn.firebaseToken;

      //#region 중복 닉네임 접속 시 이전 소켓과 방 삭제

      //clients 중복
      let client_room = clients.get(conn.username);
      if (client_room != undefined) {
        let members = rooms.get(client_room.room_id);
        if (members != undefined)
          rooms.set(
            client_room.room_id,
            members.filter((c: Connection) => c.username != conn.username)
          );
        clients.delete(conn.username);
      }
      // rooms 중복
      let members = rooms.get(conn.room_id);
      if (members != undefined)
        rooms.set(
          conn.room_id,
          members.filter((c: Connection) => c.username != conn.username)
        );

      //#endregion 중복 닉네임 접속 시 이전 소켓 삭제

      clients.set(conn.username, new_connect);
      rooms.get(conn.room_id)?.push(new_connect);

      let enter_send_user = rooms.get(conn.room_id);
      if (enter_send_user != undefined) {
        enter_send_user.map((user) => {
          io.to(user.socket_id).emit("enter", {
            username: conn.username,
            date: new Date(),
          });
        });
        //접속한 사용자에게 이전 메세지 전달
        //#region SELECT MESSAGE
        sql_message_select(db_conn, new_connect.room_id).then((r) => {
          io.to(new_connect.socket_id).emit("enter chat", {
            data: r,
          });
        });
        //#endregion SELECT MESSAGE
      }
    });
    //#endregion 사용자 접속

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
      let chat_send_user = rooms.get(props.room_id);
      if (chat_send_user != undefined)
        chat_send_user.map((user) => {
          //Firebase 토큰 FCM 전송 (나를 제외한 FCM 전송)
          if (user.username != props.username)
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
    //#endregion 사용자 채팅 전송

    //#region disconnect
    // 사용자 어플에서 종료, 많은 소켓 disconnect가 한번에 들어옴.
    socket.on("disconnect", function () {
      clients.forEach((value: Connection, nickname: string) => {
        if (value.socket_id == socket.id) {
          clients.delete(nickname);
          console.log(
            new Date().toLocaleString(),
            "]discon/",
            nickname,
            "/",
            socket.id
          );
          return false;
        }
      });

      // let user_room = clients.get(socket.id);
      //   clients.delete(socket.id);

      //   console.log("disconnect socket", user_room);
      //   if (user_room != undefined && !!user_room[0]) {
      //     let user_name = user_room[0].username;
      //     if (user_name != undefined) {
      //       let filtered_connection = rooms
      //         .get(user_room[0].room_id)
      //         ?.filter((r) => r.username != user_name);
      //       if (filtered_connection != undefined)
      //         rooms.set(user_room[0].room_id, filtered_connection);
      //       console.log(
      //         new Date().toLocaleString(),
      //         "]disconnect/",
      //         user_name,
      //         "/",
      //         socket.id
      //       );
      //     }
      //   }
    });
    //#endregion disconnect
  });

  //#endregion 웹소켓 설정

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
//#endregion  서버 배포 설정
