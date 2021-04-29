var firebase = require("firebase/app");

const fs = require('fs')
const key = JSON.parse(fs.readFileSync('./config/firebase/firebaseConfig.json'));

var firebase_info = {
	apiKey: key.apiKey,
	authDomain: key.authDomain,
	databaseURL: key.databaseURL,
	projectId: key.projectId,
	storageBucket: key.storageBucket,
	messagingSenderId: key.messagingSenderId,
	appId: key.appId,
	measurementId: key.measurementId
}

// console.log(firebase_info)
module.exports = {
	init: function () {
		return firebase.initializeApp(firebase_info);
	},
	// connect: function (conn) {
	// 	conn.connect(function (err) {
	// 		if (err) console.error('mysql connection error : ' + err);
	// 		else console.log('mysql is connected successfully!');
	// 	});
	// }
}