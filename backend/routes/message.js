const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const requireRole = require("../middleware/requireRole");
const {
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
} = require("../controllers/messageController");
const {
  validateSendMessage,
  validateConversationIdParam,
  validateConversationMessagesQuery,
} = require("../middleware/requestValidation");

const router = express.Router();

router.use(verifyToken, requireRole("doctor", "patient"));

router.get("/conversations", getMyConversations);
router.get(
  "/conversations/:conversationId/messages",
  validateConversationIdParam,
  validateConversationMessagesQuery,
  getConversationMessages
);
router.post("/send", validateSendMessage, sendMessage);
router.patch(
  "/conversations/:conversationId/read",
  validateConversationIdParam,
  markConversationRead
);

module.exports = router;
