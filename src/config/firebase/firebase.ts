//#region 기본 설정
const fs = require("fs");
var FCM = require("fcm-node");
var firebase = require("firebase/app");
const key = JSON.parse(
  fs.readFileSync("./src/config/firebase/firebaseConfig.json")
);
var firebase_info = {
  apiKey: key.apiKey,
  authDomain: key.authDomain,
  databaseURL: key.databaseURL,
  projectId: key.projectId,
  storageBucket: key.storageBucket,
  messagingSenderId: key.messagingSenderId,
  appId: key.appId,
  measurementId: key.measurementId,
};
const serverKey = JSON.parse(
  fs.readFileSync("./src/config/firebase/serverKey.json")
).serverKey;
firebase.initializeApp(firebase_info);
//#endregion 기본 설정

//#region 메세지 전송 API
var fcm = new FCM(serverKey);
type Message = {
  clientToken: String;
  title: String;
  mesage: String;
  click_action?: string;
  icon?: String;
};

export const send = (m: Message) => {
  fcm.send(
    {
      // 수신대상
      to: m.clientToken,
      // App이 실행중이지 않을 때 상태바 알림으로 등록할 내용
      notification: {
        title: m.title,
        body: m.mesage,
        sound: "default",
        click_action: !!m.click_action ? m.click_action : "FCM_PLUGIN_ACTIVITY",
        icon: !!m.icon ? m.icon : "fcm_push_icon",
        vibration: true
      },
      // 메시지 중요도
      priority: "high",
      // App에게 전달할 데이터
      // data: {
      //   num1: 2000,
      //   num2: 3000,
      // },
    },
    (err: any, response: any) => {
      if (err) {
        console.error("Push메시지 발송에 실패했습니다.");
        console.error(err);
        return;
      }
    }
  );
};
//#endregion 메세지 전송 API

// module.exports = {
//   send: (message: Message) => {
//     return send(message);
//   },
// };
