const redis = require("redis");
const rc = redis.createClient({ expire: 3600 });

// DATA SET
//1  (기본)  @soc: socket_id   => nickname
//2  (기본)  @tok: token_id    => nickname
//3  (set)  @roomTok: room_id => nickname[]
//4  (set)  @roomSoc: room_id => nickname[]
//5  (구조체) @usr: nickname    => { socId, tokId, enterDate }
//6	 (set) @usrRoom: nickname => rooms_id[]

// APIs
//1-1 setSocket getNicknameBySocket removeSocket isSocket
//#region
// setSocket('5Ag1qyhZ2kqvs3UnAAABa', 'campustaxiadmin')
// getNicknameBySocket('5Ag1qyhZ2kqvs3UnAAABa').then(nickname=>{})
// removeSocket('5Ag1qyhZ2kqvs3UnAAABa')
// isSocket('5Ag1qyhZ2kqvs3UnAAABa').then(boolean=>{})
//#endregion

//2-1 setToken getNicknameByToken removeToken isToken
//#region
// setToken('5Ag1qyhZ2kqvs3UnAAABa', 'campustaxiadmin')
// getNicknameByToken('5Ag1qyhZ2kqvs3UnAAABa').then(nickname=>{})
// removeToken('5Ag1qyhZ2kqvs3UnAAABa')
// isToken('5Ag1qyhZ2kqvs3UnAAABa').then(boolean=>{})
//#endregion

//3-1 addNicknameInRoomToken getNicknamesInRoomToken removeNicknameInRoomToken isNicknameInRoomToken
//#region
// addNicknameInRoomToken(room_id, 'campustaxiadmin')
// getNicknamesInRoomToken(room_id).then(nicknames=>{})
// removeNicknameInRoomToken(room_id,'campustaxiadmin')
// isNicknameInRoomToken(room_id,'campustaxiadmin').then(boolean=>{})
//#endregion

//4-1 addNicknameInRoomSocket getNicknamesInRoomSocket removeNicknameInRoomSocket isNicknameInRoomSocket
//#region
// addNicknameInRoomSocket(room_id, 'campustaxiadmin')
// getNicknamesInRoomSocket(room_id).then(nicknames=>{})
// removeNicknameInRoomSocket(room_id,'campustaxiadmin')
// isNicknameInRoomSocket(room_id,'campustaxiadmin').then(boolean=>{})
//#endregion

//5-1 setUser getUserAll getUser(4) removeUser isUser
//#region
// setUser('campustaxiadmin', 'campustaxiadmin')
// getUserSocId('campustaxiadmin').then(data=>{})
// getUserTokId('campustaxiadmin').then(data=>{})
// getUserEnterDate('campustaxiadmin').then(data=>{})
// getUserAll('campustaxiadmin').then(datas=>{})
// removeUser('campustaxiadmin')
// isUser('campustaxiadmin').then(boolean=>{})
//#endregion

//6-1 addRoomidInUser getRoomidsInUser removeRoomidInUser removeRoomidInUserAll 
//#region
// addRoomidInUser('campustaxiadmin', room_id)
// getRoomidsInUser('campustaxiadmin').then(room_ids=>{})
// removeRoomidInUser('campustaxiadmin',room_id)
// removeRoomidInUserAll('campustaxiadmin')
//#endregion

//7-1 getLengthInRoomUsers
// getLengthInRoomUsers(room_id).then(length=>{})
//#region 키 유효 설정 3일
const ex = (key: string) => {
  let todayEnd = new Date().setDate(new Date().getDate() + 3);
  rc.expireat(key, String(Math.round(todayEnd / 1000)));
};
//#endregion 키 유효 설정 3일

//#region 1 @soc socket_id => nickname
export const setSocket = (socket_id: string, nickname: string) => {
  rc.set("@soc" + socket_id, nickname);
  ex("@soc" + socket_id);
};
export const getNicknameBySocket = (socket_id: string):Promise<string> => {
  return new Promise((resolve: any) => {
    rc.get("@soc" + socket_id, (e: any, reply: string) => resolve(reply));
  });
}; //return : null | string(nickname)

export const removeSocket = (socket_id: string) => {
  rc.del("@soc" + socket_id);
};
export const isSocket = (socket_id: string) =>
  new Promise((resolve: any) =>
    rc.exists("@soc" + socket_id, (e: any, reply: string) => resolve(reply))
  );
//#endregion SOCKET

//#region 2 @tok token_id => nickname
export const setToken = (token_id: string, nickname: string) => {
  rc.set("@tok" + token_id, nickname);
  ex("@tok" + token_id);
};
export const getNicknameByToken = (token_id: string):Promise<string> => {
  return new Promise((resolve: any) => {
    rc.get("@tok" + token_id, (e: any, reply: string) => resolve(reply));
  });
}; //return : null | string(nickname)

