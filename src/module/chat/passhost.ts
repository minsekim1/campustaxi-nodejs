const sql_update =
  "UPDATE campustaxi_db.rooms_tb as r\
  SET r.owner_id = (?), r.updated_at = NOW(), updated_by_id = (?)\
    where r.id = (?)";

export const sql_host_set = async (
  db_conn: any,
  room_id: string,
  taker_id: string,
  host_id: string
): Promise<string> => {
  return new Promise(async (resolve) => {
    db_conn.query(sql_update, [taker_id,host_id,room_id], (err: any, results: any) => {
      if (err) {
        console.error("error connecting: " + err.stack);
        resolve(err);
      }
      resolve(results);
    });
  });
};
