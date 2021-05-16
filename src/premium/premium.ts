const sql_select =
  "SELECT u.imagepath as imagepath\
  FROM campustaxi_db.users_tb as u\
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

var db_config = require("../config/mysql/database.js");
var db_conn = db_config.init();
db_config.connect(db_conn);

//#region SELECT MESSAGE
export const sql_message_select = async (
    db_conn: any,
    id: string 
  ): Promise<string> => {
    return new Promise(async (resolve) => {
      db_conn.query(sql_select, id, (err: any, results: any) => {
        if (err) {
          console.error("error connecting: " + err.stack);
          resolve(err);
        }
        resolve(results);
      });
    });
  };
  //#endregion SELECT MESSAGE

app.get('/', function(req: any, res: any){
    res.send("welcome!");
});

app.post('/api', function(req: any, res: any, next: any){

    console.log(req.body);
    return res.json(req.body);
  
});
  
app.get('/getProfileIcon/:email', async function(req: any, res: any){

    var resultItems = await sql_message_select(db_conn, req.params.email);
    res.send(resultItems);

});

app.listen(3003, function(){
    console.log("connected 3003 port : premium")
})

export default app;