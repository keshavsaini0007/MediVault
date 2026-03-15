const express = require("express");
const { register, login, me } = require("../controllers/authController");
const verifyToken = require("../middleware/verifyToken");
const {
	validateRegister,
	validateLogin,
} = require("../middleware/authValidation");

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", verifyToken, me);

module.exports = router;
