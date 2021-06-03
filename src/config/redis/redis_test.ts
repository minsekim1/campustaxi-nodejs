import {
  AllKeysDelete,
  getNicknamesInRoomSocket,
  getNicknamesInRoomToken,
} from "./redis";
// import * as rc from "./redis";

import { database } from "firebase-admin";
import {
  appEnter,
  Logout,
  chatExit,
  chatEnter,
  chatClose,
  chatCloseAll,
} from "../../types/socket";
import { getUserAll } from "./redis";

export const l = (...args: string[]) => {
  let msg = new Date().toLocaleString() + "\\";
  args.map((arg) => (msg = msg.concat(arg) + "\\"));
  console.log(msg);
};

export function arraysEqual(a: Array<string>, b: Array<string>) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
// rc.setUser('campustaxiadmin', 'soc', 'toc')
// rc.getUserAll('campustaxiadmin').then(b=>console.log('boo',b))

// l("new", "\\\\");
// AllKeysDelete();
// appEnter("nickname", "socid", "tokenid");

// getUserAll("nickname").then((datas) => {
//   console.log(
//     "1",
//     datas.socId == "socid",
//     datas.tokId == "tokenid",
//     !!datas.enterDate
//   );
// });

// appEnter("nickname", "socid2", "tokenid");

// getUserAll("nickname").then((datas) => {
//   console.log(
//     "2",
//     datas.socId == "socid2",
//     datas.tokId == "tokenid",
//     !!datas.enterDate
//   );
// });

// appEnter("nickname", "socid2", "tokenid2");

// getUserAll("nickname").then((datas) => {
//   console.log(
//     "3",
//     datas.socId == "socid2",
//     datas.tokId == "tokenid2",
//     !!datas.enterDate
//   );
// });

// appEnter("nickname1", "socid1", "tokenid1");
// appEnter("nickname2", "socid2", "tokenid2");
// appEnter("nickname3", "socid3", "tokenid3");

// getUserAll("nickname1").then((datas) => {
//   console.log(
//     "4",
//     datas.socId == "socid1",
//     datas.tokId == "tokenid1",
//     !!datas.enterDate
//   );
// });
// getUserAll("nickname2").then((datas) => {
//   console.log(
//     "4",
//     datas.socId == "socid2",
//     datas.tokId == "tokenid2",
//     !!datas.enterDate
//   );
// });
// getUserAll("nickname3").then((datas) => {
//   console.log(
//     "4",
//     datas.socId == "socid3",
//     datas.tokId == "tokenid3",
//     !!datas.enterDate
//   );
// });

// chatEnter("nickname1", "77");

// getNicknamesInRoomSocket("77").then((nicknames) =>
//   console.log("5", arraysEqual(nicknames, ["nickname1"]))
// );

// chatEnter("nickname1", "77");

// getNicknamesInRoomSocket("77").then((nicknames) =>
//   console.log("5", arraysEqual(nicknames, ["nickname1"]))
// );

// chatClose("nickname1", "78");
// getNicknamesInRoomSocket("78").then((nicknames) =>
//   console.log("6", arraysEqual(nicknames, []))
// );

// chatEnter("nickname1", "78");
// getNicknamesInRoomSocket("78").then((nicknames) =>
//   console.log("6", arraysEqual(nicknames, ["nickname1"]))
// );

// chatExit("nickname1", "78");

// getNicknamesInRoomSocket("78").then((nicknames) => console.log("6", arraysEqual(nicknames, [])));
// getNicknamesInRoomToken("78").then((nicknames) => console.log("6", arraysEqual(nicknames, [])));

// chatExit("nickname1", "77");

// getNicknamesInRoomSocket("77").then((nicknames) => console.log("6", arraysEqual(nicknames, [])));
// getNicknamesInRoomToken("77").then((nicknames) => console.log("6", arraysEqual(nicknames, [])));

// ///nickname 1,2,3 exists

// chatEnter("nickname1", "77");
// chatEnter("nickname2", "77");
// chatEnter("nickname3", "77");

// getNicknamesInRoomSocket("77").then((nicknames) => console.log("7", arraysEqual(nicknames, ['nickname1', 'nickname3', 'nickname2'])));
// getNicknamesInRoomToken("77").then((nicknames) => console.log("7", arraysEqual(nicknames, [])));

// chatClose("nickname1","77");
// getNicknamesInRoomSocket("77").then((nicknames) => console.log("7", arraysEqual(nicknames, ['nickname3', 'nickname2'])));
// getNicknamesInRoomToken("77").then((nicknames) => console.log("7", arraysEqual(nicknames, ['nickname1'])));

// Logout("nickname2");
// getNicknamesInRoomSocket("77").then((nicknames) => console.log("7", nicknames));
// getNicknamesInRoomToken("77").then((nicknames) => console.log("7", nicknames));


//1초 뒤 종료
// setTimeout(function () {
//   return process.exit(22);
// }, 100);
