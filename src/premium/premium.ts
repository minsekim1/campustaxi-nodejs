const express = require("express");
const app = express();


app.get('/', function(req: any, res: any){
    res.send("welcome!");
});

app.get('/getProfileIcon', function(req: any, res: any){
    console.log(req.email);
    res.send("success");
});

app.listen(3003, function(){
    console.log("connected 3003 port : premium")
})

export default app;