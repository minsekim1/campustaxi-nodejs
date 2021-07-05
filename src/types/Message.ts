const sql_insert =
  "INSERT INTO `campustaxi_db`.`massage_tb` (`created_at`, `updated_at`, `massage`, `massage_type`, `is_deleted`, `created_by_id`, `room_id`, `updated_by_id`) VALUES (NOW(), NOW(), (?), (?), 0, (?), (?), (?));";
const sql_select =
  "SELECT @rownum:=@rownum+1 as 'index', u.nickname as writer, m.massage as message, m.created_at, m.updated_at, m.room_id, u.imagepath, m.massage_type as message_type\
  FROM campustaxi_db.users_tb as u, campustaxi_db.massage_tb as m, (SELECT @rownum :=0) AS r \
  where u.id = m.created_by_id and m.room_id = (?) order by m.created_at"

/*
  //#region INSERT MESSAGE
  sql_message_insert(db_conn,massage,created_by_id,room_id,updated_by_id)
  //#endregion INSERT MESSAGE
  //#region SELECT MESSAGE
  sql_message_select(db_conn,room_id)
  //#endregion SELECT MESSAGE
  */

//#region INSERT MESSAGE
export const sql_message_insert = (
  db_conn: any,
  massage: Message["massage"],
  massage_type: Message["massage_type"],
  created_by_id: Message["created_by_id"],
  room_id: Message["room_id"],
  updated_by_id: Message["updated_by_id"]
) => {
  db_conn.query(
    sql_insert,
    [massage, massage_type, created_by_id, room_id, updated_by_id],
    (err: any, results: any) => {
      if (err) {
        console.error("error connecting: " + err.stack);
        return;
      }
      // console.log("results", results);
    }
  );
};

//#endregion INSERT MESSAGE

//#region SELECT MESSAGE
export const sql_message_select = async (
  db_conn: any,
  room_id: Message["room_id"]
): Promise<Array<Message>> => {
  return new Promise(async (resolve) => {
    // console.log('sql_message_select',room_id,db_conn)
    db_conn.query(sql_select, [room_id], (err: any, results: any) => {
      if (err) {
        console.error("error connecting: " + err.stack);
        resolve([]);
      }
      resolve(results);
    });
  });
};
//#endregion SELECT MESSAGE

export type Message = {
  id: number;
  created_at: Date;
  updated_at: Date;
  massage: string;
  massage_type: string; //"NORMAL" | "NOTICE"; //6자
  is_deleted: 0 | 1;
  deleted_at: Date;
  created_by_id: number;
  room_id: number;
  updated_by_id: number;
};
