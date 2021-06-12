import mysql from "mysql";
import { logger as l } from "../../config/winston";

// KEY FILES
const fs = require("fs");
const key = JSON.parse(
  fs.readFileSync("./src/config/mysql/secrets_nodejs.json")
);
export var db_info = {
  host: key.DATABASE_HOST,
  port: key.DATABASE_PORT,
  user: key.DATABASE_USER,
  password: key.DATABASE_PASSWORD,
  database: key.DATABASE_NAME,
};

export const dbconn = mysql.createConnection(db_info);

// Example
// import { dbconn } from "./config/mysql/database";
// dbconn.query("SELECT * FROM campustaxi_db.massage_tb;", (err, results, fields)=>{
//   if (err) l.warn("mysql err:" + err);
// });

// LOG
dbconn.connect((e: any) => {
  if (e) l.warn("Mysql connection error : " + e);
  else l.info("Mysql connected successfully ! ");
});
