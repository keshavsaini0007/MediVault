const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get("/dashboard", verifyToken, requireRole("patient"), (req, res) => {
	res.status(200).json({
		message: "Patient dashboard data fetched successfully.",
		user: req.user,
	});
});

router.get("/medicines", verifyToken, requireRole("patient"), (req, res) => {
	res.status(200).json({
		message: "Patient medicine list endpoint is accessible.",
		patientId: req.user.id,
	});
});

module.exports = router;
