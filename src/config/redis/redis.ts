// export const redis = require("redis");
// export const rc = redis.createClient({ expire: 3600 });

// // DATA SET
// // 	 socket: socket_id , nickname
// //   room: (type:socket,token) room_id , nickname[]
// //   user: nickname rooms_id[] socket_id token_id enterDate

// //#region 키 유효 설정 3일
// const ex = (key: string) => {
//   let todayEnd = new Date().setHours(71, 59, 59, 999);
//   rc.expireat(key, todayEnd / 1000);
// };
// //#endregion 키 유효 설정 3일

// //#region SOCKET socket_id<=>nickname
// const setSocket = (socket_id: string, nickname: string) => {
//   rc.set("@&socket" + socket_id, nickname);
//   ex("@&socket" + socket_id);
// };

// const getSocketToNickname = (socket_id: string) => {
//   return rc.get("@&socket" + socket_id);
// };
// //#endregion SOCKET

// //#region ROOMS
// const addRoomClient = (
//   type: "token" | "socket",
//   room_id: string,
//   nickname: string
// ) => {
//   rc.rpush("@&room_" + type + room_id, nickname);
//   ex("@&room_" + type + room_id);
// };
// const removeRoomClient = (
//   type: "token" | "socket",
//   room_id: string,
//   nickname: string
// ) => {
//   rc.lrem("@&room_" + type + room_id, 1, nickname);
// };
// //#endregion ROOMS

// //#region User
// const setUserClient = (
//   nickname: string,
//   socket_id: string,
//   token_id: string
// ) => {
//   rc.hmset(
//     "@&user" + nickname,
//     "rooms_id",
//     [],
//     "socket_id",
//     socket_id,
//     "token_id",
//     token_id,
//     "enterDate",
//     new Date()
//   );
//   ex("@&user" + nickname);
// };
// const getUserClient = (
//   nickname: string,
// ) => {
//   return rc.hgetall(
//     "@&user" + nickname
//     // (err:any,obj:any)=>console.log('getUserClient',obj)
//   );
// };

// //#endregion User

// //Example
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
