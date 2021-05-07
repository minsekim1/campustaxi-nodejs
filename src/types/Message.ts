export const sql_message_insert =
	"INSERT INTO `campustaxi_db`.`massage_tb` (`created_at`, `updated_at`, `massage`, `massage_type`, `is_deleted`, `created_by_id`, `room_id`, `updated_by_id`) VALUES (NOW(), NOW(), (?), 'NORMAL', 0, (?), (?), (?));";
export const sql_message_select =
	"INSERT INTO `campustaxi_db`.`massage_tb` (`created_at`, `updated_at`, `massage`, `massage_type`, `is_deleted`, `created_by_id`, `room_id`, `updated_by_id`) VALUES (NOW(), NOW(), (?), 'NORMAL', 0, (?), (?), (?));";

/*

//#region INSERT MESSAGE
db_conn.query(sql_message_insert, [massage,created_by_id,room_id,updated_by_id], (err: any, results: any) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("results", results);
});
//#endregion INSERT MESSAGE

*/


export type Message = {
  id: number;
  created_at: Date;
  updated_at: Date;
  massage: string;
  massage_type: 'NORMAL' | "NOTICE"; //6자
  is_deleted: 0 | 1;
  deleted_at: Date;
  created_by_id: number;
  room_id: number;
  updated_by_id: number;
};
