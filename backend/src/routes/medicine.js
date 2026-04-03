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
	deleteMedicine,
	updateMedicine,
} = require("../controllers/medicineController");
const {
	validateAddMedicine,
	validateLogDose,
	validateMarkDoseStatus,
	validateAdherenceQuery,
} = require("../middleware/requestValidation");

const router = express.Router();

router.use(verifyToken, requireRole("patient"));

router.post("/", validateAddMedicine, addMedicine);
router.get("/", getMyMedicines);
router.get("/due", getDueDoses);
router.post("/mark", validateMarkDoseStatus, markDoseStatus);
router.get("/adherence/weekly", validateAdherenceQuery, getWeeklyAdherenceTrend);
router.post("/:id/log", validateLogDose, logDose);
router.get("/adherence", validateAdherenceQuery, getAdherenceSummary);
router.delete("/:id", deleteMedicine);
router.patch("/:id", updateMedicine);

module.exports = router;