export const removeToken = (token_id: string) => {
  rc.del("@tok" + token_id);
};
export const isToken = (token_id: string) =>
  new Promise((resolve: any) =>
    rc.exists("@tok" + token_id, (e: any, reply: string) => resolve(reply))
  );
//#endregion TOKEN

//#region 3 @roomTok room_id => nickname[]
export const addNicknameInRoomToken = (room_id: string, nickname: string) => {
  rc.sadd("@roomTok" + room_id, nickname);
  ex("@roomTok" + room_id);
};
export const getNicknamesInRoomToken = (room_id: string):Promise<string[]> => {
  return new Promise((resolve: any) => {
    rc.smembers("@roomTok" + room_id, (e: any, reply: string[]) =>
      resolve(reply)
    );
  });
}; //return : null | string[](nicknames)

export const removeNicknameInRoomToken = (
  room_id: string,
  nickname: string
) => {
  rc.srem("@roomTok" + room_id, nickname);
};
export const isNicknameInRoomToken = (room_id: string, nickname: string) =>
  new Promise((resolve: any) =>
    rc.sismember("@roomTok" + room_id, nickname, (e: any, reply: string[]) =>
      resolve(reply)
    )
  );
//#endregion RoomToken

//#region 4 @roomSoc room_id => nickname[]
export const addNicknameInRoomSocket = (room_id: string, nickname: string) => {
  rc.sadd("@roomSoc" + room_id, nickname);
  ex("@roomSoc" + room_id);
};
export const getNicknamesInRoomSocket = (room_id: string):Promise<string[]> => {
  return new Promise((resolve: any) => {
    rc.smembers("@roomSoc" + room_id, (e: any, reply: string[]) =>
      resolve(reply)
    );
  });
}; //return : null | string[](nicknames)

export const removeNicknameInRoomSocket = (
  room_id: string,
  nickname: string
) => {
  rc.srem("@roomSoc" + room_id, nickname);
};
export const isNicknameInRoomSocket = (room_id: string, nickname: string) =>
  new Promise((resolve: any) =>
    rc.sismember("@roomSoc" + room_id, nickname, (e: any, reply: string[]) =>
      resolve(reply)
    )
  );
//#endregion RoomSocket

//#region 5 @usr nickname => { socId, tokId, enterDate }
export const setUser = (nickname: string, socId: string, tokId: string) => {
  rc.hmset(
    "@usr" + nickname,
    "socId",
    socId,
    "tokId",
    tokId,
    "enterDate",
    new Date()
  );
  ex("@usr" + nickname);
};
type usr = {
	socId: string;
	tokId: string;
	enterDate: Date;
}
export const getUserAll = (nickname: string):Promise<usr> => {
  return new Promise((resolve: any) => {
    rc.hgetall("@usr" + nickname, (e: any, reply: string) => resolve(reply));
  });
};
export const getUserSocId = (nickname: string):Promise<string> => {
  return new Promise((resolve: any) => {
    rc.hget("@usr" + nickname, "socId", (e: any, reply: string) =>
      resolve(reply)
    );
  });
};
export const getUserTokId = (nickname: string):Promise<string> => {
  return new Promise((resolve: any) => {
    rc.hget("@usr" + nickname, "tokId", (e: any, reply: string) =>
      resolve(reply)
    );
  });
};
export const getUserEnterDate = (nickname: string):Promise<string> => {
  return new Promise((resolve: any) => {
    rc.hget("@usr" + nickname, "enterDate", (e: any, reply: string) =>
      resolve(reply)
    );
  });
};

export const removeUser = (nickname: string) => {
  rc.del("@usr" + nickname);
};
export const isUser = (nickname: string) =>
  new Promise((resolve: any) =>
    rc.exists("@usr" + nickname, (e: any, reply: string) => resolve(reply))
  );
//#endregion User

//#region 6 @usrRoom: nickname => rooms_id[]
export const addRoomidInUser = (nickname: string, room_id: string) => {
  rc.sadd("@usrRoom" + nickname, room_id);
  ex("@usrRoom" + room_id);
};
export const getRoomidsInUser = (nickname: string):Promise<string[]> => {
  return new Promise((resolve: any) => {
    rc.smembers("@usrRoom" + nickname, (e: any, reply: string[]) =>
      resolve(reply)
    );
  });
}; //return : null | string[](nicknames)

export const removeRoomidInUser = (nickname: string, room_id: string) => {
  rc.srem("@usrRoom" + nickname, room_id);
};
export const removeRoomidInUserAll = (nickname: string) =>
  rc.del("@usrRoom" + nickname);

export const AllKeysDelete = () => {
  rc.flushdb();
}
//#endregion User

