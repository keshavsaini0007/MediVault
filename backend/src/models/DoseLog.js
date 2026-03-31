const mongoose = require("mongoose");

const doseLogSchema = new mongoose.Schema(
	{
		medicineId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Medicine",
			required: true,
			index: true,
		},
		patientId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		scheduledTime: {
			type: Date,
			required: true,
			default: Date.now,
		},
		status: {
			type: String,
			enum: ["taken", "missed"],
			required: true,
		},
		consecutiveMissCount: {
			type: Number,
			default: 0,
		},
		loggedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("DoseLog", doseLogSchema);
