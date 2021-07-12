import express from "express";
import { dbconn } from "./config/mysql/database";
const app = express();
const port = 3000;
import { logger as l } from "./config/winston";
import { api_app } from "./module/api/api";
import { premium_app } from "./module/premium/premium";
import { socket } from "./module/socket/socket";

let isDisableKeepAlive = false;
app.use((req: any, res: any, next: any) => {
  if (isDisableKeepAlive) {
    res.set("Connection", "close");
  }
  next();
});

app.get("/", (req: any, res: any) => res.send(`running in server ...`));

const server = app.listen(port, () => {
  if (process.send) process.send("ready");
  l.info(`server is listening on port ${port} `);

  //#region Socket APIs
  const io = require("socket.io")(server);
  socket(io, dbconn)
  premium_app(app);
  api_app(app);
  //#endregion Socket APIs
});

process.on("SIGINT", () => {
  isDisableKeepAlive = true;
  server.close(() => {
    l.info(`server closed `);
    process.exit(0);
  });
});
