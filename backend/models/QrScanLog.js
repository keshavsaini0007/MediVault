const mongoose = require("mongoose");

const qrScanLogSchema = new mongoose.Schema(
	{
		patientId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		doctorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			index: true,
		},
		scannerType: {
			type: String,
			enum: ["doctor", "public"],
			default: "doctor",
			index: true,
		},
		scannedAt: {
			type: Date,
			default: Date.now,
			index: true,
		},
		context: {
			type: String,
			trim: true,
			default: "quick-view",
		},
		ipAddress: {
			type: String,
			trim: true,
			default: "",
		},
		userAgent: {
			type: String,
			trim: true,
			default: "",
		},
	},
	{ timestamps: true }
);

qrScanLogSchema.index({ patientId: 1, scannedAt: -1 });
qrScanLogSchema.index({ doctorId: 1, scannedAt: -1 });

module.exports = mongoose.model("QrScanLog", qrScanLogSchema);
