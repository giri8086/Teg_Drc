const express = require('express');
const app = express();
const session = require("express-session");
const path = require("path");
const JsonDB = require('node-json-db').JsonDB;
const Config = require('node-json-db/dist/lib/JsonDBConfig').Config;
const fs = require("fs");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

const PORT = 4444

var loads = new JsonDB(new Config(path.join(__dirname, '/static/loads.json'), true, true, "/"));

var disp = new JsonDB(new Config(path.join(__dirname, '/static/disp.json'), true, true, "/"));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')

app.use(
	session({
		secret: "eiojldvuhuioankfauiuhbnbljjkttewj",
		resave: true,
		saveUninitialized: true,
	})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));

app.get("/", (request, response) => {
	// If the user is loggedin
	if (request.session.loggedin) {
		response.redirect("/account-receivable");
	} else {
		// Not logged in
		response.render("index");
	}
	response.end();
});

app.post("/auth", function (request, response) {
	// Capture the input fields
	let username = request.body.email;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
        if (username == "customer" && password == "GDuf4ZxMU9RPw5L") {
			request.session.loggedin = true;
			request.session.username = username;
			response.sendStatus(200);
		} else {
			response.status(400).send("Incorrect Username and/or Password!");
		}
    } else {
        response.status(400).send("Please enter Username and Password!");
		response.end();
	}
});

app.get("/logout", function (request, response) {

	// If the user is loggedin
	if (request.session.loggedin) {
		request.session.loggedin = false;
		request.session.username = "";

		fs.copyFile(
			path.join(__dirname, "/static/loads-backup.json"),
			path.join(__dirname, "/static/loads.json"),
			(err) => {
				if (err) {
					console.log("Error Found:", err);
				} else {
					console.log("Succesfully resetted the demo.");
					// fs.appendFileSync("reset-log", "\nResetted Demo on :" + moment().format('yyyy-mm-dd:hh:mm:ss'));
				}
			}
		);
		response.sendStatus(200);
		process.exit();
	} else {
		// Not logged in
		response.redirect("/");
	}
});

app.get("/account-receivable", function (request, response) {

	// If the user is loggedin
	if (request.session.loggedin) {
		response.render("account-receivable", {
			page: "ar",
			loads: loads.getData("/"),
		});
	} else {
		// Not logged in
		response.redirect("/");
	}
	response.end();
});

app.get('/dashboard', (request, response) => { 
	//response.render('account-receivable-new.ejs')
		if (request.session.loggedin) {
			response.render("dashboard.ejs", {
				page: "drc",
				loads: disp.getData("/"),

			});
		} else {
			// Not logged in
			response.redirect("/");
		}
	 })


app.get("/account-payable", function (request, response) {

	// If the user is loggedin
	if (request.session.loggedin) {
		response.render("account-payable", { page: "ap", loads: loads.getData("/") });
	} else {
		// Not logged in
		response.redirect("/");
	}
	response.end();
});

app.get("/dispute-ar", function (request, response) {

	// If the user is loggedin
	if (request.session.loggedin) {
		response.render("dispute-ar", {
			page: "ar",
			loadid: request.query.loadid,
			load: loads.getData("/" + request.query.loadid),
		});
	} else {
		// Not logged in
		response.redirect("/");
	}
	response.end();
});

app.get("/dispute-ap", function (request, response) {

	// If the user is loggedin
	if (request.session.loggedin) {
		response.render("dispute-ap", {
			page: "ap",
			loadid: request.query.loadid,
			load: loads.getData("/" + request.query.loadid),
		});
	} else {
		// Not logged in
		response.redirect("/");
	}
	response.end();
});

app.post("/create-dispute", function (request, response) {
	// Capture the input fields
	let loadid = request.body.loadid;
	let disputeFrom = request.body.from;
	let files = request.body.files;
	// console.log(files)
	
	let type = request.body.type;
	// Ensure the input fields exists and are not empty
	if (loadid) {
		Allfiles = []
		for (const name in files) {
			if (files.hasOwnProperty(name)) {
				// Remove header
				let base64File = files[name].split(";base64,").pop();
				fs.writeFile(
					path.join(__dirname, "/static/images/disputes/" + name),
					base64File,
					{ encoding: "base64" },
					function (err) {
						Allfiles.push({name: name});
					}
				);
			}
		}
		loads.push("/" + loadid + "/dispute_type",type)
		loads.push("/" + loadid + "/disputeFrom", disputeFrom);
		loads.push(
			"/" + loadid + "/disputes[0]",
			{
				from: disputeFrom,
				message: type,
				timestamp: new Date().toLocaleString(),
				files: Allfiles,
			},
			true
		);

		response.send({loadid: loadid});
	} 
});

app.post("/respond-dispute", function (request, response) {
	// Capture the input fields
	let loadid = request.body.loadid;
	let disputeFrom = request.body.from;
	let files = request.body.files;
	// console.log(files)
	
	let message = request.body.message;
	// Ensure the input fields exists and are not empty
	if (loadid) {
		Allfiles = []
		for (const name in files) {
			if (files.hasOwnProperty(name)) {
				// Remove header
				let base64File = files[name].split(";base64,").pop();
				fs.writeFile(
					path.join(__dirname, "/static/images/disputes/" + name),
					base64File,
					{ encoding: "base64" },
					function (err) {
						Allfiles.push({name: name});
					}
				);
			}
		}
		loads.push(
			"/" + loadid + "/disputes[]",
			{
				from: disputeFrom,
				message: message,
				timestamp: new Date().toLocaleString(),
				files: Allfiles,
			},
			true
		);

		response.send({loadid: loadid});
	} 
});

const server = app.listen(PORT, () => {
	console.log(`The application started on port ${server.address().port}`);
});
