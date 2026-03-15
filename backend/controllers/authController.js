const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) => {
	return jwt.sign(
		{ id: user._id.toString(), role: user.role, email: user.email },
		process.env.JWT_SECRET,
		{ expiresIn: "7d" }
	);
};

const sanitizeUser = (userDoc) => {
	return {
		id: userDoc._id,
		name: userDoc.name,
		email: userDoc.email,
		role: userDoc.role,
		phone: userDoc.phone,
		bloodType: userDoc.bloodType,
		allergies: userDoc.allergies,
		emergencyContact: userDoc.emergencyContact,
		assignedDoctorId: userDoc.assignedDoctorId,
		specialization: userDoc.specialization,
		hospitalAffiliation: userDoc.hospitalAffiliation,
		createdAt: userDoc.createdAt,
		updatedAt: userDoc.updatedAt,
	};
};

const register = async (req, res, next) => {
	try {
		const { name, email, password, role, phone } = req.body;

		if (!name || !email || !password || !role) {
			return res
				.status(400)
				.json({ message: "name, email, password and role are required." });
		}

		if (!["patient", "doctor"].includes(role)) {
			return res.status(400).json({ message: "Role must be patient or doctor." });
		}

		const existing = await User.findOne({ email: email.toLowerCase() });
		if (existing) {
			return res.status(409).json({ message: "Email already registered." });
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const user = await User.create({
			...req.body,
			name,
			email: email.toLowerCase(),
			passwordHash,
			role,
			phone,
		});

		const token = signToken(user);
		return res.status(201).json({ token, user: sanitizeUser(user) });
	} catch (error) {
		return next(error);
	}
};

const login = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ message: "Email and password are required." });
		}

		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user) {
			return res.status(401).json({ message: "Invalid credentials." });
		}

		const isMatch = await bcrypt.compare(password, user.passwordHash);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid credentials." });
		}

		const token = signToken(user);
		return res.status(200).json({ token, user: sanitizeUser(user) });
	} catch (error) {
		return next(error);
	}
};

const me = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		return res.status(200).json({ user: sanitizeUser(user) });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	register,
	login,
	me,
};
