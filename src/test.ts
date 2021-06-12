import express from "express";
const app = express();
const port = 3000;
import { logger as l } from "./config/winston";

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
  l.info(`server is listening on port ${port} `+ new Date());
});

process.on("SIGINT", () => {
  isDisableKeepAlive = true;
  server.close(() => {
    l.info(`server closed `+ new Date());
    process.exit(0);
  });
});
