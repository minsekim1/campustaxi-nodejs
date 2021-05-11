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
  sockets: new Map<string, Connection>(), //key: socket_id    value: connection
  rooms: new Map<string, { socket: Connection[]; token: Connection[] }>(), //key: room_id      value:token, socket
  tokens: new Map<string, string[]>(), //key: firebaseToken value:room_id[]
  users: new Map<string, { socket: Connection; token: Connection[] }>(), //key: nickname     value: token, socket
};
//앱을 처음 킨상태. 소켓 번호와 토큰 값을 알 수 있다.
export const appEnter = (
  nickname: string,
  socket_id: string,
  token: string
) => {
  //socket set
  let newData_socket = Connection("", nickname, "", socket_id);
  ch.sockets.set(socket_id, newData_socket);
  //user set
  let newData_token = Connection("", nickname, token, "");
  ch.users.set(nickname, { socket: newData_socket, token: [newData_token] });
};
//채팅방을 들어간 상태. fcm은 받지않고 소켓만 통신한다.
export const chatEnter = (
  nickname: string,
  socket_id: string,
  room_id: string
) => {
  let newData = Connection(room_id, nickname, "", socket_id);
  // sockets set
  ch.sockets.set(socket_id, newData);
  // rooms set
  let conns = ch.rooms.get(room_id);
  if (!!conns) {
    let token_other = conns.token.filter((c) => c.nickname != nickname);
    let socket_other = conns.socket.filter((c) => c.nickname != nickname);
    ch.rooms.set(room_id, {
      socket: socket_other.concat(newData),
      token: token_other,
    });
  } else {
    ch.rooms.set(room_id, {
      socket: [newData],
      token: [],
    });
  }
  //users set
  ch.users.set(nickname, {
    socket: newData,
    token:
      ch.users.get(nickname)?.token.filter((c) => c.room_id != room_id) || [],
  });

  return true;
};
//채팅방 소켓을 닫은 상태. fcm만 활성화됌.(앱종료시도 마찬가지)
export const chatClose = (nickname: string, token: string, room_id: string) => {
  //socket => token로 전환
  //room data change
  let newData_token = Connection(room_id, nickname, token, "");
  let room = ch.rooms.get(room_id);
  if (!!room) {
    let token_other = room.token.filter((c) => c.nickname != nickname);
    let socket_other = room.socket.filter((c) => c.nickname != nickname);
    ch.rooms.set(room_id, {
      socket: socket_other,
      token: token_other.concat(newData_token),
    });
  } else {
    console.log("err chatClose room data change", room_id, nickname, token);
  }
  //user data change
  let user = ch.users.get(nickname);
  if (!!user) {
    let token_my_other = user.token.filter((c) => c.room_id != room_id);
    let socket_my = user.socket;
    let newData_socket = Connection("", nickname, "", socket_my.socket_id);
    ch.users.set(room_id, {
      socket: newData_socket,
      token: token_my_other.concat(newData_token),
    });
    //socket set
    let socket_id = user.socket.socket_id;
    ch.sockets.delete(socket_id);
  } else {
    console.log("err chatClose user data change", room_id, nickname, token);
  }
};
//로그아웃을 했을떄만 쓰고, 앱종료에는 chatClose를 쓸것. fcm과 소켓모두 삭제한다.
// *주의: 로그아웃을 한다고 유저가 접속한 모든 방을 exit처리해서는 안된다. 다시 로그인을 했을시 내 채팅방 목록에 떠야하기때문.
export const appExit = (nickname: string) => {
  let my_rooms = ch.users.get(nickname); //socket tokens
  let my_socket = my_rooms?.socket;
  //delete room in socket
  if (!!my_socket) {
    if (my_socket.room_id != "") {
      let room = ch.rooms.get(my_socket.room_id);
      if (!!room) {
        let token_other = room.token.filter((c) => c.nickname != nickname);
        let socket_other = room.socket.filter((c) => c.nickname != nickname);
        ch.rooms.set(my_socket.room_id, {
          socket: socket_other,
          token: token_other,
        });
      }
    }
  }
  //delete rooms in tokens
  let my_tokens = my_rooms?.token;
  
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
