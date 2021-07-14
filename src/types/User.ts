const sql_userid =
  "SELECT id FROM campustaxi_db.users_tb WHERE nickname=(?) LIMIT 1;";
const sql_usernickname =
  "SELECT nickname FROM campustaxi_db.users_tb WHERE id=(?) LIMIT 1;";
export const sql_usernicknames = (nicknames: string[]) => {
  let query = 
    "SELECT id, nickname, uuid, gender, campus_name, imagepath FROM campustaxi_db.users_tb WHERE nickname=\'"+nicknames[0]+"\'";
  nicknames.map((nickname, i) => 
  {
    if (i!=0)
      query += ' or nickname=\'' + nickname + "\'"
    }
  )
  return query += ";"
}
/*
  //#region Get ROOM Users
db_conn.query(sql_usernicknames([nicknames]), (err: any, results: any) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("results", results);
});
//#endregion Get ROOM Users
*/
  //#endregion GET USER ID

//#region GET USER Nickname
export const sql_userNickname_get = async (
  db_conn: any,
  id: User["id"]
): Promise<Array<User>> => {
  return new Promise(async (resolve) => {
    db_conn.query(sql_usernickname, [id], (err: any, results: any) => {
      if (err) {
        console.error("error connecting: " + err.stack);
        resolve([]);
      }
      resolve(results);
    });
  });
};
//#endregion GET USER Nickname

//#region GET USER ID
export const sql_userid_get = async (
  db_conn: any,
  nickname: User["nickname"]
): Promise<Array<User>> => {
  return new Promise(async (resolve) => {
    db_conn.query(sql_userid, [nickname], (err: any, results: any) => {
      if (err) {
        console.error("error connecting: " + err.stack);
        resolve([]);
      }
      resolve(results);
    });
  });
};
//#endregion GET USER ID

export type User = {
  id: number;
  password: string; //128자
  last_login: Date; //Check필요
  is_superuser: 0 | 1;
  username: string; //150자
  gender: string; //6자
  email: string; //200자
  nickname: string; //80자
  phone: string; //11자
  is_cert: 0 | 1;
  cert_dtm: Date;
  ban_dtm: Date;
  date_joined: Date;
  name: string; //30자
  address: string; //30자
  student_card: string; //100자
  campus_name: string; //30자
  is_staff: 0 | 1;
  is_active: 0 | 1;
  uuid: string; //32자(고정)
  avatar: string; //100자
  is_student: 0 | 1;
  accepted_dtm: Date;
  geo_service_dtm: Date;
  is_accepted: 0 | 1;
  is_geo_service: 0 | 1;
  is_privacy: 0 | 1;
  is_pushed_app: 0 | 1;
  is_pushed_email: 0 | 1;
  is_pushed_sms: 0 | 1;
  privacy_dtm: Date;
  push_app_dtm: Date;
  push_email_dtm: Date;
  push_sms_dtm: Date;
};
