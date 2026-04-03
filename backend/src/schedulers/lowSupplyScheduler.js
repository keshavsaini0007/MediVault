const cron = require('node-cron');
const express = require('express');
const Medicine = require('../models/Medicine.js');
const Notification = require('../models/Notification.js');

const router = express.Router();

const checkLowSupply = async () => {
	const now = new Date();

	// Window: medicines whose endDate falls exactly 5 calendar days from today
	const fiveDaysStart = new Date(now);
	fiveDaysStart.setDate(fiveDaysStart.getDate() + 5);
	fiveDaysStart.setHours(0, 0, 0, 0);

	const fiveDaysEnd = new Date(fiveDaysStart);
	fiveDaysEnd.setHours(23, 59, 59, 999);

	// Dedup key: today's ISO date string (YYYY-MM-DD)
	const schedulerDate = now.toISOString().slice(0, 10);

	let notificationCount = 0;

	try {
		const medicines = await Medicine.find({
			isActive: true,
			endDate: { $gte: fiveDaysStart, $lte: fiveDaysEnd },
		});

		for (const medicine of medicines) {
			try {
				// Dedup: skip if we already sent a low_supply notification for this medicine today
				const alreadySent = await Notification.findOne({
					userId: medicine.patientId,
					type: 'low_supply',
					'metadata.medicineId': medicine._id.toString(),
					'metadata.schedulerDate': schedulerDate,
				});

				if (alreadySent) continue;

				await Notification.create({
					userId: medicine.patientId,
					type: 'low_supply',
					title: 'Low Supply Reminder',
					message: `Your supply of ${medicine.name} runs out in 5 days. Time to refill!`,
					metadata: {
						medicineId: medicine._id.toString(),
						medicineName: medicine.name,
						schedulerDate,
					},
				});

				notificationCount++;
				console.log(
					`[LowSupply] Sent low supply reminder for ${medicine.name} (patient: ${medicine.patientId})`
				);
			} catch (err) {
				console.error(`[LowSupply] Error processing medicine ${medicine._id}:`, err);
			}
		}
	} catch (err) {
		console.error('[LowSupply] Fatal error during scheduled run:', err);
	}

	return { notificationCount };
};

// Manual trigger endpoint for testing
router.post('/check-low-supply', async (req, res) => {
	try {
		const result = await checkLowSupply();
		res.json({ success: true, message: 'Low supply check completed', ...result });
	} catch (error) {
		console.error('[LowSupply] Manual trigger failed:', error);
		res.status(500).json({ success: false, message: 'Failed to check low supply', error: error.message });
	}
});

// Run daily at 08:00
cron.schedule('0 8 * * *', async () => {
	try {
		await checkLowSupply();
	} catch (error) {
		console.error('[LowSupply] Scheduled check failed:', error);
	}
});

module.exports = { router, checkLowSupply };
