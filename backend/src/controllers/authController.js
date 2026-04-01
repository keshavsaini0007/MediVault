const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const QR_EMERGENCY_TOKEN_EXPIRY = process.env.QR_EMERGENCY_TOKEN_EXPIRY || "30d";

const signToken = (user) => {
	return jwt.sign(
		{ id: user._id.toString(), role: user.role, email: user.email },
		process.env.JWT_SECRET,
		{ expiresIn: "7d" }
	);
};

const signEmergencyQrToken = (patientId) => {
	return jwt.sign(
		{
			type: "patient_emergency_qr",
			patientId: patientId.toString(),
		},
		process.env.JWT_SECRET,
		{ expiresIn: QR_EMERGENCY_TOKEN_EXPIRY }
	);
};

const getBaseUrlFromRequest = (req) => {
	if (process.env.BACKEND_PUBLIC_URL) {
		return process.env.BACKEND_PUBLIC_URL.replace(/\/$/, "");
	}

	const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
	const host = req.get("x-forwarded-host") || req.get("host") || "localhost:5000";
	return `${protocol}://${host}`;
};

const sanitizeUser = (userDoc) => {
	return {
		id: userDoc._id,
		firstName: userDoc.firstName,
		lastName: userDoc.lastName,
		name: userDoc.name,
		email: userDoc.email,
		username: userDoc.username,
		role: userDoc.role,
		phone: userDoc.phone,
		mobile: userDoc.mobile,
		hospitalId: userDoc.hospitalId,
		bloodType: userDoc.bloodType,
		allergies: userDoc.allergies,
		emergencyContact: userDoc.emergencyContact,
		caregiver: userDoc.caregiver,
		assignedDoctorId: userDoc.assignedDoctorId,
		specialization: userDoc.specialization,
		hospitalAffiliation: userDoc.hospitalAffiliation,
		createdAt: userDoc.createdAt,
		updatedAt: userDoc.updatedAt,
	};
};

const mapDuplicateKeyToMessage = (error) => {
	if (!error || error.code !== 11000 || !error.keyPattern) {
		return null;
	}

	if (error.keyPattern.email) {
		return "Email already registered.";
	}

	if (error.keyPattern.username) {
		return "Username already taken.";
	}

	if (error.keyPattern.hospitalId) {
		return "Hospital ID already registered.";
	}

	if (error.keyPattern.mobile || error.keyPattern.phone) {
		return "Mobile already registered.";
	}

	return "Duplicate value detected for a unique field.";
};

