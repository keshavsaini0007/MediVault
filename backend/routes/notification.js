const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
	getMyNotifications,
	getUnreadCount,
	markNotificationRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(verifyToken);

router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markNotificationRead);

module.exports = router;
