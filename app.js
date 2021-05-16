const express = require("express");
const mongoose = require("mongoose");

const app = express();
mongoose.connect("mongodb://localhost:27017/practiceDB", { useNewUrlParser: true, useUnifiedTopology: true });

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const consultantSchema = new mongoose.Schema({
	name: String,
	email: String,
	phone: String,
});

const brokerSchema = new mongoose.Schema({
	name: String,
	consultants: [consultantSchema],
});

const Broker = new mongoose.model("Broker", brokerSchema);

app.get("/", function (req, res) {
	res.render("search");
});

app.get("/results/:searchText", function (req, res) {
	const searchWords = req.params.searchText.split(" ");
	const searchRegex = new RegExp(searchWords.join("|"));
	Broker.find(
		{
			$or: [
				{ name: { $regex: searchRegex, $options: "i" } }, // i for case insensitive
				{ "consultants.name": { $regex: searchRegex, $options: "i" } },
			],
		},
		function (err, doc) {
			if (doc) {
				// const resultsOrder = [];
				doc.forEach((doc) => {
					const docString = JSON.stringify(doc);
					const fullRE = new RegExp(searchWords.join("|"), "gi");
					const matches = docString.match(fullRE);
                    // add up all found characters as basis for best match
					doc.matches = matches.join("").length;
				});
                
                doc.sort((a, b) => {
                    if (a.matches > b.matches) {
                        return -1;
                    } else {
                        return 1;
                    }
                })
                
                res.render("search", {results: doc})

			} else {
				res.redirect("/");
			}
		}
	).catch((err) => console.error(err));
});

app.post("/", function (req, res) {
	const searchText = req.body.search;
	res.redirect(`/results/${searchText}`);
});

app.get("/new-broker", function (req, res) {
	res.render("new-broker");
});

app.post("/new-broker", function (req, res) {
	Broker.findOne({ name: req.body.brokerName }, function (err, doc) {
		if (doc) {
			res.redirect("/");
		} else {
			const newBroker = new Broker({
				name: req.body.brokerName,
			});
			newBroker.save();
			console.log(`New broker added: ${newBroker.name}`);
			res.redirect("/");
		}
	}).catch((err) => console.error(err));
});

app.get("/new-consultant", function (req, res) {
	Broker.find({}, "name", function (err, brokerList) {
		res.render("new-consultant", { brokers: brokerList });
	}).catch((err) => console.error(err));
});

app.post("/new-consultant", function (req, res) {
	console.log(req.body);
	Broker.findOne({ _id: req.body.brokerId }, function (err, foundBroker) {
		const newConsultant = {
			name: req.body.consultantName,
			email: req.body.consultantEmail,
			phone: req.body.consultantPhone,
		};
		foundBroker.consultants.push(newConsultant);
		foundBroker.save();
		console.log(`Added ${newConsultant.name} to ${foundBroker.name}.`);
		res.redirect("/");
	}).catch((err) => console.error(err));
});

app.listen(3000, function () {
	console.log("Started server on port 3000.");
});
