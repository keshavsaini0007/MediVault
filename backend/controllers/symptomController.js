const SymptomLog = require("../models/SymptomLog");
const Notification = require("../models/Notification");

const analyzeSymptomsFallback = (symptomText) => {
	const text = symptomText.toLowerCase();
	const hasAny = (keywords) => keywords.some((keyword) => text.includes(keyword));
	const conditions = [];
	const pushCondition = (label) => {
		if (!conditions.includes(label)) {
			conditions.push(label);
		}
	};

	let specialistType = "General Physician";
	let urgency = "low";
	let advice = "Rest, hydrate, and monitor your symptoms for 24-48 hours.";

	const redFlagDetected = hasAny([
		"chest pain",
		"shortness of breath",
		"difficulty breathing",
		"fainting",
		"confusion",
		"seizure",
		"severe bleeding",
		"blood in vomit",
		"black stool",
	]);

	if (redFlagDetected) {
		pushCondition("Potential emergency warning signs");
		specialistType = "Emergency Medicine";
		urgency = "high";
		advice = "Seek urgent medical care immediately or visit the nearest emergency room.";
	}

	if (hasAny(["chest pain", "palpitations", "left arm pain", "pressure in chest"])) {
		pushCondition("Possible cardiovascular concern");
		specialistType = "Cardiologist";
		urgency = "high";
		advice =
			"Seek urgent medical care immediately, especially if symptoms are sudden or severe.";
	}

	if (
		hasAny([
			"fever",
			"cough",
			"sore throat",
			"runny nose",
			"body ache",
			"chills",
		])
	) {
		pushCondition("Possible viral or upper respiratory infection");
		specialistType = specialistType === "General Physician" ? "General Physician" : specialistType;
		urgency = urgency === "high" ? "high" : "medium";
		advice =
			urgency === "high"
				? advice
				: "Hydrate, rest, and consult a physician if fever persists beyond 2 days.";
	}

	if (hasAny(["wheezing", "persistent cough", "phlegm", "breathlessness"])) {
		pushCondition("Possible lower respiratory tract irritation");
		specialistType = specialistType === "General Physician" ? "Pulmonologist" : specialistType;
		urgency = urgency === "high" ? "high" : "medium";
	}

	if (hasAny(["stomach", "vomit", "nausea", "diarrhea", "abdominal pain"])) {
		pushCondition("Gastrointestinal irritation");
		specialistType = specialistType === "General Physician" ? "Gastroenterologist" : specialistType;
		urgency = urgency === "high" ? "high" : "medium";
		advice =
			urgency === "high"
				? advice
				: "Prefer light meals, fluids, and consult a doctor if symptoms persist or worsen.";
	}

	if (hasAny(["headache", "migraine", "dizziness", "vertigo", "numbness"])) {
		pushCondition("Neurological or stress-related symptom");
		specialistType = specialistType === "General Physician" ? "Neurologist" : specialistType;
		urgency = urgency === "high" ? "high" : urgency;
	}

	if (hasAny(["burning urination", "urine", "frequent urination", "pelvic pain"])) {
		pushCondition("Possible urinary tract issue");
		specialistType = specialistType === "General Physician" ? "Urologist" : specialistType;
		urgency = urgency === "high" ? "high" : "medium";
	}

	if (hasAny(["rash", "itching", "skin redness", "hives"])) {
		pushCondition("Possible dermatological reaction");
		specialistType = specialistType === "General Physician" ? "Dermatologist" : specialistType;
		urgency = urgency === "high" ? "high" : urgency;
	}

	if (conditions.length === 0) {
		conditions.push("Non-specific symptoms");
		advice = "Monitor symptoms, rest, stay hydrated, and seek care if symptoms worsen.";
	}

	if (urgency === "medium" && !redFlagDetected) {
		advice =
			"Schedule a doctor consultation within 24-48 hours if symptoms continue or increase.";
	}

	return {
		aiConditions: conditions.slice(0, 5),
		specialistType,
		urgency,
		advice,
	};
};

const checkSymptoms = async (req, res, next) => {
	try {
		const { symptoms } = req.body;

		if (!symptoms || typeof symptoms !== "string") {
			return res.status(400).json({ message: "symptoms must be a non-empty string." });
		}

		const normalizedSymptoms = symptoms.trim();
		if (normalizedSymptoms.length < 3 || normalizedSymptoms.length > 1000) {
			return res.status(400).json({
				message: "symptoms length must be between 3 and 1000 characters.",
			});
		}

		const analysis = analyzeSymptomsFallback(normalizedSymptoms);

		const symptomLog = await SymptomLog.create({
			patientId: req.user.id,
			symptoms: normalizedSymptoms,
			...analysis,
		});

		if (analysis.urgency === "high") {
			await Notification.create({
				userId: req.user.id,
				type: "symptom_urgent",
				title: "Urgent Symptom Alert",
				message: "Your latest symptom check indicates high urgency. Seek medical care promptly.",
				metadata: {
					symptomLogId: symptomLog._id,
					urgency: analysis.urgency,
					specialistType: analysis.specialistType,
				},
			});
		}

		return res.status(201).json({
			message: "Symptom analysis completed.",
			result: {
				id: symptomLog._id,
				symptoms: symptomLog.symptoms,
				aiConditions: symptomLog.aiConditions,
				specialistType: symptomLog.specialistType,
				urgency: symptomLog.urgency,
				advice: symptomLog.advice,
				createdAt: symptomLog.createdAt,
			},
		});
	} catch (error) {
		return next(error);
	}
};

const getMySymptomHistory = async (req, res, next) => {
	try {
		const logs = await SymptomLog.find({ patientId: req.user.id })
			.sort({ createdAt: -1 })
			.limit(50);

		return res.status(200).json({ logs });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	checkSymptoms,
	getMySymptomHistory,
};
