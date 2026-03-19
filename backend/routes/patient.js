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
const { getMyMedicines } = require("../controllers/medicineController");
const {
	validateRecordIdParam,
	validateReportIdParam,
} = require("../middleware/requestValidation");
const { getPatientDashboard } = require("../controllers/dashboardController");
const { reportUploadLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.use(verifyToken, requireRole("patient"));

router.get("/dashboard", getPatientDashboard);

router.get("/medicines", getMyMedicines);

router.get("/records", getMyRecords);
router.get("/records/:id", validateRecordIdParam, getRecordById);

router.get("/reports", getMyReports);
router.post("/reports", reportUploadLimiter, uploadReport.single("report"), uploadMyReport);
router.delete("/reports/:id", validateReportIdParam, deleteMyReport);

module.exports = router;
