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
  sockets: new Map<string, string>(), //key: socket_id    value: nickname
  rooms: new Map<string, { socket: Connection[]; token: Connection[] }>(), //key: room_id      value:token, socket
  users: new Map<
    string,
    {
      socket: Connection | undefined;
      token: Connection[];
      socket_id: string;
      token_id: string;
      enterDate: Date;
    }
  >(), //key: nickname     value: token, socket
};
//앱을 처음 킨상태. 소켓 번호와 토큰 값을 알 수 있다.
export const appEnter = async (
  nickname: string,
  socket_id: string,
  token: string
) => {
  // sockets set
  ch.sockets.set(socket_id, nickname);
  // user set
  try {
    ch.users.set(nickname, {
      socket: undefined,
      token: [],
      socket_id: socket_id,
      token_id: token,
      enterDate: new Date(),
    });
    return true;
  } catch (e) {
    console.log("appEnter err:", e);
    return false;
  }
};
//채팅방을 들어간 상태. fcm은 받지않고 소켓만 통신한다.
export const chatEnter = async (nickname: string, room_id: string) => {
  try {
    let origin = ch.users.get(nickname);
    if (!!origin) {
      // rooms set
      let newData = Connection(room_id, nickname, "", origin.socket_id);
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
        token: origin.token.filter((c) => c.room_id != room_id) || [],
        socket_id: origin.socket_id,
        token_id: origin.token_id,
        enterDate: origin.enterDate,
      });
    }
    return true;
  } catch (e) {
    console.log("chatEnter err:", e);
    return false;
  }
};
//채팅방 소켓을 닫은 상태. fcm만 활성화됌.(앱종료시도 마찬가지)
export const chatClose = async (socket_id: string) => {
  //nickname: string, room_id: string
  try {
    //socket => token로 전환
    let nickname = ch.sockets.get(socket_id);
    if (!!nickname) {
      let origin = ch.users.get(nickname);
      if (!!origin) {
        let room_id = origin.socket?.room_id;
        if (!!room_id) {
          //room set
          let newData_token = Connection(
            room_id,
            nickname,
            origin.token_id,
            ""
          );
          let room = ch.rooms.get(room_id);
          if (!!room) {
            let token_other = room.token.filter((c) => c.nickname != nickname);
            let socket_other = room.socket.filter(
              (c) => c.nickname != nickname
            );
            ch.rooms.set(room_id, {
              socket: socket_other,
              token: token_other.concat(newData_token),
            });
          } else {
            console.log("err chatClose room data change", room_id, nickname);
          }

          //user set
          let token_my_other = origin.token.filter((c) => c.room_id != room_id);
          ch.users.set(nickname, {
            socket: undefined,
            token: token_my_other.concat(newData_token),
            socket_id: origin.socket_id,
            token_id: origin.token_id,
            enterDate: origin.enterDate,
          });
        } else {
          console.log("err chatClose user data change", room_id, nickname);
        }
      }
    }
    return true;
  } catch (e) {
    console.log("chatClose err:", e);
    return false;
  }
};
//로그아웃을 했을떄만 쓰고, 앱종료에는 chatClose를 쓸것. fcm과 소켓모두 삭제한다.
// *주의: 로그아웃을 한다고 유저가 접속한 모든 방을 exit처리해서는 안된다. 다시 로그인을 했을시 내 채팅방 목록에 떠야하기때문.
export const Logout = async (socket_id: string) => {
  try {
    let nickname = ch.sockets.get(socket_id);
    if (!!nickname) {
      let origin = ch.users.get(nickname);
      if (!!origin) {
        let my_socket = origin?.socket;
        //delete room in socket
        if (!!my_socket) {
          if (my_socket.room_id != "") {
            let room = ch.rooms.get(my_socket.room_id);
            if (!!room) {
              let sockets = room.socket.filter((c) => c.nickname != nickname);
              let tokens = room.token.filter((c) => c.nickname != nickname);
              if (sockets.length == 0 && tokens.length == 0)
                ch.rooms.delete(my_socket.room_id);
              else
                ch.rooms.set(my_socket.room_id, {
                  socket: sockets,
                  token: tokens,
                });
            }
          }
        }
        //delete rooms in tokens
        let my_rooms_tokens = origin?.token;
        if (!!my_rooms_tokens) {
          my_rooms_tokens.map((my_room) => {
            if (my_room.room_id != "") {
              let room = ch.rooms.get(my_room.room_id);
              if (!!room) {
                let sockets = room.socket.filter((c) => c.nickname != nickname);
                let tokens = room.token.filter((c) => c.nickname != nickname);
                if (sockets.length == 0 && tokens.length == 0)
                  ch.rooms.delete(my_room.room_id);
                else
                  ch.rooms.set(my_room.room_id, {
                    socket: sockets,
                    token: tokens,
                  });
              }
            }
          });
        }
        // socket && token delete
        ch.sockets.delete(origin.socket_id);
        // user delete
        ch.users.delete(nickname);
      } else {
        console.log("err appExit", socket_id);
      }
    }
    return true;
  } catch (e) {
    console.log("appExit err:", e);
    return false;
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
