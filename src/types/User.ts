export const sql_userid_get =
  "SELECT id FROM campustaxi_db.users_tb WHERE nickname=(?) LIMIT 0,1;";

/*

//#region GET USER ID
db_conn.query(sql_userid_get, [nick], (err: any, results: User[]) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
  console.log("results", results[0]); //[0].id , [0]. ...등
});
//#endregion GET USER ID

*/
export type User = {
  id: number;
  password: string; //128자
  last_login: Date; //Check필요
  is_superuser: number; //0 or 1
  username: string; //150자
  gender: string; //6자
  email: string; //200자
  nickname: string; //80자
  phone: string; //11자
  is_cert: number; //0 or 1
  cert_dtm: Date;
  ban_dtm: Date;
  date_joined: Date;
  name: string; //30자
  address: string; //30자
  student_card: string; //100자
  campus_name: string; //30자
  is_staff: number; //0 or 1
  is_active: number; //0 or 1
  uuid: string; //32자(고정)
  avatar: string; //100자
  is_student: number; //0 or 1
  accepted_dtm: Date;
  geo_service_dtm: Date;
  is_accepted: number; //0 or 1
  is_geo_service: number; //0 or 1
  is_privacy: number; //0 or 1
  is_pushed_app: number; //0 or 1
  is_pushed_email: number; //0 or 1
  is_pushed_sms: number; //0 or 1
  privacy_dtm: Date;
  push_app_dtm: Date;
  push_email_dtm: Date;
  push_sms_dtm: Date;
};
