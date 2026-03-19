const express = require("express");
const { register, login, me, updateProfile, updateHealthInfo, changePassword } = require("../controllers/authController");
const verifyToken = require("../middleware/verifyToken");
const {
	validateRegister,
	validateLogin,
} = require("../middleware/authValidation");
const { authLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, validateLogin, login);
router.get("/me", verifyToken, me);
router.patch("/profile", verifyToken, updateProfile);
router.patch("/health", verifyToken, updateHealthInfo);
router.post("/change-password", verifyToken, changePassword);

module.exports = router;
