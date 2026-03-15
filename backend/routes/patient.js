const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
  getMyRecords,
  getRecordById,
} = require("../controllers/recordController");
const uploadReport = require("../middleware/uploadReport");
const {
  getMyReports,
  uploadMyReport,
  deleteMyReport,
} = require("../controllers/reportController");

const router = express.Router();

router.use(verifyToken, requireRole("patient"));

router.get("/dashboard", (req, res) => {
	res.status(200).json({
		message: "Patient dashboard data fetched successfully.",
		user: req.user,
	});
});

router.get("/medicines", (req, res) => {
	res.status(200).json({
		message: "Patient medicine list endpoint is accessible.",
		patientId: req.user.id,
	});
});

router.get("/records", requireRole("patient"), getMyRecords);
router.get("/records/:id", requireRole("patient"), getRecordById);

router.get("/reports", getMyReports);
router.post("/reports", uploadReport.single("report"), uploadMyReport);
router.delete("/reports/:id", deleteMyReport);

module.exports = router;
