const jwt = require("jsonwebtoken");
const User = require("../models/User");
const QrScanLog = require("../models/QrScanLog");
const Report = require("../models/Report");
const MedRecord = require("../models/MedRecord");
const Medicine = require("../models/Medicine");

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
			"name firstName lastName bloodType allergies emergencyContact phone"
		);

		if (!patient) {
			return res.status(404).json({ message: "Patient not found." });
		}

		const [reports, records, medicines] = await Promise.all([
			Report.find({ patientId: patient._id })
				.select("reportType fileUrl originalName mimeType createdAt")
				.sort({ createdAt: -1 })
				.limit(50),
			MedRecord.find({ patientId: patient._id })
				.select("date diagnosis notes medicines createdAt")
				.sort({ date: -1 })
				.limit(20),
			Medicine.find({ patientId: patient._id, isActive: true })
				.select("name dosage frequency timeSlots")
				.sort({ createdAt: -1 })
				.limit(10),
		]);

		await QrScanLog.create({
			patientId: patient._id,
			scannerType: "public",
			context: "emergency-public",
			ipAddress: req.ip,
			userAgent: req.get("user-agent") || "",
		});

		const acceptHeader = req.get("Accept") || "";
		const wantsHtml = acceptHeader.includes("text/html");

		if (wantsHtml) {
			const emergencyContact = patient.emergencyContact || {};
			const reportsHtml = reports.length > 0
				? reports.map(r => `<tr><td>${r.reportType}</td><td>${new Date(r.createdAt).toLocaleDateString()}</td><td><a href="${r.fileUrl}" target="_blank">View</a></td></tr>`).join("")
				: "<tr><td colspan='3'>No reports available</td></tr>";

			const recordsHtml = records.length > 0
				? records.map(r => `<tr><td>${new Date(r.date).toLocaleDateString()}</td><td>${r.diagnosis}</td><td>${r.notes || '-'}</td></tr>`).join("")
				: "<tr><td colspan='3'>No medical records available</td></tr>";

			const medicinesHtml = medicines.length > 0
				? medicines.map(m => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.timeSlots.join(", ")}</td></tr>`).join("")
				: "<tr><td colspan='4'>No active medicines</td></tr>";

			const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Emergency Medical Profile - ${patient.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { background: white; border-radius: 16px; padding: 24px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .header h1 { color: #dc2626; font-size: 28px; margin-bottom: 8px; }
        .header .badge { background: #fef2f2; color: #dc2626; padding: 8px 16px; border-radius: 20px; font-weight: 600; display: inline-block; margin-bottom: 16px; }
        .patient-name { font-size: 36px; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
        .info-card { background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .info-card.highlight { border: 3px solid #dc2626; background: #fef2f2; }
        .info-card .icon { font-size: 32px; margin-bottom: 8px; }
        .info-card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
        .info-card .value { font-size: 18px; font-weight: 600; color: #1f2937; margin-top: 4px; }
        .section { background: white; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .section h2 { color: #1f2937; font-size: 20px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; }
        td { color: #4b5563; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .footer { text-align: center; color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 20px; }
        .allergy-tag { display: inline-block; background: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 12px; margin: 2px; font-size: 14px; }
        @media (max-width: 600px) {
            .patient-name { font-size: 24px; }
            table { font-size: 14px; }
            th, td { padding: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="badge">🚨 EMERGENCY MEDICAL PROFILE</div>
            <div class="patient-name">${patient.name}</div>
            <p style="color: #6b7280;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="info-grid">
            <div class="info-card ${patient.bloodType ? 'highlight' : ''}">
                <div class="icon">🩸</div>
                <div class="label">Blood Type</div>
                <div class="value">${patient.bloodType || 'Unknown'}</div>
            </div>
            <div class="info-card">
                <div class="icon">📞</div>
                <div class="label">Phone</div>
                <div class="value">${patient.phone || 'Not provided'}</div>
            </div>
            <div class="info-card">
                <div class="icon">👤</div>
                <div class="label">Emergency Contact</div>
                <div class="value">${emergencyContact.name || 'Not set'}<br><small>${emergencyContact.phone || ''}</small></div>
            </div>
        </div>

        ${patient.allergies && patient.allergies.length > 0 ? `
        <div class="section">
            <h2>⚠️ Allergies</h2>
            <div style="padding: 8px 0;">
                ${patient.allergies.map(a => `<span class="allergy-tag">${a}</span>`).join("")}
            </div>
        </div>
        ` : ""}

        <div class="section">
            <h2>💊 Current Medications</h2>
            <table>
                <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Time</th></tr></thead>
                <tbody>${medicinesHtml}</tbody>
            </table>
        </div>

        <div class="section">
            <h2>📋 Medical Records</h2>
            <table>
                <thead><tr><th>Date</th><th>Diagnosis</th><th>Notes</th></tr></thead>
                <tbody>${recordsHtml}</tbody>
            </table>
        </div>

        <div class="section">
            <h2>📄 Reports</h2>
            <table>
                <thead><tr><th>Type</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>${reportsHtml}</tbody>
            </table>
        </div>

        <div class="footer">
            <p>Powered by MediVault | For emergencies only</p>
        </div>
    </div>
</body>
</html>`;

			return res.status(200).set("Content-Type", "text/html").send(html);
		}

		return res.status(200).json({
			message: "Emergency profile fetched successfully.",
			patient: {
				id: patient._id,
				name: patient.name,
				firstName: patient.firstName,
				lastName: patient.lastName,
				bloodType: patient.bloodType || null,
				allergies: patient.allergies || [],
				emergencyContact: patient.emergencyContact || null,
				phone: patient.phone || null,
			},
			reports: {
				count: reports.length,
				items: reports,
			},
			records: {
				count: records.length,
				items: records,
			},
			medicines: {
				count: medicines.length,
				items: medicines,
			},
			scannedAt: new Date().toISOString(),
			generatedBy: "MediVault Emergency QR",
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
