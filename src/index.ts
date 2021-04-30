const express = require("express");
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const port = 3000;
import { send } from "./config/firebase/firebase";
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
  var conn = db_config.init();
  db_config.connect(conn);

  //#endregion 서버 연동 설정

  //#region API 설정
  var responseData = { result: 0, data: "" };
  const messsage_query = (query: string) =>
    conn.query(query, function (err: any, rows: string) {
      if (err) throw err;
      if (rows.length) {
        console.log(rows);
        responseData.result = 1;
        responseData.data = rows;
      } else {
        responseData.result = 0;
      }
      console.log("responseData", responseData);
    });
  const get_message_all = () => {
    messsage_query(
      "INSERT INTO `campustaxi_db`.`massage_tb` (`massage`, `room_id`,`created_at`, `massage_type`, `is_deleted`) VALUES ('hi~!', 75, now(), 'NORMAL', false);"
    );
    messsage_query("select * from massage_tb");
  };
  // get_message_all();

  //#endregion API 설정

  //#region 웹소켓 설정

  const io = require("socket.io")(port);
  type Connection = {
    room_id: string;
    username: string;
    firebaseToken: string;
    socket_id: string;
    enterTime: Date;
  };
  var clients = new Map<string, Connection[]>(); // key: socket_id value: 1개 방
  var rooms = new Map<string, Connection[]>(); // key: room_id value: 여러개 소켓

  io.on("connection", (socket: any) => {
    //#region enter 사용자 접속
    // data : room_id, username(nickname) firebaseToken
    socket.on("enter", async function (conn: Connection) {
      console.log(
        new Date().toLocaleString(),
        "]enter/room_id/",
        conn.room_id,
        "/username/",
        conn.username,
        "/socket_id/",
        socket.id,
        "/firebaseToken/",
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

      //#region 중복 닉네임 접속 시 이전 소켓 삭제
      rooms.get(conn.room_id)?.map((room: Connection) => {
        if (room.username == conn.username) {
          clients.delete(room.socket_id);
          rooms
            .get(room.room_id)
            ?.filter((r: Connection) => r.username != conn.username);
        }
      });
      //#endregion 중복 닉네임 접속 시 이전 소켓 삭제

      clients.set(socket.id, new_connect);
      rooms.get(conn.room_id)?.push(new_connect);

      let enter_send_user = rooms.get(conn.room_id);
      if (enter_send_user != undefined)
        enter_send_user.map((user) =>
          io.to(user.socket_id).emit("enter", {
            username: conn.username,
            date: new Date(),
          })
        );
      // console.log("enter ", socket.id, "rooms:", rooms, "clients:", clients);
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
      console.log(
        new Date().toLocaleString(),
        "]chat /room_id/",
        props.room_id,
        "/username/",
        props.username,
        "/socket_id/",
        socket.id,
        "/msg",
        props.msg
      );
      let chat_send_user = rooms.get(props.room_id);
      if (chat_send_user != undefined)
        chat_send_user.map((user) => {
          //Firebase 토큰 FCM 전송
          send({
            clientToken: user.firebaseToken,
            title: props.username,
            mesage: props.msg,
            // click_action: "string",
            // icon: ""
          });
          // fetch(key.fcm_uri, {
          //   method: "POST",
          //   headers: {
          //     Accept: "application/json",
          //     Authorization: `Bearer ${accessToken}`,
          //   },
          //   body: JSON.stringify(message),
          // });
          // 웹소켓 채팅 데이터 전송
          io.to(user.socket_id).emit("chat", {
            username: props.username,
            chatTime: new Date(),
            msg: props.msg,
          });
        });
    });
    //#endregion 사용자 채팅 전송

    //#region disconnect
    // 사용자 어플에서 종료, 많은 소켓 disconnect가 한번에 들어옴.
    socket.on("disconnect", function () {
      let user_room = clients.get(socket.id);
      if (user_room != undefined && !!user_room[0]) {
        let user_name = user_room[0].username;
        if (user_name != undefined) {
          let filtered_connection = rooms
            .get(user_room[0].room_id)
            ?.filter((r) => r.username != user_name);
          if (filtered_connection != undefined)
            rooms.set(user_room[0].room_id, filtered_connection);
          clients.delete(socket.id);
          console.log(
            new Date().toLocaleString(),
            "]disconnect/",
            user_name,
            "/socket_id/",
            socket.id
          );
        }
      }
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
});
//#endregion  서버 배포 설정
