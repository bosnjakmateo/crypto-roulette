const mongoose = require("mongoose")
const Schema = mongoose.Schema

// Create schema
const RoundSchema = new Schema({
	address: {
		type: String,
		required: true
	},
	amount: {
		type: Number,
		required: true
	}
})

module.exports = Round = mongoose.model("rounds", RoundSchema)