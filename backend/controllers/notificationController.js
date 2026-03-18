const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const getMyNotifications = async (req, res, next) => {
	try {
		const { unreadOnly, limit = 20 } = req.query;
		const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

		const filter = { userId: req.user.id };
		if (String(unreadOnly).toLowerCase() === "true") {
			filter.isRead = false;
		}

		const notifications = await Notification.find(filter)
			.sort({ createdAt: -1 })
			.limit(parsedLimit);

		return res.status(200).json({ notifications });
	} catch (error) {
		return next(error);
	}
};

const getUnreadCount = async (req, res, next) => {
	try {
		const unreadCount = await Notification.countDocuments({
			userId: req.user.id,
			isRead: false,
		});

		return res.status(200).json({ unreadCount });
	} catch (error) {
		return next(error);
	}
};

const markNotificationRead = async (req, res, next) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ message: "Invalid notification id." });
		}

		const notification = await Notification.findOne({ _id: id, userId: req.user.id });
		if (!notification) {
			return res.status(404).json({ message: "Notification not found." });
		}

		if (!notification.isRead) {
			notification.isRead = true;
			notification.readAt = new Date();
			await notification.save();
		}

		return res.status(200).json({
			message: "Notification marked as read.",
			notification,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getMyNotifications,
	getUnreadCount,
	markNotificationRead,
};