const register = async (req, res, next) => {
	try {
		const {
			name,
			firstName,
			lastName,
			email,
			password,
			role,
			phone,
			mobile,
			username,
			hospitalId,
			bloodType,
			allergies,
			specialization,
			spec,
			hospitalAffiliation,
			caregiver,
			caregiverName,
			caregiverEmail,
			caregiverPhone,
		} = req.body;

		const trimmedFirstName = firstName ? String(firstName).trim() : "";
		const trimmedLastName = lastName ? String(lastName).trim() : "";
		const fullNameFromParts = `${trimmedFirstName} ${trimmedLastName}`.trim();
		const resolvedName = name ? String(name).trim() : fullNameFromParts;

		if (!resolvedName || !email || !password || !role) {
			return res
				.status(400)
				.json({ message: "name (or firstName + lastName), email, password and role are required." });
		}

		if (!["patient", "doctor"].includes(role)) {
			return res.status(400).json({ message: "Role must be patient or doctor." });
		}

		const normalizedEmail = email.toLowerCase().trim();
		const normalizedUsername = username ? username.toLowerCase().trim() : undefined;
		const normalizedPhone = phone ? String(phone).trim() : undefined;
		const normalizedMobile = mobile ? String(mobile).trim() : undefined;
		const normalizedHospitalId = hospitalId
			? hospitalId.toUpperCase().trim()
			: undefined;
		const normalizedSpecialization = (specialization || spec)
			? String(specialization || spec).trim()
			: undefined;
		const normalizedAllergies = Array.isArray(allergies)
			? allergies.map((a) => String(a).trim()).filter(Boolean)
			: typeof allergies === "string"
				? allergies
					.split(",")
					.map((a) => a.trim())
					.filter(Boolean)
				: [];
		const normalizedCaregiverName = caregiverName
			? String(caregiverName).trim()
			: caregiver?.name
				? String(caregiver.name).trim()
				: undefined;
		const normalizedCaregiverEmail = caregiverEmail
			? String(caregiverEmail).toLowerCase().trim()
			: caregiver?.email
				? String(caregiver.email).toLowerCase().trim()
				: undefined;
		const normalizedCaregiverPhone = caregiverPhone
			? String(caregiverPhone).trim()
			: caregiver?.phone
				? String(caregiver.phone).trim()
				: undefined;

		if (role === "doctor" && !normalizedHospitalId) {
			return res.status(400).json({ message: "Hospital ID is required for doctor registration." });
		}

		if (role === "patient") {
			if (!normalizedCaregiverName || !normalizedCaregiverEmail || !normalizedCaregiverPhone) {
				return res.status(400).json({
					message: "Caregiver name, email, and phone are required for patient registration.",
				});
			}
		}

		const duplicateChecks = [{ email: normalizedEmail }];
		if (normalizedUsername) {
			duplicateChecks.push({ username: normalizedUsername });
		}
		if (normalizedHospitalId) {
			duplicateChecks.push({ hospitalId: normalizedHospitalId });
		}
		if (normalizedMobile) {
			duplicateChecks.push({ mobile: normalizedMobile });
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
			if (normalizedMobile && existing.mobile === normalizedMobile) {
				return res.status(409).json({ message: "Mobile already registered." });
			}
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const userPayload = {
			firstName: trimmedFirstName || undefined,
			lastName: trimmedLastName || undefined,
			name: resolvedName,
			email: normalizedEmail,
			username: normalizedUsername,
			passwordHash,
			role,
			phone: normalizedPhone || normalizedMobile,
			mobile: normalizedMobile || normalizedPhone,
		};

		if (role === "doctor") {
			userPayload.hospitalId = normalizedHospitalId;
			userPayload.specialization = normalizedSpecialization;
			userPayload.hospitalAffiliation = hospitalAffiliation;
		} else {
			userPayload.bloodType = bloodType;
			userPayload.allergies = normalizedAllergies;
			userPayload.caregiver = {
				name: normalizedCaregiverName,
				email: normalizedCaregiverEmail,
				phone: normalizedCaregiverPhone,
			};
		}

		const user = await User.create(userPayload);

		const token = signToken(user);
		const response = { token, user: sanitizeUser(user) };

		if (user.role === "patient") {
			const emergencyQrToken = signEmergencyQrToken(user._id);
			const baseUrl = getBaseUrlFromRequest(req);
			response.emergencyQr = {
				token: emergencyQrToken,
				expiresIn: QR_EMERGENCY_TOKEN_EXPIRY,
				url: `${baseUrl}/api/v1/qr/emergency/${emergencyQrToken}`,
			};
		}

		return res.status(201).json(response);
	} catch (error) {
		const duplicateMessage = mapDuplicateKeyToMessage(error);
		if (duplicateMessage) {
			return res.status(409).json({ message: duplicateMessage });
		}

		return next(error);
	}
};

const login = async (req, res, next) => {
	try {
		const {
			email,
			mobile,
			phone,
			username,
			hospitalId,
			identifier,
			password,
			role,
			loginMode,
		} = req.body;

		if (!password) {
			return res.status(400).json({ message: "Password is required." });
		}

		const loginIdentifiers = [];

		if (email) {
			loginIdentifiers.push({ email: email.toLowerCase().trim() });
		}
		if (mobile) {
			const normalizedMobile = mobile.trim();
			loginIdentifiers.push({ phone: normalizedMobile });
			loginIdentifiers.push({ mobile: normalizedMobile });
		}
		if (phone) {
			const normalizedPhone = phone.trim();
			loginIdentifiers.push({ phone: normalizedPhone });
			loginIdentifiers.push({ mobile: normalizedPhone });
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

			if (loginMode === "email") {
				loginIdentifiers.push({ email: loweredIdentifier });
			} else if (loginMode === "username") {
				loginIdentifiers.push({ username: loweredIdentifier });
			} else if (loginMode === "hospitalId") {
				loginIdentifiers.push({ hospitalId: rawIdentifier.toUpperCase() });
			} else if (loginMode === "mobile") {
				loginIdentifiers.push({ phone: rawIdentifier });
				loginIdentifiers.push({ mobile: rawIdentifier });
			} else {
				loginIdentifiers.push({ email: loweredIdentifier });
				loginIdentifiers.push({ username: loweredIdentifier });
				loginIdentifiers.push({ hospitalId: rawIdentifier.toUpperCase() });
				loginIdentifiers.push({ phone: rawIdentifier });
				loginIdentifiers.push({ mobile: rawIdentifier });
			}
		}

		if (!loginIdentifiers.length) {
			return res.status(400).json({
				message:
					"Provide one of: email, mobile, phone, username, hospitalId, or identifier.",
			});
		}

		const query = { $or: loginIdentifiers };

		if (role && ["patient", "doctor"].includes(role)) {
			query.role = role;
		} else if (hospitalId || loginMode === "hospitalId") {
			query.role = "doctor";
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

const updateProfile = async (req, res, next) => {
	try {
		const {
			firstName,
			lastName,
			name,
			phone,
			mobile,
			address,
		} = req.body;

		const user = await User.findById(req.user.id);
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		if (firstName !== undefined) user.firstName = firstName;
		if (lastName !== undefined) user.lastName = lastName;
		if (name !== undefined) user.name = name;
		if (phone !== undefined) user.phone = phone;
		if (mobile !== undefined) user.mobile = mobile;
		if (address !== undefined) user.address = address;

		await user.save();

		return res.status(200).json({
			message: "Profile updated successfully.",
			user: sanitizeUser(user),
		});
	} catch (error) {
		return next(error);
	}
};

const updateHealthInfo = async (req, res, next) => {
	try {
		const {
			bloodType,
			allergies,
			height,
			weight,
			conditions,
			emergencyContact,
		} = req.body;

		const user = await User.findById(req.user.id);
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		if (bloodType !== undefined) user.bloodType = bloodType;
		if (allergies !== undefined) {
			user.allergies = Array.isArray(allergies)
				? allergies
				: typeof allergies === "string"
					? allergies.split(",").map(a => a.trim()).filter(Boolean)
					: [];
		}
		if (height !== undefined) user.height = height;
		if (weight !== undefined) user.weight = weight;
		if (conditions !== undefined) {
			user.conditions = Array.isArray(conditions)
				? conditions
				: typeof conditions === "string"
					? conditions.split(",").map(c => c.trim()).filter(Boolean)
					: [];
		}
		if (emergencyContact !== undefined) {
			user.emergencyContact = {
				name: emergencyContact.name || user.emergencyContact?.name,
				phone: emergencyContact.phone || user.emergencyContact?.phone,
			};
		}

		await user.save();

		return res.status(200).json({
			message: "Health info updated successfully.",
			user: sanitizeUser(user),
		});
	} catch (error) {
		return next(error);
	}
};

const changePassword = async (req, res, next) => {
	try {
		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({ message: "Current password and new password are required." });
		}

		if (newPassword.length < 8) {
			return res.status(400).json({ message: "New password must be at least 8 characters." });
		}

		const user = await User.findById(req.user.id);
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
		if (!isMatch) {
			return res.status(401).json({ message: "Current password is incorrect." });
		}

		user.passwordHash = await bcrypt.hash(newPassword, 10);
		await user.save();

		return res.status(200).json({ message: "Password changed successfully." });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	register,
	login,
	me,
	updateProfile,
	updateHealthInfo,
	changePassword,
};
