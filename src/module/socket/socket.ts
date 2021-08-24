import { dbconn } from "./../../config/mysql/database";
import { arraysEqual } from "../../config/redis/redis_test";
import { logger as l, logger } from "../../config/winston";
import { sql_room_get, ChatRoom, sql_room_get_map } from "../../types/ChatRoom";
import { sql_message_insert, sql_message_select } from "../../types/Message";
import { send } from "../../config/firebase/firebase";
import {
  chatEnter,
  chatClose,
  chatExit,
  appEnter,
  Logout,
} from "../../types/socket";
import { sql_userid_get, sql_usernicknames } from "../../types/User";
import * as rc from "../../config/redis/redis";
import { sql_host_set } from "../chat/passhost";

export const socket = (io: any, db_conn: any) => {
  io.on("connection", (socket: any) => {
    //#region 방장위임
    socket.on("chatPassHost", (c: any) => {
      //taker_id: 방장 받는사람 고유번호
      l.info(
        "cPassHost " +
          c.room_id +
          " " +
          c.taker_id +
          " " +
          socket.id +
          " " +
          c.host_id
      );
      if (!c.room_id || !c.taker_id || !socket.id || !c.host_id) return;
      else sql_host_set(db_conn, c.room_id, c.taker_id, c.host_id);
    });
    //#endregion
    //#region chatEnter 채팅방 접속
    // data : c.room_id c.nickname
    socket.on("chatEnter", (c: any) => {
      l.info("cEnter " + c.room_id + " " + c.nickname + " " + socket.id);
      chatEnter(c.nickname, c.room_id);
      // 채팅방 채팅 "들어갔음" 소켓 전송
      rc.getNicknamesInRoomSocket(c.room_id).then((nicknames: any) => {
        nicknames.map((nickname: any) =>
          rc.getUserSocId(nickname).then((socid: any) =>
            io.to(socid).emit("chatEnter", {
              nickname: c.nickname,
              date: new Date(),
            })
          )
        );
      });
      //접속한 사용자에게 이전 메세지 전달
      //#region SELECT MESSAGE
      sql_message_select(db_conn, c.room_id).then((r: any) => {
        io.to(socket.id).emit("chatEnter chat", {
          data: r,
        });
      });
      //#endregion SELECT MESSAGE
    });
    //#endregion chatEnter 채팅방 접속

    //#region chatClose 채팅방 닫기 (fcm활성화)
    // data : c.room_id c.nickname
    socket.on("chatClose", (c: any) => {
      l.info("cC " + c.room_id + " " + c.nickname + " " + socket.id);
      chatClose(c.nickname, c.room_id);
    });
    //#endregion chatClose 채팅방 나가기

    //#region chatExit 채팅방 나가기
    socket.on("chatExit", (c: any) => {
      l.info("cExit " + c.room_id + " " + c.nickname);
      chatExit(c.nickname, c.room_id);
    });
    //#endregion chatExit 채팅방 나가기
    //#region 유저 방 목록 가져오기
    socket.on("chatRooms", (c: { nickname: string }) => {
      if (!!c.nickname)
        rc.getRoomidsInUser(c.nickname).then((roomids: any) => {
          //#region Get ROOM
          if (!arraysEqual(roomids, [])) {
            let val = sql_room_get(roomids);
            // console.log("roomids:", roomids, "val:", val);
            if (
              val !== undefined &&
              val !== null &&
              roomids !== null &&
              roomids !== undefined
            )
              db_conn.query(val, (err: any, chatRooms: any) => {
                //ERROR
                // console.log("isArray:", Array.isArray(chatRooms));

                //현재인원 추가하기
                try {
                  let maxlength = chatRooms.length - 1;
                  let chatRoomsNow: ChatRoom[] = [];
                  if (Array.isArray(chatRooms)) {
                    if (err) {
                      l.error("chatRooms connecting: err val " + err.stack);
                      console.log("val:", val);
                      console.log("chatRooms:", chatRooms);
                      return;
                    } else if (!chatRooms) {
                      l.error(
                        "chatRooms connecting: no chatRooms" +
                          err.stack +
                          " val:",
                        val,
                        " chatRooms:",
                        chatRooms
                      );
                      return;
                    }
                    if (chatRooms.length === 0 || chatRooms.length === undefined || chatRooms.length === null)
                      io.to(socket.id).emit("chatRooms", {
                        chatRooms: [],
                      });
                    chatRooms.map(async (chatRoom, i) => {
                      let length = await rc.getLengthInRoomUsers(chatRoom.id);
                      chatRoomsNow.push({ ...chatRoom, current: length });
                      // console.log("length:",length,"i:",i,"val:",val,"chatRooms:",chatRooms.length)
                      if (maxlength == i) {
                        io.to(socket.id).emit("chatRooms", {
                          chatRooms: chatRoomsNow,
                        });
                      }
                    });
                  } else {
                    io.to(socket.id).emit("chatRooms", {
                      chatRooms: [],
                    });
                  }
                } catch (e: any) {
                  logger.warn("chatRooms Err:" + e);
                  io.to(socket.id).emit("chatRooms", {
                    chatRooms: [],
                  });
                }
              });
          } else {
            // console.log("Rooms NULL");
            io.to(socket.id).emit("chatRooms", {
              chatRooms: [],
            });
          }
          //#endregion Get ROOM
        });
    });
    //#endregion 유저 방 목록 가져오기

    //#region appEnter 앱 접속
    // data :  nickname  token
    socket.on("appEnter", (c: any) => {
      l.info("aE " + c.nickname + " " + socket.id);
      appEnter(c.nickname, socket.id, c.token);
    });
    //#endregion appEnter 앱 접속

    //#region chat 사용자 채팅 전송
    type ChatProps = {
      room_id: string;
      nickname: string;
      msg: string;
      msg_type: string;
      firebaseToken: string;
      icon?: string;
    };
    socket.on("chat", (c: ChatProps) => {
      // 방안에 모든 유저에게 메세지 및 알림을 전송
      //c.room_id
      l.info(
        "chat " +
          c.room_id +
          " " +
          c.nickname +
          " " +
          c.msg +
          " " +
          c.msg_type +
          " " +
          socket.id
      );
      //socket 방안에 접속해 있는 유저에게 채팅전송
      rc.getNicknamesInRoomSocket(c.room_id).then((nicknames: any) =>
        nicknames.map((nickname: any) =>
          rc.getUserSocId(nickname).then((socid: any) =>
            io.to(socid).emit("chat", {
              nickname: c.nickname,
              chatTime: new Date(),
              msg: c.msg,
              msg_type: c.msg_type,
              icon: c.icon,
            })
          )
        )
      );

      //token은 현재 채팅을하진 않지만 들어가 있는 채팅방 멤버 => FCM알림
      rc.getNicknamesInRoomToken(c.room_id).then((nicknames: any) =>
        nicknames.map((nickname: any) =>
          rc.getUserTokId(nickname).then((tokid: any) =>
            send({
              clientToken: tokid,
              title: c.nickname,
              mesage: c.msg_type === "NORMAL" ? c.msg : "(IMAGE)",
              // click_action: "string",
              // icon: ""
            })
          )
        )
      );

      //mysql에 채팅 데이터 저장
      //#region GET USER ID
      sql_userid_get(db_conn, c.nickname).then((id) => {
        if (!!id[0]) {
          let user_id = id[0].id;
          //#region INSERT MESSAGE
          sql_message_insert(
            db_conn,
            c.msg,
            c.msg_type,
            user_id,
            Number(c.room_id),
            user_id
          );
          //#endregion INSERT MESSAGE
        }
      });
      //#endregion GET USER ID
    });
    // #endregion 사용자 채팅 전송

    //#region disconnect 앱 종료
    // 사용자 어플에서 종료, 많은 소켓 disconnect가 한번에 들어옴.
    socket.on("disconnect", () => {
      l.info("disc " + socket.id);
      //socet to token
      rc.getNicknameBySocket(socket.id).then((nickname: any) => {
        if (!nickname) return;
        rc.getRoomidsInUser(nickname).then((rooms: any) =>
          rooms.map((room: any) => chatClose(nickname, room))
        );
      });
      // rc.getUserAll()
      //   (socket.id).then((nickname) =>
      //   chatClose(nickname, nickname)
      // );
      //socket delete
      rc.removeSocket(socket.id);
    });
    //#endregion 앱 종료

    //#region logout 로그아웃
    socket.on("logout", (c: { nickname: string }) => {
      Logout(c.nickname);
      l.info("logu " + c.nickname + " " + socket.id);
    });
    //#endregion logout 로그아웃

    //#region 지도 데이터
    socket.on(
      "chatRoomsInMap",
      (c: {
        minLat: number;
        maxLat: number;
        minLon: number;
        maxLon: number;
      }) => {
        //#region Get ROOM map
        if (
          c.maxLat === null ||
          c.maxLat === undefined ||
          c.maxLon === null ||
          c.maxLon === undefined ||
          c.minLat === null ||
          c.minLat === undefined ||
          c.minLon === null ||
          c.minLon === undefined
        ) {
          l.warn("chatRoomsInMap null taken");
          io.to(socket.id).emit("chatRoomsInMap", {
            chatRooms: [],
          });
          return;
        } else
          db_conn.query(
            sql_room_get_map,
            [
              c.maxLat,
              c.maxLon,
              c.minLat,
              c.minLon,
              c.maxLat,
              c.maxLon,
              c.minLat,
              c.minLon,
            ],
            (err: any, chatRooms: ChatRoom[]) => {
              if (err) {
                l.error("error connecting: " + err.stack);
                l.error("sql_room_get_map:", sql_room_get_map);
                l.error(
                  "lat lon:",
                  c.maxLat,
                  c.maxLon,
                  c.minLat,
                  c.minLon,
                  c.maxLat,
                  c.maxLon,
                  c.minLat,
                  c.minLon
                );
                return;
              }
              //현재인원 추가하기
              try {
                let maxlength = chatRooms.length - 1;
                let chatRoomsNow: ChatRoom[] = [];
                chatRooms.map(async (chatRoom, i) => {
                  let length = await rc.getLengthInRoomUsers(chatRoom.id);
                  chatRoomsNow.push({ ...chatRoom, current: length });
                  if (maxlength == i) {
                    io.to(socket.id).emit("chatRoomsInMap", {
                      chatRooms: chatRoomsNow,
                    });
                  }
                });
              } catch (e: any) {
                logger.warn("chatRooms Err:" + e);
                 io.to(socket.id).emit("chatRoomsInMap", {
                      chatRooms: [],
                    });
              }
            }
          );
        //#endregion Get ROOM map
      }
    );
    //#endregion 지도 데이터

    //#region 채팅방 정보 유저들 정보를 반환
    socket.on("chatRoomsInUsers", async (c: { room_id: any }) => {
      let nicknames = await rc.getNicknamesInRoomSocket(c.room_id);
      nicknames = nicknames.concat(await rc.getNicknamesInRoomToken(c.room_id));
      db_conn.query(
        sql_usernicknames(nicknames),
        (err: any, chatUsers: any) => {
          if (err) {
            l.error("error connecting: " + err.stack);
            return;
          }
          io.to(socket.id).emit("chatRoomsInUsers", {
            chatUsers: chatUsers,
          });
        }
      );
    });
    //#endregion 채팅방 정보 유저들 정보를 반환

    //#region 유저 한명의 정보를 반환
    socket.on("aUser", async (c: { user_nickname: string }) => {
      db_conn.query(
        sql_usernicknames([c.user_nickname]),
        (err: any, User: any) => {
          if (err) {
            l.error(
              "error aUser connecting: " + c.user_nickname + " " + err.stack
            );
            return;
          }
          io.to(socket.id).emit("aUser", {
            User: User,
          });
        }
      );
    });
    //#endregion 채팅방 정보 유저들 정보를 반환

    //#region 강퇴하기
    socket.on(
      "kickUser",
      async (c: { room_id: any; nickname: string; hostname: string }) => {
        rc.removeNicknameInRoomSocket(c.room_id, c.nickname);
        rc.removeNicknameInRoomToken(c.room_id, c.nickname);
        rc.removeRoomidInUser(c.nickname, c.room_id);
        //강퇴 당한 사람에게 소켓전송
        rc.getUserSocId(c.nickname).then((socid: any) =>
          io
            .to(socid)
            .emit("kicked", { hostname: c.hostname, room_id: c.room_id })
        );
        //강퇴 당한 사람에게 FCM전송
        rc.getUserTokId(c.nickname).then((tokid: any) =>
          send({
            clientToken: tokid,
            title: c.hostname + " 유저의 방",
            mesage: "해당 유저의 방에서 강퇴 당하셨습니다. 방번호:" + c.room_id,
            // click_action: "string",
            // icon: ""
          })
        );
        //강퇴하고 나서 유저 목록을 해당방 유저들한테 다시 전송함
        let nicknames = await rc.getNicknamesInRoomSocket(c.room_id);
        nicknames = nicknames.concat(
          await rc.getNicknamesInRoomToken(c.room_id)
        );
        db_conn.query(
          sql_usernicknames(nicknames),
          (err: any, chatUsers: any) => {
            if (err) {
              l.error("error connecting: " + err.stack);
              return;
            }
            nicknames.map((nickname: any) =>
              rc.getUserSocId(nickname).then((socid: any) =>
                io.to(socket.id).emit("chatRoomsInUsers", {
                  chatUsers: chatUsers,
                })
              )
            );
          }
        );
      }
    );
    //#endregion 강퇴하기
  });
};
