const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const parseBooleanQuery = (value) => {
	if (value === undefined || value === null || value === "") {
		return null;
	}

	const normalized = String(value).toLowerCase();
	if (normalized === "true") {
		return true;
	}
 if (normalized === "false") {
		return false;
	}

	return null;
};

const buildUnreadByType = async (userId) => {
	const grouped = await Notification.aggregate([
		{ $match: { userId: new mongoose.Types.ObjectId(userId), isRead: false } },
		{ $group: { _id: "$type", count: { $sum: 1 } } },
	]);

	return grouped.reduce((acc, row) => {
		acc[row._id] = row.count;
		return acc;
	}, {});
};

const getMyNotifications = async (req, res, next) => {
	try {
		const {
			unreadOnly,
			isRead,
			type,
			from,
			to,
			limit = 20,
			page = 1,
		} = req.query;

		const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
		const parsedPage = Math.max(Number(page) || 1, 1);

		const filter = { userId: req.user.id };

		const parsedIsRead = parseBooleanQuery(isRead);
		const parsedUnreadOnly = parseBooleanQuery(unreadOnly);

		if (parsedIsRead !== null) {
			filter.isRead = parsedIsRead;
		} else if (parsedUnreadOnly === true) {
			filter.isRead = false;
		}

		if (type) {
			filter.type = type;
		}

		if (from || to) {
			filter.createdAt = {};
			if (from) {
				filter.createdAt.$gte = new Date(from);
			}
			if (to) {
				filter.createdAt.$lte = new Date(to);
			}
		}

		const total = await Notification.countDocuments(filter);
		const totalPages = Math.max(Math.ceil(total / parsedLimit), 1);
		const skip = (parsedPage - 1) * parsedLimit;

		const notifications = await Notification.find(filter)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parsedLimit);

		return res.status(200).json({
			notifications,
			pagination: {
				total,
				page: parsedPage,
				limit: parsedLimit,
				totalPages,
				hasNextPage: parsedPage < totalPages,
				hasPrevPage: parsedPage > 1,
			},
		});
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
		const unreadByType = await buildUnreadByType(req.user.id);

		return res.status(200).json({ unreadCount, unreadByType });
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

const markAllNotificationsRead = async (req, res, next) => {
	try {
		const now = new Date();
		const result = await Notification.updateMany(
			{ userId: req.user.id, isRead: false },
			{ $set: { isRead: true, readAt: now } }
		);

		return res.status(200).json({
			message: "All notifications marked as read.",
			matchedCount: result.matchedCount,
			modifiedCount: result.modifiedCount,
		});
	} catch (error) {
		return next(error);
	}
};

const deleteNotification = async (req, res, next) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ message: "Invalid notification id." });
		}

		const notification = await Notification.findOne({ _id: id, userId: req.user.id });
		if (!notification) {
			return res.status(404).json({ message: "Notification not found." });
		}

		await notification.deleteOne();

		return res.status(200).json({ message: "Notification deleted successfully." });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getMyNotifications,
	getUnreadCount,
	markNotificationRead,
	markAllNotificationsRead,
	deleteNotification,
};
