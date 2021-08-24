import { OkPacket } from "mysql";
import { ChatRoom } from "./../../types/ChatRoom";
export const createRoom_sql = async (db_conn: any, room: any): Promise<any> => {
  return new Promise(async (resolve) => {
    query(db_conn, createRoom_query1, "createRoom_sql1", [
      room.start_address,
      room.start_address_detail,
      room.start_lat,
      room.start_lon,
      room.end_address,
      room.end_address_detail,
      room.end_lat,
      room.end_lon,
      BoardingDTMtoMysqlDate(room.boarding_dtm),
      room.personnel_limit,
      room.gender,
      room.category,
      room.owner,
      room.owner,
      room.theme,
    ]).then((re: OkPacket | any) => {
      if (typeof re.insertId === "number")
        query(db_conn, createRoom_query2, "createRoom_sql2", [
          re.insertId,
        ]).then((r) => {
					if (!!r) resolve(r);
					else resolve([])
        });
    });
  });
};

const createRoom_query1 =
  "INSERT INTO campustaxi_db.rooms_tb(`created_at`, `updated_at`, `start_address_code`, `start_address`, `start_address_detail`, `start_lat`, `start_lon`, \
`end_address_code`, `end_address`, `end_address_detail`, `end_lat`, `end_lon`, `boarding_dtm`, `personnel_limit`, `gender`, `is_deleted`, `category_id`,\
`created_by_id`, `owner_id`, `theme`) VALUES (NOW(), NOW(), '01234', (?), (?), \
 (?), (?), '01234', (?), (?), (?), (?), (?), (?), (?), 0, \
 (?), (select id from campustaxi_db.users_tb as u where nickname=(?)),(select id from campustaxi_db.users_tb as u where nickname=(?)), (?));";
const createRoom_query2 =
  "SELECT *, (select nickname from campustaxi_db.users_tb where id = owner_id) as owner FROM campustaxi_db.rooms_tb where id = (?) order by id desc limit 1; ";

export const BoardingDTMtoMysqlDate = (date: string) => {
	//  2021-07-12T13:36:00.000Z to 2021-07-07 23:27:22.000000
		return date.split('T')[0] +" " + date.split('T')[1].split('Z')[0]
	}
export const query = async (
  db_conn: any,
  query: string,
  api_name?: string,
  params?: Array<any>
) => {
  return new Promise(async (resolve) => {
    db_conn.query(query, params ? params : [], (err: any, results: any) => {
      if (err) {
        console.error("error connecting: " + api_name + err.stack);
        resolve(err);
      }
      resolve(results);
    });
  });
};
