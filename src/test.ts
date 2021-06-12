import express from "express";
import { dbconn } from "./config/mysql/database";
import {  Message } from "./config/mysql/mysql-model/model";
const app = express();
const port = 3000;
import { logger as l } from "./config/winston";
import { sql_message_select } from "./types/Message";

let isDisableKeepAlive = false;
app.use((req, res, next) => {
  if (isDisableKeepAlive) {
    res.set("Connection", "close");
  }
  next();
});

app.get("/", (req, res) => res.send(`running in server ...`));

const server = app.listen(port, () => {
  if (process.send) process.send("ready");
  l.info(`server is listening on port ${port} ` + new Date());

  //#region START
  let massage = new Message();
  massage.find(
    "all",
    (err: any, rows: any, fields: any) => {
      console.log("asd",rows,fields)
    }
  );
  //#endregion START
});

process.on("SIGINT", () => {
  isDisableKeepAlive = true;
  server.close(() => {
    l.info(`server closed ` + new Date());
    process.exit(0);
  });
});
