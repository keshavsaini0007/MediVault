const cron = require('node-cron');
const express = require('express');
const Medicine = require('../models/Medicine');
const DoseLog = require('../models/DoseLog');
const Notification = require('../models/Notification');
const streakService = require('../services/streakService');

const router = express.Router();

const buildTimeSlotDate = (baseDate, slot) => {
	if (typeof slot !== 'string') {
		return null;
	}

	const match = slot.trim().match(/^(\d{1,2}):(\d{2})$/);
	if (!match) {
		return null;
	}

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
		return null;
	}

	const date = new Date(baseDate);
	date.setHours(hours, minutes, 0, 0);
	return date;
};

const checkMissedDoses = async () => {
	console.log(`[Cron] Starting missed dose check at ${new Date().toISOString()}`);

	const now = new Date();
	const dayStart = new Date(now);
	dayStart.setHours(0, 0, 0, 0);

	try {
		const medicines = await Medicine.find({
			isActive: true,
			startDate: { $lte: now },
			$or: [
				{ endDate: { $exists: false } },
				{ endDate: null },
				{ endDate: { $gte: dayStart } },
			],
		});

		console.log(`[Cron] Found ${medicines.length} active medicines to check`);

		let missedCount = 0;
		let notificationCount = 0;

		for (const medicine of medicines) {
			const slots = medicine.timeSlots?.length ? medicine.timeSlots : ['09:00'];

			for (const slot of slots) {
				const scheduledDate = buildTimeSlotDate(now, slot);
				if (!scheduledDate || scheduledDate > now) {
					continue;
				}
				if (scheduledDate < medicine.startDate) {
					continue;
				}
				if (medicine.endDate && scheduledDate > medicine.endDate) {
					continue;
				}

				const existingLog = await DoseLog.findOne({
					medicineId: medicine._id,
					patientId: medicine.patientId,
					scheduledTime: scheduledDate,
				});

				if (!existingLog || existingLog.status !== 'taken') {
					if (!existingLog) {
						const newDoseLog = await DoseLog.create({
							medicineId: medicine._id,
							patientId: medicine.patientId,
							scheduledTime: scheduledDate,
							status: 'missed',
						});
						missedCount++;

						await streakService.updateStreakOnMiss(medicine.patientId, medicine._id, newDoseLog);
					} else if (existingLog.status !== 'missed') {
						existingLog.status = 'missed';
						existingLog.loggedAt = new Date();
						await existingLog.save();
						missedCount++;

						await streakService.updateStreakOnMiss(medicine.patientId, medicine._id, existingLog);
					}

					const existingNotification = await Notification.findOne({
						userId: medicine.patientId,
						'metadata.medicineId': medicine._id.toString(),
						type: 'dose_missed',
					});

					if (!existingNotification) {
						await Notification.create({
							userId: medicine.patientId,
							type: 'dose_missed',
							title: 'Missed Dose Alert',
							message: `You missed a scheduled dose for ${medicine.name}.`,
							metadata: {
								medicineId: medicine._id.toString(),
								medicineName: medicine.name,
								scheduledTime: scheduledDate.toISOString(),
							},
						});
						notificationCount++;
					}
				}
			}
		}

		console.log(`[Cron] Completed: ${missedCount} doses marked as missed, ${notificationCount} notifications created`);
		return { missedCount, notificationCount };
	} catch (error) {
		console.error('[Cron] Error checking missed doses:', error);
		throw error;
	}
};

router.post('/check-missed-doses', async (req, res) => {
	try {
		const result = await checkMissedDoses();
		res.json({
			success: true,
			message: 'Missed dose check completed',
			...result,
		});
	} catch (error) {
		console.error('[Cron] Manual trigger failed:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to check missed doses',
			error: error.message,
		});
	}
});

cron.schedule('0 * * * *', async () => {
	console.log('[Cron] Scheduled missed dose check triggered');
	try {
		await checkMissedDoses();
	} catch (error) {
		console.error('[Cron] Scheduled missed dose check failed:', error);
	}
});

module.exports = { router, checkMissedDoses };
