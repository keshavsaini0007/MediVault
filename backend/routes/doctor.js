const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
  createRecord,
  getRecordById,
  getPatientRecords,
} = require("../controllers/recordController");
const { getPatientReports } = require("../controllers/reportController");

const router = express.Router();

router.use(verifyToken, requireRole("doctor"));


router.get("/dashboard", verifyToken, requireRole("doctor"), (req, res) => {
	res.status(200).json({
		message: "Doctor dashboard data fetched successfully.",
		user: req.user,
	});
});

router.get("/patients", verifyToken, requireRole("doctor"), (req, res) => {
	res.status(200).json({
		message: "Doctor patient list endpoint is accessible.",
		doctorId: req.user.id,
	});
});

router.post("/records", createRecord);
router.get("/records/:id", getRecordById);
router.get("/patients/:patientId/records", getPatientRecords);
router.get("/patients/:patientId/reports", getPatientReports);

module.exports = router;
