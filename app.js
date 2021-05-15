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
	res.render("home");
});

app.post("/", async function (req, res) {
	const searchText = req.body.search;
	const searchWords = searchText.split(" ");
	const searchRegex = new RegExp(searchWords.join("|"));
	console.log(searchRegex);
	const searchResults = [];
	await Broker.find({ name: { $regex: searchRegex, $options: "i" } }, function (err, doc) {
		if (doc) {
			doc.forEach((doc) => {
				searchResults.push(doc._id);
			});
		}
	}); // i for case insensitive
	let consultantResults;
	await Broker.find({ "consultants.name": { $regex: searchRegex, $options: "i" } }, function (err, doc) {
		if (doc) {
			doc.forEach((doc) => {
				if (searchResults.indexOf(doc._id) > -1) {
					searchResults.push(doc._id);
				}
			});
		}
	});
	console.log(searchResults);
	res.redirect("/");
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
