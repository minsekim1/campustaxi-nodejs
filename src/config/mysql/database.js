var mysql = require("mysql");
import { logger } from '../winston';

const fs = require("fs");
const key = JSON.parse(
  fs.readFileSync("./src/config/mysql/secrets_nodejs.json")
);
logger.info('mysql key:' + key)
var db_info = {
  host: key.DATABASE_HOST,
  port: key.DATABASE_PORT,
  user: key.DATABASE_USER,
  password: key.DATABASE_PASSWORD,
  database: key.DATABASE_NAME,
};

module.exports = {
  init: ()=>{
    return mysql.createConnection(db_info);
  },
  connect: function (conn) {
    conn.connect(function (err) {
      if (err) logger.error("mysql connection error : " + err);
      else {
        logger.info("mysql is connected successfully!");
      }
    });
  }
};
