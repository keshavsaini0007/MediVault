const DoseLog = require("../models/DoseLog");
const Medicine = require("../models/Medicine");
const User = require("../models/User");
const Notification = require("../models/Notification");

const MISS_THRESHOLD = 3;

const getConsecutiveMissCount = async (patientId, medicineId) => {
	const logs = await DoseLog.find({
		patientId,
		medicineId,
		status: "missed",
	}).sort({ scheduledTime: -1 });

	let count = 0;
	for (const log of logs) {
		if (log.status === "missed") {
			count++;
		} else {
			break;
		}
	}

	return count;
};

const calculateStreak = async (patientId, medicineId) => {
	const logs = await DoseLog.find({
		patientId,
		medicineId,
	}).sort({ scheduledTime: -1 }).limit(50);

	let streak = 0;
	for (const log of logs) {
		if (log.status === "missed") {
			streak++;
		} else if (log.status === "taken") {
			break;
		}
	}

	return streak;
};

const updateStreakOnMiss = async (patientId, medicineId, doseLog) => {
	const streak = await calculateStreak(patientId, medicineId);
	const newStreak = streak;

	doseLog.consecutiveMissCount = newStreak;
	await doseLog.save();

	if (newStreak >= MISS_THRESHOLD) {
		await triggerCaregiverAlert(patientId, medicineId, newStreak);
	}

	return newStreak;
};

const resetStreakOnTaken = async (patientId, medicineId, doseLog) => {
	doseLog.consecutiveMissCount = 0;
	await doseLog.save();

	return 0;
};

const triggerCaregiverAlert = async (patientId, medicineId, streakCount) => {
	const patient = await User.findById(patientId);
	if (!patient || !patient.assignedDoctorId) {
		return null;
	}

	const medicine = await Medicine.findById(medicineId);
	if (!medicine) {
		return null;
	}

	const existingAlert = await Notification.findOne({
		userId: patient.assignedDoctorId,
		type: "dose_missed_caregiver",
		"metadata.patientId": patientId.toString(),
		"metadata.medicineId": medicineId.toString(),
		createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
	});

	if (existingAlert) {
		return existingAlert;
	}

	const notification = await Notification.create({
		userId: patient.assignedDoctorId,
		type: "dose_missed_caregiver",
		title: "Patient Missed Dose Alert",
		message: `${patient.name || "Your patient"} has missed ${streakCount} consecutive doses of ${medicine.name}.`,
		metadata: {
			patientId: patientId.toString(),
			patientName: patient.name,
			medicineId: medicineId.toString(),
			medicineName: medicine.name,
			streakCount,
		},
	});

	return notification;
};

module.exports = {
	getConsecutiveMissCount,
	calculateStreak,
	updateStreakOnMiss,
	resetStreakOnTaken,
	triggerCaregiverAlert,
	MISS_THRESHOLD,
};
