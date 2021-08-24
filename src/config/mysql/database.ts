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

export var dbconn = mysql.createConnection(db_info);

// Example
// import { dbconn } from "./config/mysql/database";
// dbconn.query("SELECT * FROM campustaxi_db.massage_tb;", (err, results, fields)=>{
//   if (err) l.warn("mysql err:" + err);
// });

// LOG

//- Establish a new connection
dbconn.connect((err: any) => {
  if (err) {
    // mysqlErrorHandling(connection, err);
    l.warn("Mysql connection error : " + err);
    dbconn = reconnect(dbconn);
  } else {
    l.info("Mysql connected successfully ! ");
  }
});

//- Reconnection function
function reconnect(connection: mysql.Connection): any {
  l.warn("\n Mysql reconnect...");
  //- Destroy the current connection variable
  if (connection) connection.destroy();
  //- Create a new one
  var connection = mysql.createConnection(db_info);
  //- Try to reconnect
  connection.connect((err) => {
    if (err) {
      //- Try to connect every 2 seconds.
      setTimeout(reconnect, 2000);
      return connection;
    } else {
      l.info("Mysql connected successfully ! ");
      return connection;
    }
  });
}

//- Error listener
dbconn.on("error", (err) => {
  //- The server close the connection.
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    l.warn(
      "/!\\ Cannot establish a connection with the database. /!\\ (" +
        err.code +
        ")"
    );
    dbconn = reconnect(dbconn);
  }

  //- Connection in closing
  else if (err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT") {
    l.warn(
      "/!\\ Cannot establish a connection with the database. /!\\ (" +
        err.code +
        ")"
    );
    dbconn = reconnect(dbconn);
  }

  //- Fatal error : connection variable must be recreated
  else if (err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
    l.warn(
      "/!\\ Cannot establish a connection with the database. /!\\ (" +
        err.code +
        ")"
    );
    dbconn = reconnect(dbconn);
  }

  //- Error because a connection is already being established
  else if (err.code === "PROTOCOL_ENQUEUE_HANDSHAKE_TWICE") {
    l.warn(
      "/!\\ Cannot establish a connection with the database. /!\\ (" +
        err.code +
        ")"
    );
  }

  //- Anything else
  else {
    l.warn(
      "/!\\ Cannot establish a connection with the database. /!\\ (" +
        err.code +
        ")"
    );
    dbconn = reconnect(dbconn);
  }
});