//#region 7 getLengthInRoomUsers(room_id).then(length=>{})
export const getLengthInRoomUsers = (room_id: any):Promise<number> =>
  new Promise(async(resolve: any) => {
    let arr1 = await getNicknamesInRoomSocket(room_id)
    let arr2 = await getNicknamesInRoomToken(room_id)
    resolve(arr1.length+arr2.length)
  }
    // rc.exists("@usr" + nickname, (e: any, reply: string) => resolve(reply))
  );
//#endregion

// //Redis Example
// /*
// //// string
// 먼저 가장 일반적인 키-값 문자열입니다. set으로 설정하고 get으로 가져옵니다.
// client.set('name', 'zerocho');
// client.get('name', (err, reply) => {
//   console.log(reply); // zerocho
// });

// //// hash
// 키-해시입니다. 객체를 저장한다고 보시면 됩니다. hmset으로 설정하고 hgetall로 가져옵니다.
// client.hmset('friends', 'name', 'zero', 'age', 24);
// client.hgetall('friends', (err, obj) => {
//   console.log(obj); // { name: 'zero', age: '24' }
// });

// //// list
// 키-배열입니다. 중복 데이터를 허용합니다. rpush는 자바스크립트의 push랑 비슷하고, lpush는 unshift랑 비슷합니다. 가져올 때는 lrange 메소드를 사용하는데요. 0, -1는 처음과 끝 인덱스를 의미합니다. -1이 배열의 가장 끝인건 아시죠? 결과에서 pear가 왜 banana보다 앞에 있는지는 잘 생각해보시기 바랍니다.
// client.rpush('fruits', 'apple', 'orange', 'apple');
// client.lpush('fruits', 'banana', 'pear');
// client.lrange('fruits', 0, -1, (err, arr) => {
//   console.log(arr); // ['pear', 'banana', 'apple', 'orange', 'apple']
// });

// //// set
// 키-셋입니다. 배열과 비슷하지만 중복을 허용하지 않습니다. 고양이가 귀엽기 때문에 두 번 넣어보겠습니다. 하지만 중복은 무시되고, 넣었던 순서와 상관없이 섞인 결과가 출력되었습니다.
// client.sadd('animals', 'dog', 'cat', 'bear', 'cat', 'lion');
// client.smembers('animals', (err, set) => {
//   console.log(set); // ['cat', 'dog', 'bear', 'lion']
// });
// SADD - Sets 타입의 key value 추가 ( 다중 추가 가능  Space 구분 )
// SCARD - Sets에 저장되어있는 요소들의 길이를 반환.
// SMEMBERS - 해당되는 key값 안의 요소들을 출력
// SISMEMBER - 해당 요소가 Sets안에 있다면 1 없다면 0을 반환
// SMOVE - 해당 요소를 다른 key값으로 이동시킨다.
// SPOP - 요소에 저장된 값들중 해당 갯수만큼 랜덤으로 POP.
// SRANDMEMBER - 요소에 저장된 값들중 지정된 count만큼 랜덤 반환 ( count가 없으면 1개 반
// SREM - 저장된 요소중에서 일치하는 요소가 있다면 삭제후 1반환 삭제될요소가 없다면 0을 반환

// //// sorted set
// 키-정렬셋입니다. 셋인데 순서를 정렬할 수 있습니다. 키 순으로 정렬해보겠습니다. 여기서나마 제 키는 180입니다. list와 비슷한 방법으로 데이터를 가져옵니다. 오름차순으로 정렬되는데 내림차순으로 하고싶다면 zrevrange가 있습니다.
// client.zadd('height', 180, 'zero', 168, 'aero', 176, 'nero', 172, 'hero');
// client.zrange('height', 0, -1, (err, sset) => {
//   console.log(sset); // ['aero', 'hero', 'nero', 'zero'
// });

// //// geo
// 키-경도위도입니다. 잘만 사용하면 정말 편리합니다. longitude가 먼저라는 것에 주의합시다. 위치들을 추가한 후 위치간 거리나 특정 좌표 중심으로 해당하는 지역을 구할 수 있습니다.
// client.geoadd('cities', 126.97, 37.56, 'seoul', 129.07, 35.17, 'busan', 126.70, 37.45, 'incheon');
// client.geodist('cities', 'seoul', 'busan', (err, dist) => {
//   console.log(dist); // 325619.5465
// });
// client.georadius('cities', 126.8, 37.5, 50, 'km', (err, cities) => {
//   console.log(cities); // ['incheon', 'seoul']
// });

// 기타 명령어
// 지우기
// client.del('name');
// 키가 존재하는 지 확인
// client.exists('name');
// 키 이름을 바꾸는 명령어
// client.rename('animals', 'pets');
// */
