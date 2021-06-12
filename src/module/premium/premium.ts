import { dbconn } from "../../config/mysql/database";

const sql_select =
  "SELECT u.imagepath as imagepath\
  FROM campustaxi_db.users_tb as u\
  where u.email = (?)"

const sql_update =
    "UPDATE campustaxi_db.users_tb as u\
    SET u.imagepath = (?)\
    where u.email = (?)"

const express = require("express");
const app = express();
const next = require("next");
const cors = require("cors");


app.use(cors());
var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(function(req: any, res: any, next: any) {
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-  Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token,Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    if (req.method === "OPTIONS") {
    return res.status(200).end();
    }
    next();
});

//#region SELECT MESSAGE
export const sql_message_select = async (
    dbconn: any,
    id: string 
  ): Promise<string> => {
    return new Promise(async (resolve) => {
      dbconn.query(sql_select, id, (err: any, results: any) => {
        if (err) {
          console.error("error connecting: " + err.stack);
          resolve(err);
        }
        resolve(results);
      });
    });
  };

export const sql_message_update = async (
    dbconn: any,
    email: string,
    profile_path: string,
): Promise<string> => {
    return new Promise(async (resolve) => {
        dbconn.query(sql_update, [profile_path, email], (err: any, results: any) => {
            if (err) {
                console.error("error connecting: " + err.stack);
                resolve(err);
            }
            resolve(results);
        });
    });
};

app.get('/', function(req: any, res: any){
    res.send("welcome!");
});

app.post('/api', function(req: any, res: any, next: any){

    console.log(req.body);
    return res.json(req.body);
  
});
  
app.post('/getProfileIcon', async function(req: any, res: any){

    let email = req.body.email

    var resultItems = await sql_message_select(dbconn, email);
    res.send(resultItems);

});

app.post('/updateProfileIcon', async function(req: any, res: any){

    let email = req.body.email;
    let imagepath = req.body.imagepath;

    var resultItems = await sql_message_update(dbconn, email, imagepath);
    res.send(resultItems);

});

app.listen(3003, function(){
    console.log("connected 3003 port : premium")
})

export default app;