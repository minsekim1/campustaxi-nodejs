//#region Socket Token API

type Connection = {
  room_id: string;
  nickname: string;
  firebaseToken: string;
  socket_id: string;
  enterTime: Date;
};
//#region  생성자
const Connection = (
  room_id: string,
  nickname: string,
  firebaseToken: string,
  socket_id: string
): Connection => {
  return {
    room_id: room_id,
    nickname: nickname,
    firebaseToken: firebaseToken,
    socket_id: socket_id,
    enterTime: new Date(),
  };
};
//#endregion 생성자

export var ch = {
  sockets: new Map<string, Connection>(), //key: socket_id
  rooms: new Map<string, Connection[]>(), //key: room_id
  tokens: new Map<string, Connection>(), //key: firebaseToken
  users: new Map<string, Connection>(), //key: nickname
};
//socket.on("enter", (conn: any)=>{
// data : room_id, username(nickname) firebaseToken
export const addSocket = async (
  nickname: string,
  socket_id: string,
  room_id: string
) => {
  // sockets add
  ch.sockets.set(socket_id, Connection(room_id, nickname, "", socket_id));
  // rooms add
  let conns = ch.rooms.get(room_id);
  if (!conns)
    ch.rooms.set(room_id, [Connection(room_id, nickname, "", socket_id)]);
  else
    ch.rooms.set(
      room_id,
      conns.concat(Connection(room_id, nickname, "", socket_id))
    );
  return Connection(room_id, nickname, "", socket_id);
};
export const closeSocket = async (socket_id: string) => {
  let con = ch.sockets.get(socket_id);
  if (!!con) {
    let room_conns = ch.rooms.get(con.room_id);
    if (room_conns) {
      let setroom = room_conns?.filter(
        (room_conn) => room_conn.nickname != con?.nickname
      );
      if (!setroom.length) {
        //빈 배열
        ch.rooms.delete(con.room_id);
      } else {
        //남은 배열
        ch.rooms.set(con.room_id, setroom);
      }
    }
    ch.sockets.delete(con.socket_id);
  }
  return con;
};

export const addToken = async (nickname: string, token: string) => {
  // tokens add
  ch.tokens.set(token, Connection("", nickname, token, ""));
  // users add
  ch.users.set(nickname, Connection("", nickname, token, ""));
  return Connection("", nickname, token, "");
};
export const closeToken = (token: string) => {
  let con = ch.tokens.get(token);
  if (!!con) {
    ch.tokens.delete(con.firebaseToken);
    ch.users.delete(con.nickname);
  }
};

//#endregion Socket Token API

export type Socket = {
  id: number;
  created_at: Date;
  updated_at: Date;
  socket_id: string; //40자
  room_id: number;
  nickname: number;
};
