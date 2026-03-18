const jwt = require("jsonwebtoken");
const User = require("../models/User");
const QrScanLog = require("../models/QrScanLog");
const Report = require("../models/Report");
const MedRecord = require("../models/MedRecord");

const QR_TOKEN_EXPIRY = "7d";
const QR_EMERGENCY_TOKEN_EXPIRY = process.env.QR_EMERGENCY_TOKEN_EXPIRY || "30d";

const getBaseUrlFromRequest = (req) => {
	if (process.env.BACKEND_PUBLIC_URL) {
		return process.env.BACKEND_PUBLIC_URL.replace(/\/$/, "");
	}

	const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
	const host = req.get("x-forwarded-host") || req.get("host") || "localhost:5000";
	return `${protocol}://${host}`;
};

const getMyQrProfilePayload = async (req, res, next) => {
	try {
		const patient = await User.findOne({ _id: req.user.id, role: "patient" });
		if (!patient) {
			return res.status(404).json({ message: "Patient not found." });
		}

		const qrToken = jwt.sign(
			{
				type: "patient_profile_qr",
				patientId: patient._id.toString(),
			},
			process.env.JWT_SECRET,
			{ expiresIn: QR_TOKEN_EXPIRY }
		);

		return res.status(200).json({
			qrToken,
			payload: {
				patientId: patient._id,
				name: patient.name,
				bloodType: patient.bloodType || null,
				allergies: patient.allergies || [],
			},
		});
	} catch (error) {
		return next(error);
	}
};

const scanPatientQr = async (req, res, next) => {
	try {
		const { qrToken, context } = req.body;

		if (!qrToken || typeof qrToken !== "string") {
			return res.status(400).json({ message: "qrToken is required." });
		}

		let decoded;
		try {
			decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
		} catch {
			return res.status(401).json({ message: "Invalid or expired QR token." });
		}

		if (decoded.type !== "patient_profile_qr" || !decoded.patientId) {
			return res.status(400).json({ message: "Invalid QR payload." });
		}

		const patient = await User.findOne({ _id: decoded.patientId, role: "patient" })
			.select("name bloodType allergies emergencyContact assignedDoctorId")
			.populate("assignedDoctorId", "name email hospitalId specialization");

		if (!patient) {
			return res.status(404).json({ message: "Patient not found." });
		}

		await QrScanLog.create({
			patientId: patient._id,
			doctorId: req.user.id,
			scannerType: "doctor",
			context: typeof context === "string" && context.trim() ? context.trim() : "quick-view",
			ipAddress: req.ip,
			userAgent: req.get("user-agent") || "",
		});

		return res.status(200).json({
			message: "QR scanned successfully.",
			patient: {
				id: patient._id,
				name: patient.name,
				bloodType: patient.bloodType || null,
				allergies: patient.allergies || [],
				emergencyContact: patient.emergencyContact || null,
				assignedDoctor: patient.assignedDoctorId || null,
			},
		});
	} catch (error) {
		return next(error);
	}
};

const getMyEmergencyQrPayload = async (req, res, next) => {
	try {
		const patient = await User.findOne({ _id: req.user.id, role: "patient" });
		if (!patient) {
			return res.status(404).json({ message: "Patient not found." });
		}

		const qrToken = jwt.sign(
			{
				type: "patient_emergency_qr",
				patientId: patient._id.toString(),
			},
			process.env.JWT_SECRET,
			{ expiresIn: QR_EMERGENCY_TOKEN_EXPIRY }
		);
		const baseUrl = getBaseUrlFromRequest(req);

		return res.status(200).json({
			qrToken,
			url: `${baseUrl}/api/v1/qr/emergency/${qrToken}`,
			expiresIn: QR_EMERGENCY_TOKEN_EXPIRY,
			message:
				"Emergency QR generated. Anyone with this token can view emergency profile and report links.",
		});
	} catch (error) {
		return next(error);
	}
};

const accessEmergencyProfile = async (req, res, next) => {
	try {
		const { qrToken } = req.params;

		if (!qrToken || typeof qrToken !== "string") {
			return res.status(400).json({ message: "qrToken is required in URL." });
		}

		let decoded;
		try {
			decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
		} catch {
			return res.status(401).json({ message: "Invalid or expired emergency QR token." });
		}

		if (decoded.type !== "patient_emergency_qr" || !decoded.patientId) {
			return res.status(400).json({ message: "Invalid emergency QR payload." });
		}

		const patient = await User.findOne({ _id: decoded.patientId, role: "patient" }).select(
			"name bloodType allergies emergencyContact"
		);

		if (!patient) {
			return res.status(404).json({ message: "Patient not found." });
		}

		const [reports, recentRecords] = await Promise.all([
			Report.find({ patientId: patient._id })
				.select("reportType fileUrl originalName mimeType createdAt")
				.sort({ createdAt: -1 })
				.limit(20),
			MedRecord.find({ patientId: patient._id })
				.select("date diagnosis notes medicines createdAt")
				.sort({ date: -1 })
				.limit(5),
		]);

		await QrScanLog.create({
			patientId: patient._id,
			scannerType: "public",
			context: "emergency-public",
			ipAddress: req.ip,
			userAgent: req.get("user-agent") || "",
		});

		return res.status(200).json({
			message: "Emergency profile fetched successfully.",
			patient: {
				id: patient._id,
				name: patient.name,
				bloodType: patient.bloodType || null,
				allergies: patient.allergies || [],
				emergencyContact: patient.emergencyContact || null,
			},
			reports,
			recentRecords,
		});
	} catch (error) {
		return next(error);
	}
};

const getMyScanAuditLogs = async (req, res, next) => {
	try {
		const { limit = 20 } = req.query;
		const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

		let logs;
		if (req.user.role === "doctor") {
			logs = await QrScanLog.find({ doctorId: req.user.id })
				.sort({ scannedAt: -1 })
				.limit(parsedLimit)
				.populate("patientId", "name email bloodType")
				.populate("doctorId", "name email hospitalId");
		} else if (req.user.role === "patient") {
			logs = await QrScanLog.find({ patientId: req.user.id })
				.sort({ scannedAt: -1 })
				.limit(parsedLimit)
				.populate("doctorId", "name email hospitalId specialization");
		} else {
			return res.status(403).json({ message: "Forbidden: insufficient role." });
		}

		return res.status(200).json({ logs });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getMyQrProfilePayload,
	getMyEmergencyQrPayload,
	scanPatientQr,
	accessEmergencyProfile,
	getMyScanAuditLogs,
};
