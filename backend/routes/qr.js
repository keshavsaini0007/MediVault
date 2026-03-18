const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
	getMyQrProfilePayload,
	getMyEmergencyQrPayload,
	scanPatientQr,
	accessEmergencyProfile,
	getMyScanAuditLogs,
} = require("../controllers/qrController");

const router = express.Router();

router.get("/emergency/:qrToken", accessEmergencyProfile);

router.use(verifyToken);

router.get("/my-profile", requireRole("patient"), getMyQrProfilePayload);
router.get("/my-emergency-profile", requireRole("patient"), getMyEmergencyQrPayload);
router.post("/scan", requireRole("doctor"), scanPatientQr);
router.get("/audit", requireRole("patient", "doctor"), getMyScanAuditLogs);

module.exports = router;
