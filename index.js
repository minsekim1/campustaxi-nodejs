var express = require("express");
var app = express();
const http = require("http").Server(app);
var router = express.Router();

//#region firebase 설정
// https://nicgoon.tistory.com/196

var firebase_config = require("./config/firebase/firebase.js");
var firebase_conn = firebase_config.init();

//#region FCM 설정
var FCM = require('fcm-node');

/** Firebase(구글 개발자 사이트)에서 발급받은 서버키 */
// 가급적 이 값은 별도의 설정파일로 분리하는 것이 좋다.
var serverKey = 'AAAA9XYpadM:APA91bFItBINM-geMtof0FeWCbfr22a9KyU3iyqqDiO8wWugITQ5Bb1l5DlkZawZysj0lvJWR5lX6h5rl2Wn0lHLnouBtLO7JDMbJGqUJZb_WgNuxavFLfmSfHL06FwH6ryKVM4Tm_9Q';

/** 안드로이드 단말에서 추출한 token값 */
// 안드로이드 App이 적절한 구현절차를 통해서 생성해야 하는 값이다.
// 안드로이드 단말에서 Node server로 POST방식 전송 후,
// Node서버는 이 값을 DB에 보관하고 있으면 된다.
var client_token = 'fCfVzlhF50Q:APA91bECSDkr04TVzmI-Rtd1cxIGBHEuDYCZyvOuc254mx-AwtIZkiOw22y7fDv1uYbWuxbzXwwn6fv_Ut7n2_-LcLN3heohBV20MG_uFWsHm8dw2bMX9oRI10BQPNeXqMaaf8_Fhopi';

/** 발송할 Push 메시지 내용 */
var push_data = {
  // 수신대상
  to: client_token,
  // App이 실행중이지 않을 때 상태바 알림으로 등록할 내용
  notification: {
    title: "Hello Node",
    body: "Node로 발송하는 Push 메시지 입니다.",
    sound: "default",
    click_action: "FCM_PLUGIN_ACTIVITY",
    icon: "fcm_push_icon"
  },
  // 메시지 중요도
  priority: "high",
  // App 패키지 이름
  restricted_package_name: "study.cordova.fcmclient",
  // App에게 전달할 데이터
  data: {
    num1: 2000,
    num2: 3000
  }
};

/** 아래는 푸시메시지 발송절차 */
var fcm = new FCM(serverKey);

fcm.send(push_data, function (err, response) {
  if (err) {
    console.error('Push메시지 발송에 실패했습니다.');
    console.error(err);
    return;
  }

  console.log('Push메시지가 발송되었습니다.');
  console.log(response);
});

//#endregion FCM 설정
//#endregion firebase 설정


//#region 서버 연동 설정

var db_config = require("./config/mysql/database.js");
var conn = db_config.init();
db_config.connect(conn);

//#endregion 서버 연동 설정


//#region API 설정

var responseData = {};
const messsage_query = (query) =>
  conn.query(query, function (err, rows) {
    if (err) throw err;
    if (rows.length) {
      console.log(rows);
      responseData.result = 1;
      responseData.data = rows;
    } else {
      responseData.result = "0";
    }
    console.log(responseData);
  });
const get_message_all = () => {
  messsage_query("INSERT INTO `campustaxi_db`.`massage_tb` (`massage`, `room_id`,`created_at`, `massage_type`, `is_deleted`) VALUES ('hi~!', 75, now(), 'NORMAL', false);");
  messsage_query('select * from massage_tb');
}
// get_message_all();

//#endregion API 설정


//#region 웹소켓 설정

const io = require("socket.io")(http);
const port = process.env.PORT || 3000;
var clients = new Map(); // key: socket_id value: 1개 방
var rooms = new Map(); // key: room_id value: 여러개 소켓

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  // 사용자 접속
  // data : room_id, username(nickname) firebaseToken
  socket.on("enter", async function (data) {
    console.log(
      new Date().toLocaleString(),
      "]enter/room_id/",
      data.room_id,
      "/username/",
      data.username,
      "/socket_id/",
      socket.id,
      "/firebase_token/",
      data.firebaseToken
    );
    if (rooms.get(data.room_id) == undefined)
      rooms.set(data.room_id, new Array());

    var new_connect = new Object();
    new_connect.room_id = data.room_id;
    new_connect.socket_id = socket.id;
    new_connect.enterTime = new Date();
    new_connect.username = data.username;
    new_connect.firebaseToken = data.firebaseToken;

    //#region 중복 닉네임 접속 시 이전 소켓 삭제
    await rooms.get(data.room_id).map((room) => {
      if (room.username == data.username) {
        clients.delete(room.socket_id);
        rooms.get(room.room_id).filter((r) => r.uesrname != data.username);
      }
    });
    //#endregion 중복 닉네임 접속 시 이전 소켓 삭제

    clients.set(socket.id, new_connect);
    await rooms.get(data.room_id).push(new_connect);

    let enter_send_user = rooms.get(data.room_id);
    if (enter_send_user != undefined)
      enter_send_user.map((user) =>
        io.to(user.socket_id).emit("enter", {
          username: data.username,
          date: new Date(),
        })
      );
    // console.log("enter ", socket.id, "rooms:", rooms, "clients:", clients);
  });

  // 사용자 채팅 전송
  socket.on("chat", function (data) {
    // 방 번호를 통해서 방안에 모든 유저에게 메세지를 전송
    //data : msg , room_id, username # maxperson 삭제됌
    console.log(
      new Date().toLocaleString(),
      "]chat/room_id/",
      data.room_id,
      "/username/",
      data.username,
      "/socket_id/",
      socket.id,
      "/msg",
      data.msg
    );
    let chat_send_user = rooms.get(data.room_id);
    if (chat_send_user != undefined)
      chat_send_user.map((user) =>
        io.to(user.socket_id).emit("chat", {
          username: data.username,
          chatTime: new Date(),
          msg: data.msg,
        })
      );
  });

  // 사용자 어플에서 종료, 많은 소켓 disconnect가 한번에 들어옴.
  socket.on("disconnect", function () {
    let user_room = clients.get(socket.id);
    if (user_room != undefined) {
      let user_name = user_room.username;
      if (user_name != undefined) {
        rooms.set(
          user_room.room_id,
          rooms.get(user_room.room_id).filter((r) => r.uesrname != user_name)
        );
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
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});

//#endregion 웹소켓 설정
