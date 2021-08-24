import { dbconn } from "../../config/mysql/database";
import { logger } from "../../config/winston";
import { createRoom_sql } from "./api_sql";

var bodyParser = require("body-parser");
const express = require("express");
const next = require("next");
const cors = require("cors");
const fs = require("fs");
export function api_app(app: any) {
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

	app.post("/createRoom", async function (req: any, res: any) {
		let roomid = req.body.room;
		var resultTheme = await createRoom_sql(dbconn, roomid);
		res.send(resultTheme);
	});
}