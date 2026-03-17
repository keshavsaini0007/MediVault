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
		username: userDoc.username,
		role: userDoc.role,
		phone: userDoc.phone,
		hospitalId: userDoc.hospitalId,
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
		const { name, email, password, role, phone, username, hospitalId } = req.body;

		if (!name || !email || !password || !role) {
			return res
				.status(400)
				.json({ message: "name, email, password and role are required." });
		}

		if (!["patient", "doctor"].includes(role)) {
			return res.status(400).json({ message: "Role must be patient or doctor." });
		}

		const normalizedEmail = email.toLowerCase().trim();
		const normalizedUsername = username ? username.toLowerCase().trim() : undefined;
		const normalizedHospitalId = hospitalId
			? hospitalId.toUpperCase().trim()
			: undefined;

		const duplicateChecks = [{ email: normalizedEmail }];
		if (normalizedUsername) {
			duplicateChecks.push({ username: normalizedUsername });
		}
		if (normalizedHospitalId) {
			duplicateChecks.push({ hospitalId: normalizedHospitalId });
		}

		const existing = await User.findOne({ $or: duplicateChecks });
		if (existing) {
			if (existing.email === normalizedEmail) {
				return res.status(409).json({ message: "Email already registered." });
			}
			if (normalizedUsername && existing.username === normalizedUsername) {
				return res.status(409).json({ message: "Username already taken." });
			}
			if (normalizedHospitalId && existing.hospitalId === normalizedHospitalId) {
				return res.status(409).json({ message: "Hospital ID already registered." });
			}
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const user = await User.create({
			...req.body,
			name,
			email: normalizedEmail,
			username: normalizedUsername,
			hospitalId: normalizedHospitalId,
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
		const { email, mobile, phone, username, hospitalId, identifier, password, role } = req.body;

		if (!password) {
			return res.status(400).json({ message: "Password is required." });
		}

		const loginIdentifiers = [];

		if (email) {
			loginIdentifiers.push({ email: email.toLowerCase().trim() });
		}
		if (mobile) {
			loginIdentifiers.push({ phone: mobile.trim() });
		}
		if (phone) {
			loginIdentifiers.push({ phone: phone.trim() });
		}
		if (username) {
			loginIdentifiers.push({ username: username.toLowerCase().trim() });
		}
		if (hospitalId) {
			loginIdentifiers.push({ hospitalId: hospitalId.toUpperCase().trim() });
		}

		if (identifier) {
			const rawIdentifier = String(identifier).trim();
			const loweredIdentifier = rawIdentifier.toLowerCase();
			loginIdentifiers.push({ email: loweredIdentifier });
			loginIdentifiers.push({ username: loweredIdentifier });
			loginIdentifiers.push({ hospitalId: rawIdentifier.toUpperCase() });
			loginIdentifiers.push({ phone: rawIdentifier });
		}

		if (!loginIdentifiers.length) {
			return res.status(400).json({
				message:
					"Provide one of: email, mobile, phone, username, hospitalId, or identifier.",
			});
		}

		const query = loginIdentifiers.length === 1 ? loginIdentifiers[0] : { $or: loginIdentifiers };

		if (role && ["patient", "doctor"].includes(role)) {
			query.role = role;
		}

		const user = await User.findOne(query);
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
