const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

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

module.exports = router;
