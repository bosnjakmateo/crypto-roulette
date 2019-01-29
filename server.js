const express = require("express")
const bodyParser = require("body-parser")
const Web3 = require("web3")
const http = require("http").Server(express)
const io = require("socket.io")(http)
const mongoose = require("mongoose")
const schedule = require("node-schedule")

const web3 = new Web3(new Web3.providers.HttpProvider("HTTP://127.0.0.1:7545"))
const abi = JSON.parse('[{"constant":false,"inputs":[],"name":"buyTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"investInPool","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"poolPay","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"sellTokens","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"balanceOfOwner","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"balanceOfPool","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"balanceOfSender","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"investedAddresses","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"investedSender","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"poolInvested","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]')
const c = web3.eth.contract(abi)
const contract = c.at("0xf8f753cde3d82cc91a61fcd8cfa3245166dac294")

// Load model
const Round = require("./models/Round")

const app = express('')

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//Connect to MongoDB
const db = require("./config/keys").mongoURI

mongoose
	.connect(db, { useNewUrlParser: true })
	.then(() => console.log("MongoDB connected"))
	.catch(err => console.log(err))

const promisify = (inner) =>
	new Promise((resolve, reject) =>
		inner((err, res) => {
			if (err) {
				reject(err)
			} else {
				resolve(res);
			}
		})
	);

io.on('connection', async (socket) => {
	socket.on("message", async (msg) => {
		Round.findOne({ address: msg.address })
			.then(round => {
				if (round) {
					round.amount += parseInt(msg.amount)
					round.save()
				} else {
					const newRound = new Round({
						address: msg.address,
						amount: msg.amount
					})
					newRound.save()
				}
			})

		const rounds = await Round.find()

		let flag = false

		rounds.forEach((element) => {
			if (element.address === msg.address) {
				flag = true

				let elam = parseInt(element.amount)
				elam += parseInt(msg.amount)
				element.amount = elam
			}
		})

		if (!flag) {
			rounds.push({ address: msg.address, amount: msg.amount })
		}

		io.emit("message", rounds)
	})

	const rounds = await Round.find()
	io.emit("message", rounds)
})

var rule = new schedule.RecurrenceRule()
rule.second = [new schedule.Range(0, 59)]
const initialTimer = 45
var timer = initialTimer
var flag = false

var j = schedule.scheduleJob(rule, async function(){
	let balance = await promisify(res => contract.balanceOfPool(res))

	if(balance != 0 && timer != 0){
		io.emit("time", timer--)
		flag = false
	}

	if(timer <= 0 && !flag){
		io.emit("time", timer)
		timer = initialTimer
		flag = true
		contract.poolPay({from: web3.eth.accounts[9], gas: 3000000}, (err, res) => {
			console.log(res)
			console.log(err)
		})
		Round.deleteMany({})
			.then()
	}
})

app.get("/createRound", async (req, res) => {
	const newRound = new Round({ identifier: "1" })
	newRound.save()
		.then(newRound => res.json(newRound))
		.catch(err => res.json(err))
})

app.get("/test", async (req, res) => {
	contract.investInPool(100, { from: web3.eth.accounts[0]})
})


app.get("/balanceOfPool", async (req, res) => {
	web3.eth.defaultAccount = web3.eth.accounts[0]

	let sum = await promisify(res => contract.balanceOfPool(res))
	let sender = await promisify(res => contract.investedSender(res))

	res.append('Access-Control-Allow-Origin', ['*']);
	res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.append('Access-Control-Allow-Headers', 'Content-Type');
	res.json({ sum: sum, sender: sender })
})


const port = process.env.PORT || 5000

http.listen(3001, () => console.log("Server running on port 3001"))
app.listen(port, () => console.log(`App running on port ${port}`))
