const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
	addMedicine,
	getMyMedicines,
	logDose,
	markDoseStatus,
	getDueDoses,
	getAdherenceSummary,
	getWeeklyAdherenceTrend,
} = require("../controllers/medicineController");

const router = express.Router();

router.use(verifyToken, requireRole("patient"));

router.post("/", addMedicine);
router.get("/", getMyMedicines);
router.get("/due", getDueDoses);
router.post("/mark", markDoseStatus);
router.get("/adherence/weekly", getWeeklyAdherenceTrend);
router.post("/:id/log", logDose);
router.get("/adherence", getAdherenceSummary);

module.exports = router;
