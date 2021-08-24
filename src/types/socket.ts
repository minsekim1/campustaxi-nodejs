import { logger } from "../config/winston";
import * as rc from "./../config/redis/redis";
import { strOrNull } from "./basic";

//앱을 처음 킨상태. 소켓 번호와 토큰 값을 알 수 있다.
export const appEnter = async (
  nickname: strOrNull,
  socket_id: strOrNull,
  token: strOrNull
) => {
  if (nickname != (null || undefined) && socket_id != (null || undefined) && token != (null || undefined)) {
    // @soc @tok reset 이미 유저 정보가 있다면 소켓/토큰을 지운다.
    rc.getUserSocId(nickname).then((tokid) => rc.removeToken(tokid))
    rc.getUserSocId(nickname).then((socid) => rc.removeSocket(socid))
    // @soc @tok @usr set
    rc.setSocket(socket_id, nickname);
    rc.setToken(token, nickname);
    rc.setUser(nickname, socket_id, token);
  } else
    logger.warn('Err appEnter ' + "deleteced undefined or null:" + 'nickname/' + nickname + '/socket_id/' + socket_id + '/token/' + token)
};
//해당 방 들어가기. fcm은 받지않고 소켓만 통신한다.
export const chatEnter = async (nickname: strOrNull, room_id: strOrNull) => {
  if (nickname != (null || undefined) && room_id != (null || undefined)) {
    //rooms set
    //@roomSoc @roomTok set
    rc.addNicknameInRoomSocket(room_id, nickname);
    rc.removeNicknameInRoomToken(room_id, nickname);
    //@soc @tok @usr @usrRoom set
    rc.addRoomidInUser(nickname, room_id);
  } else
    logger.warn('Err chatEnter ' + "deleteced undefined or null:" + 'nickname/' + nickname + '/room_id/' + room_id)
};
//채팅방 소켓 닫기. fcm만 활성화됌.
export const chatClose = async (nickname: strOrNull, room_id: strOrNull) => {
  if (nickname != (null || undefined) && room_id != (null || undefined)) {
    rc.getNicknamesInRoomSocket(room_id).then((nicknames) => {
      if (nicknames.includes(nickname)) {
        rc.removeNicknameInRoomSocket(room_id, nickname);
        rc.addNicknameInRoomToken(room_id, nickname);
      }
    });
  } else
    logger.warn('Err chatClose ' + "deleteced undefined or null:" + 'nickname/' + nickname + '/room_id/' + room_id)
};
//채팅방 모든 소켓 닫기. fcm만 활성화됌.(앱종료 또는 앱백그라운드)
export const chatCloseAll = async (socket_id: strOrNull) => {
  if (socket_id != (null || undefined)) {
    rc.getNicknameBySocket(socket_id).then((nickname) => {
      rc.getRoomidsInUser(nickname).then((roomids) => {
        roomids.map((roomid) => {
          rc.removeNicknameInRoomSocket(roomid, nickname);
          rc.addNicknameInRoomToken(roomid, nickname);
        });
      });
    });
  } else
    logger.warn('Err chatCloseAll ' + "deleteced undefined or null:" + 'socket_id/' + socket_id)
};
//해당 방 나가기, fcm, socket 모두 삭제
export const chatExit = async (nickname: strOrNull, room_id: strOrNull) => {
  if (nickname != (null || undefined) && room_id != (null || undefined)) {
    rc.removeNicknameInRoomSocket(room_id, nickname);
    rc.removeNicknameInRoomToken(room_id, nickname);
    rc.removeRoomidInUser(nickname, room_id);
  } else
    logger.warn('Err chatExit ' + "deleteced undefined or null:" + 'nickname/' + nickname + '/room_id/' + room_id)
};

//로그아웃을 했을떄만 쓰고, 앱종료에는 chatClose를 쓸것. fcm과 소켓모두 삭제한다.
// *주의: 로그아웃을 한다고 유저가 접속한 모든 방을 exit처리해서는 안된다. 다시 로그인을 했을시 내 채팅방 목록에 떠야하기때문.
export const Logout = (nickname: strOrNull) => {
  if (nickname != (null || undefined)) {
    rc.getRoomidsInUser(nickname).then((roomids) => {
      roomids.map((roomid) => {
        //@roomSoc @roomTok delete
        rc.removeNicknameInRoomSocket(roomid, nickname);
        rc.removeNicknameInRoomToken(roomid, nickname);
      });
      //@soc @tok delete
      rc.getUserTokId(nickname).then((tokid) => rc.removeToken(tokid));
      rc.getUserSocId(nickname).then((socid) => rc.removeSocket(socid));
      rc.setUser(nickname, "", "");
      // rc.removeRoomidInUserAll(nickname); => 유저 방목록은 남김
      // rc.removeUser(nickname);
    });
  } else
    logger.warn('Err Logout ' + "deleteced undefined or null:" + 'nickname/' + nickname)
};

//#endregion Socket Token API
