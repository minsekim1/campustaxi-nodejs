export const sql_room_insert =
  "INSERT INTO `campustaxi_db`.`rooms_tb` (`created_at`, `updated_at`, `start_address_code`, `start_address`, `start_address_detail`, `start_lat`, `start_lon`, `end_address_code`, `end_address`, `end_address_detail`, `end_lat`, `end_lon`, `boarding_dtm`, `personnel_limit`, `gender`, `is_deleted`, `owner_id`, `category_id`) VALUES (NOW(), NOW(), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), 0, (?), (?));";

export const sql_room_get = (roomids: string[]) => {
  if (!!roomids[0]) {
    let query =
      "select r.id, r.created_at, r.start_address, r.start_address_code, r.start_address_detail, r.end_address, r.end_address_code, r.end_address_detail, r.end_lat, r.end_lon, start_lat, r.start_lon, r.boarding_dtm, r.personnel_limit, r.gender, r.category_id, u.imagepath, nickname as owner from campustaxi_db.rooms_tb as r, campustaxi_db.users_tb as u where r.owner_id=u.id and (r.id = " +
      roomids[0];
    roomids.map((roomid, i) => {
      if (i != 0) query += " OR r.id=" + roomid;
    });
    query += ");"
    return query;
  } else return null;
};
export const sql_room_get_map =
  "select r.created_at, r.id, r.start_address, r.start_address_code,r.start_address_detail,r.end_address,r.end_address_code,r.end_address_detail,r.end_lat,r.end_lon,start_lat,r.start_lon,r.boarding_dtm,r.personnel_limit,r.gender,r.category_id,u.imagepath, nickname as owner from campustaxi_db.rooms_tb as r, campustaxi_db.users_tb as u where r.owner_id=u.id and r.boarding_dtm >= NOW() and r.boarding_dtm <= DATE_ADD(NOW(), INTERVAL +3 DAY) and ((r.end_lat < (?) and r.end_lon < (?) and r.end_lat > (?) and r.end_lon > (?)) or (r.start_lat < (?) and r.start_lon < (?) and r.start_lat > (?) and r.start_lon > (?))) ORDER BY r.boarding_dtm desc limit 100";
/*

//#region INSERT ROOM
db_conn.query(sql_room_insert, [start_address_code,start_address,start_address_detail,start_lat,start_lon,end_address_code,end_address,end_address_detail,end_lat,end_lon,boarding_dtm,personnel_limit,gender,owner_id,category_id  ], (err: any, results: any) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("results", results);
});
//#endregion INSERT ROOM

//#region Get ROOM
db_conn.query(sql_room_get([roomids]), (err: any, results: any) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("results", results);
});
//#endregion Get ROOM

//#region Get ROOM map
db_conn.query(sql_room_get_map,
    [max_lat,max_lon, min_lat, min_lon
    ,max_lat,max_lon, min_lat, min_lon],
     (err: any, results: any) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("results", results);
});
//#endregion Get ROOM map


*/

export type ChatRoom = {
  id: number;
  created_at: Date;
  updated_at: Date;
  start_address_code: string; // 5
  start_address: string; // 100
  start_address_detail: string; // 50
  start_lat: number; // 정수:9 소수점:6자
  start_lon: number; // 정수:9 소수점:6자
  end_address_code: string; // 5
  end_address: string; // 100
  end_address_detail: string; // 50
  end_lat: number; // 정수:9 소수점:6자
  end_lon: number; // 정수:9 소수점:6자
  boarding_dtm: Date;
  personnel_limit: number;
  gender: "FEMALE" | "MALE" | "NONE"; // 6
  is_deleted: 0 | 1;
  deleted_at: Date;
  created_by_id: number;
  owner_id: number;
  category_id: number;
  updated_by_id: number;
  current?: number;
};
