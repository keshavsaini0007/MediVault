const mongoose = require("mongoose");
const User = require("../models/User");
const Medicine = require("../models/Medicine");
const DoseLog = require("../models/DoseLog");
const Notification = require("../models/Notification");
const SymptomLog = require("../models/SymptomLog");
const Report = require("../models/Report");
const MedRecord = require("../models/MedRecord");

const buildUnreadByTypeMap = async (userId) => {
  const normalizedUserId = typeof userId === "string"
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const grouped = await Notification.aggregate([
    { $match: { userId: normalizedUserId, isRead: false } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);

  return grouped.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});
};

const getDayBounds = () => {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  return { now, dayStart, dayEnd };
};

const countScheduledDosesToday = (medicines, dayStart, dayEnd) => {
  let scheduledCount = 0;

  for (const medicine of medicines) {
    const startDate = medicine.startDate ? new Date(medicine.startDate) : null;
    const endDate = medicine.endDate ? new Date(medicine.endDate) : null;

    if (startDate && startDate > dayEnd) {
      continue;
    }

    if (endDate && endDate < dayStart) {
      continue;
    }

    const slotCount = Array.isArray(medicine.timeSlots) && medicine.timeSlots.length
      ? medicine.timeSlots.length
      : 1;

    scheduledCount += slotCount;
  }

  return scheduledCount;
};

const getPatientDashboard = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const { now, dayStart, dayEnd } = getDayBounds();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [activeMedicines, todayDoseLogs, unreadNotifications, unreadNotificationsByType, recentSymptoms, recentReports, recentRecordsCount] =
      await Promise.all([
        Medicine.find({
          patientId,
          isActive: true,
          startDate: { $lte: dayEnd },
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: dayStart } },
          ],
        })
          .select("name dosage frequency timeSlots startDate endDate")
          .sort({ createdAt: -1 }),
        DoseLog.find({
          patientId,
          scheduledTime: { $gte: dayStart, $lte: dayEnd },
        }).select("medicineId status scheduledTime loggedAt"),
        Notification.countDocuments({ userId: patientId, isRead: false }),
        buildUnreadByTypeMap(patientId),
        SymptomLog.find({ patientId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("symptoms urgency specialistType createdAt"),
        Report.find({ patientId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("reportType originalName fileUrl createdAt"),
        MedRecord.countDocuments({
          patientId,
          date: { $gte: sevenDaysAgo },
        }),
      ]);

    const scheduledToday = countScheduledDosesToday(activeMedicines, dayStart, dayEnd);
    const takenToday = todayDoseLogs.filter((log) => log.status === "taken").length;
    const missedToday = todayDoseLogs.filter((log) => log.status === "missed").length;
    const pendingToday = Math.max(scheduledToday - takenToday - missedToday, 0);

    const adherencePercent = scheduledToday
      ? Number(((takenToday / scheduledToday) * 100).toFixed(2))
      : 0;

    return res.status(200).json({
      summary: {
        activeMedicines: activeMedicines.length,
        scheduledDosesToday: scheduledToday,
        takenToday,
        missedToday,
        pendingToday,
        adherencePercent,
        unreadNotifications,
        unreadNotificationsByType,
        recentRecordsCount,
      },
      recentSymptoms,
      recentReports,
      generatedAt: now,
    });
  } catch (error) {
    return next(error);
  }
};

const getDoctorDashboard = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const assignedPatients = await User.find({
      role: "patient",
      assignedDoctorId: doctorId,
    })
      .select("name email mobile bloodType assignedDoctorId updatedAt")
      .sort({ updatedAt: -1 });

    const patientIds = assignedPatients.map((patient) => patient._id);

    const [unreadNotifications, unreadNotificationsByType, highUrgencyPatientIds, mediumUrgencyPatientIds, missedDosesLast24h, recentSymptoms, recentReports, recentRecordsCount] =
      await Promise.all([
        Notification.countDocuments({ userId: doctorId, isRead: false }),
        buildUnreadByTypeMap(doctorId),
        patientIds.length
          ? SymptomLog.distinct("patientId", {
              patientId: { $in: patientIds },
              urgency: "high",
              createdAt: { $gte: sevenDaysAgo },
            })
          : [],
        patientIds.length
          ? SymptomLog.distinct("patientId", {
              patientId: { $in: patientIds },
              urgency: "medium",
              createdAt: { $gte: sevenDaysAgo },
            })
          : [],
        patientIds.length
          ? DoseLog.countDocuments({
              patientId: { $in: patientIds },
              status: "missed",
              scheduledTime: { $gte: oneDayAgo },
            })
          : 0,
        patientIds.length
          ? SymptomLog.find({
              patientId: { $in: patientIds },
              createdAt: { $gte: sevenDaysAgo },
            })
              .sort({ createdAt: -1 })
              .limit(8)
              .select("patientId urgency symptoms specialistType createdAt")
              .populate("patientId", "name")
          : [],
        patientIds.length
          ? Report.find({ patientId: { $in: patientIds } })
              .sort({ createdAt: -1 })
              .limit(8)
              .select("patientId reportType originalName createdAt")
              .populate("patientId", "name")
          : [],
        patientIds.length
          ? MedRecord.countDocuments({
              patientId: { $in: patientIds },
              date: { $gte: sevenDaysAgo },
            })
          : 0,
      ]);

    return res.status(200).json({
      summary: {
        assignedPatients: assignedPatients.length,
        highUrgencyPatients: highUrgencyPatientIds.length,
        mediumUrgencyPatients: mediumUrgencyPatientIds.length,
        missedDosesLast24h,
        unreadNotifications,
        unreadNotificationsByType,
        recentRecordsCount,
      },
      patients: assignedPatients.slice(0, 8),
      recentSymptoms,
      recentReports,
      generatedAt: now,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPatientDashboard,
  getDoctorDashboard,
};
