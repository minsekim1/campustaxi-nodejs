const sql_insert =
  "INSERT INTO `campustaxi_db`.`fbtoken_tb` (`created_at`, `updated_at`, `firebaseToken`, `room_id`, `nickname`) VALUES (NOW(), NOW(), (?), (?), (?));";

	//#region INSERT FBTOKEN
export const sql_fbtoken_insert = (
  db_conn: any,
  firebaseToken: FBToken["firebaseToken"],
  room_id: FBToken["room_id"],
  nickname: FBToken["nickname"],
) => {
  db_conn.query(
    sql_insert,
    [firebaseToken, room_id, nickname],
    (err: any, results: any) => {
      if (err) {
        console.error("error connecting: " + err.stack);
        return;
      }
      // console.log("results", results);
    }
  );
};

//#endregion INSERT FBTOKEN

export type FBToken = {
  id: number;
  created_at: Date;
  updated_at: Date;
  firebaseToken: string; //40자
  room_id: number;
  nickname: number;
};