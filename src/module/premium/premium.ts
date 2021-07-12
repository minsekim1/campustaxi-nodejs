import { dbconn } from "../../config/mysql/database";
import { logger } from "../../config/winston";

const sql_select =
  "SELECT u.imagepath as imagepath\
  FROM campustaxi_db.users_tb as u\
  where u.nickname = (?)";

const sql_update =
  "UPDATE campustaxi_db.users_tb as u\
    SET u.imagepath = (?)\
    where u.nickname = (?)";

const sql_theme_select =
  "SELECT t.*\
    FROM campustaxi_db.rooms_tb as r\
    NATURAL JOIN theme_tb as t\
    WHERE r.id = (?)";

const sql_preview_select =
  "SELECT theme, previewimg FROM campustaxi_db.theme_tb";

const express = require("express");
const next = require("next");
const cors = require("cors");
const fs = require("fs");
export function premium_app(app: any) {
  app.use(cors());
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(express.json({ limit: "100mb" }));
  app.use(function (req: any, res: any, next: any) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, Accept, Accept-  Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token,Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  app.post("/getRoomTheme", async function (req: any, res: any) {
    let roomid = req.body.roomid;
    var resultTheme = await sql_theme_get(dbconn, roomid);
    res.send(resultTheme);
  });

  app.post("/getProfileIcon", async function (req: any, res: any) {
    let nickname = req.body.nickname;
    var resultItems = await sql_profile_select(dbconn, nickname);
    res.send(resultItems);
  });

  app.post("/getThemePreview", async function (req: any, res: any) {
    var resultItems = await sql_preview_get(dbconn);
    res.send(resultItems);
  });

  app.post("/updateProfileIcon", async function (req: any, res: any) {
    let nickname = req.body.nickname;
    let imagepath = req.body.imagepath;
    var resultItems = await sql_profile_update(dbconn, nickname, imagepath);
    res.send(resultItems);
  });

  app.post("/uploadPhoto", async function (req: any, res: any) {
    res.send(await imageUpload(req.body.imageBase64));
    res.status(200);
  });

  app.get("/", function (req: any, res: any) {
    res.send("welcome!");
  });

  app.post("/api", function (req: any, res: any, next: any) {
    return res.json(req.body);
  });
}
var bodyParser = require("body-parser");

const key = JSON.parse(fs.readFileSync("./src/config/awsS3/secrets_aws.json"));

// Configure AWS with your access and secret key.
const ACCESS_KEY_ID = key.ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = key.SECRET_ACCESS_KEY;
const AWS_REGION = key.AWS_REGION;
const S3_BUCKET = key.S3_BUCKET;

/**
 * This gist was inspired from https://gist.github.com/homam/8646090 which I wanted to work when uploading an image from
 * a base64 string.
 * Updated to use Promise (bluebird)
 * Web: https://mayneweb.com
 *
 * @param  {string}  base64 Data
 * @return {string}  Image url
 */
const imageUpload = async (base64: any) => {
  // You can either "yarn add aws-sdk" or "npm i aws-sdk"
  const AWS = require("aws-sdk");

  // Configure AWS to use promise
  AWS.config.setPromisesDependency(require("bluebird"));
  AWS.config.update({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    region: AWS_REGION,
  });

  // Create an s3 instance
  const s3 = new AWS.S3();

  // Ensure that you POST a base64 data to your server.
  // Let's assume the variable "base64" is one.
  const base64Data = new (Buffer as any).from(
    base64.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  // Getting the file type, ie: jpeg, png or gif
  const type = "png";

  // Generally we'd have an userId associated with the image
  // For this example, we'll simulate one
  let nowtime = new Date();  
  const fileName = nowtime.getFullYear() + "/" + (nowtime.getMonth() + 1) + "/" + nowtime.getDate() + "/" + nowtime.toLocaleTimeString('en-KR', { hour12: false });
  
  // With this setup, each time your user uploads an image, will be overwritten.
  // To prevent this, use a different Key each time.
  // This won't be needed if they're uploading their avatar, hence the filename, userAvatar.js.
  const params = {
    Bucket: S3_BUCKET,
    Key: `chatphoto/${fileName}.${type}`, // type is not required
    Body: base64Data,
    ACL: "public-read",
    ContentEncoding: "base64", // required
    ContentType: `image/${type}`, // required. Notice the back ticks
  };

  // The upload() is used instead of putObject() as we'd need the location url and assign that to our user profile/database
  // see: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
  let location = "";
  let key = "";
  try {
    const { Location, Key } = await s3.upload(params).promise();
    location = Location;
    key = Key;
  } catch (error) {
    console.log(error);
  }

  // Save the Location (url) to your database and Key if needs be.
  // As good developers, we should return the url and let other function do the saving to database etc
  // console.log(location, key);

  return location;

  // To delete, see: https://gist.github.com/SylarRuby/b3b1430ca633bc5ffec29bbcdac2bd52
};

//#region SELECT MESSAGE
export const sql_profile_select = async (
  db_conn: any,
  id: string
): Promise<string> => {
  return new Promise(async (resolve) => {
    if (id)
      db_conn.query(sql_select, [id], (err: any, results: any) => {
        if (err) {
          logger.warn("error query:" + sql_select);
          logger.warn("error query id:" + id);
          logger.warn("error connecting: " + err.stack);
          resolve(err);
        }
        resolve(results);
      });
  });
};

export const sql_profile_update = async (
  db_conn: any,
  nickname: string,
  profile_path: string
): Promise<string> => {
  return new Promise(async (resolve) => {
    db_conn.query(
      sql_update,
      [profile_path, nickname],
      (err: any, results: any) => {
        if (err) {
          console.error("error connecting: " + err.stack);
          resolve(err);
        }
        resolve(results);
      }
    );
  });
};

export const sql_theme_get = async (
  db_conn: any,
  room_id: string
): Promise<string> => {
  return new Promise(async (resolve) => {
    db_conn.query(sql_theme_select, [room_id], (err: any, results: any) => {
      if (err) {
        console.error("error connecting: " + err.stack);
        resolve(err);
      }
      resolve(results);
    });
  });
};
export const sql_preview_get = async (
  db_conn: any,
): Promise<any> => {
  return new Promise(async (resolve) => {
    db_conn.query(sql_preview_select, [], (err: any, results: any) => {
      if (err) {
        console.error("error connecting sql_preview_get: " + err.stack);
        resolve(err);
      }
      resolve(results);
    });
  });
};
