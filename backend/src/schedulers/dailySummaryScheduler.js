const cron = require('node-cron');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const DoseLog = require('../models/DoseLog');
const Notification = require('../models/Notification');
const { sendCaregiverDailyMissedDoseSummary } = require('../services/emailService');

const router = express.Router();

const getDayWindow = (now) => {
	const dayStart = new Date(now);
	dayStart.setHours(0, 0, 0, 0);
	const dayEnd = new Date(now);
	dayEnd.setHours(23, 59, 59, 999);

	return { dayStart, dayEnd };
};

const formatDoseTime = (scheduledTime) => new Date(scheduledTime).toLocaleTimeString('en-US', {
	hour: '2-digit',
	minute: '2-digit',
	hour12: true,
});

const buildMissedList = (missedDoses) => {
	const medicineMap = new Map();

	for (const dose of missedDoses) {
		const medicine = dose.medicineId;
		if (!medicine) {
			continue;
		}

		const key = medicine._id.toString();
		if (!medicineMap.has(key)) {
			medicineMap.set(key, {
				medicineId: key,
				medicineName: medicine.name,
				dosage: medicine.dosage,
				times: [],
			});
		}

		medicineMap.get(key).times.push(formatDoseTime(dose.scheduledTime));
	}

	return Array.from(medicineMap.values());
};

const sendDailySummary = async (options = {}) => {
	console.log(`[DailySummary] Starting daily missed dose summary at ${new Date().toISOString()}`);

	const now = options.now ? new Date(options.now) : new Date();
	const { dayStart, dayEnd } = getDayWindow(now);
	const dateKey = dayStart.toISOString().split('T')[0];

	try {
		const patients = await User.find({
			role: 'patient',
			'caregiver.email': { $exists: true, $ne: '' },
		});
		console.log(`[DailySummary] Found ${patients.length} patients with caregiver email`);

		let emailSentCount = 0;
		let duplicateSkippedCount = 0;
		let noMissedDoseCount = 0;
		let noCaregiverCount = 0;
		let emailConfigSkippedCount = 0;
		let failureCount = 0;

		for (const patient of patients) {
			if (!patient?.caregiver?.email || !patient?.caregiver?.name || !patient?.caregiver?.phone) {
				noCaregiverCount++;
				continue;
			}

			const missedDoses = await DoseLog.find({
				patientId: patient._id,
				status: 'missed',
				scheduledTime: { $gte: dayStart, $lte: dayEnd },
			})
				.sort({ scheduledTime: 1 })
				.populate('medicineId', 'name dosage');

			if (missedDoses.length === 0) {
				noMissedDoseCount++;
				continue;
			}

			const missedList = buildMissedList(missedDoses);
			if (!missedList.length) {
				noMissedDoseCount++;
				continue;
			}

			const existingSummary = await Notification.findOne({
				userId: patient._id,
				type: 'dose_daily_summary',
				'metadata.date': dateKey,
				'metadata.deliveryChannel': 'caregiver_email',
			});

			if (existingSummary) {
				duplicateSkippedCount++;
				continue;
			}

			try {
				const emailResult = await sendCaregiverDailyMissedDoseSummary({
					caregiverEmail: patient.caregiver.email,
					caregiverName: patient.caregiver.name,
					patientName: patient.name,
					dateLabel: dateKey,
					missedMedicines: missedList,
				});

				if (emailResult.skipped) {
					emailConfigSkippedCount++;
					continue;
				}

				await Notification.create({
					userId: patient._id,
					type: 'dose_daily_summary',
					title: 'Caregiver Daily Missed Dose Summary Sent',
					message: `A missed-dose summary for ${patient.name} was emailed to caregiver ${patient.caregiver.name}.`,
					metadata: {
						date: dateKey,
						totalMissed: missedDoses.length,
						missedDoses: missedList,
						deliveryChannel: 'caregiver_email',
						caregiverEmail: patient.caregiver.email,
					},
				});

				emailSentCount++;
			} catch (error) {
				failureCount++;
				console.error(`[DailySummary] Failed for patient ${patient._id}:`, error.message);
			}
		}

		console.log(`[DailySummary] Completed: ${emailSentCount} caregiver summary emails sent`);
		return {
			emailSentCount,
			duplicateSkippedCount,
			noMissedDoseCount,
			noCaregiverCount,
			emailConfigSkippedCount,
			failureCount,
		};
	} catch (error) {
		console.error('[DailySummary] Error sending daily summaries:', error);
		throw error;
	}
};

router.post('/send-daily-summary', async (req, res) => {
	try {
		const result = await sendDailySummary();
		res.json({
			success: true,
			message: 'Daily summary sent successfully',
			...result,
		});
	} catch (error) {
		console.error('[DailySummary] Manual trigger failed:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to send daily summary',
			error: error.message,
		});
	}
});

cron.schedule('0 23 * * *', async () => {
	console.log('[DailySummary] Scheduled daily summary triggered');
	try {
		await sendDailySummary();
	} catch (error) {
		console.error('[DailySummary] Scheduled daily summary failed:', error);
	}
});

module.exports = { router, sendDailySummary };
