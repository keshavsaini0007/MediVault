const cron = require('node-cron');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const DoseLog = require('../models/DoseLog');
const Notification = require('../models/Notification');

const router = express.Router();

const sendDailySummary = async () => {
	console.log(`[DailySummary] Starting daily missed dose summary at ${new Date().toISOString()}`);

	const now = new Date();
	const dayStart = new Date(now);
	dayStart.setHours(0, 0, 0, 0);
	const dayEnd = new Date(now);
	dayEnd.setHours(23, 59, 59, 999);

	try {
		const patients = await User.find({ role: 'patient' });
		console.log(`[DailySummary] Found ${patients.length} patients`);

		let summaryCount = 0;

		for (const patient of patients) {
			const missedDoses = await DoseLog.find({
				patientId: patient._id,
				status: 'missed',
				scheduledTime: { $gte: dayStart, $lte: dayEnd },
			}).sort({ scheduledTime: 1 });

			if (missedDoses.length === 0) {
				continue;
			}

			const medicineMap = new Map();

			for (const dose of missedDoses) {
				const medicine = await Medicine.findById(dose.medicineId);
				if (!medicine) continue;

				const key = medicine._id.toString();
				if (!medicineMap.has(key)) {
					medicineMap.set(key, {
						medicineId: medicine._id,
						medicineName: medicine.name,
						dosage: medicine.dosage,
						times: [],
					});
				}
				const timeStr = new Date(dose.scheduledTime).toLocaleTimeString('en-US', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: true,
				});
				medicineMap.get(key).times.push(timeStr);
			}

			const missedList = Array.from(medicineMap.values());

			const existingSummary = await Notification.findOne({
				userId: patient._id,
				type: 'dose_daily_summary',
				createdAt: { $gte: dayStart },
			});

			if (existingSummary) {
				continue;
			}

			const totalMissed = missedDoses.length;
			const medicineDetails = missedList
				.map((m) => `${m.medicineName} (${m.times.join(', ')})`)
				.join(', ');

			const message =
				totalMissed === 1
					? `You missed 1 dose today: ${medicineDetails}`
					: `You missed ${totalMissed} doses today: ${medicineDetails}`;

			await Notification.create({
				userId: patient._id,
				type: 'dose_daily_summary',
				title: 'Daily Missed Dose Summary',
				message,
				metadata: {
					date: dayStart.toISOString().split('T')[0],
					totalMissed,
					missedDoses: missedList,
				},
			});

			summaryCount++;
		}

		console.log(`[DailySummary] Completed: ${summaryCount} daily summaries created`);
		return { summaryCount };
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
