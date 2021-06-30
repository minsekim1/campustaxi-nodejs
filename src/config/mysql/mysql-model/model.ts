const mysqlModel = require("mysql-model");
import { db_info } from "../database";
import { logger as l } from "../../winston.js";

let db = {
  host: db_info.host,
  user: db_info.user,
  password: db_info.password,
  database: db_info.database,
};
// const MyAppModel = mysqlModel.createConnection(db);

// export const Message = MyAppModel.extend({
//   tableName: "massage_tb",
// });
