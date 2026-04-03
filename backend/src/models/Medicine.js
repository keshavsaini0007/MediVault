const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
	{
		patientId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		dosage: {
			type: String,
			required: true,
			trim: true,
		},
		frequency: {
			type: String,
			required: true,
			trim: true,
			default: "daily",
		},
		timeSlots: {
			type: [String],
			default: [],
		},
		startDate: {
			type: Date,
			required: true,
			default: Date.now,
		},
		endDate: {
			type: Date,
		},
		totalTablets: {
			type: Number,
			min: 1,
		},
		tabletsPerDose: {
			type: Number,
			min: 1,
		},
		instructions: {
			type: String,
			trim: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
