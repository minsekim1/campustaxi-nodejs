export const sql_room_insert =
	"INSERT INTO `campustaxi_db`.`rooms_tb` (`created_at`, `updated_at`, `start_address_code`, `start_address`, `start_address_detail`, `start_lat`, `start_lon`, `end_address_code`, `end_address`, `end_address_detail`, `end_lat`, `end_lon`, `boarding_dtm`, `personnel_limit`, `gender`, `is_deleted`, `owner_id`, `category_id`) VALUES (NOW(), NOW(), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), (?), 0, (?), (?));"


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
};
