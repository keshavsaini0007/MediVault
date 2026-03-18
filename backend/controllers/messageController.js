const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const ensureObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return { error: `${fieldName} must be a valid ObjectId.` };
  }

  return { objectId: new mongoose.Types.ObjectId(value) };
};

const resolveChatContext = async ({ currentUserId, currentRole, recipientId }) => {
  if (String(currentUserId) === String(recipientId)) {
    return { status: 400, message: "You cannot send messages to yourself." };
  }

  const recipient = await User.findById(recipientId).select("role assignedDoctorId name");
  if (!recipient) {
    return { status: 404, message: "Recipient not found." };
  }

  if (!recipient.role || !["doctor", "patient"].includes(recipient.role)) {
    return { status: 400, message: "Recipient role is invalid for chat." };
  }

  if (recipient.role === currentRole) {
    return { status: 400, message: "Chat is only allowed between doctor and patient." };
  }

  const doctorId = currentRole === "doctor" ? currentUserId : recipient._id.toString();
  const patientId = currentRole === "patient" ? currentUserId : recipient._id.toString();

  const patient = currentRole === "patient"
    ? await User.findById(currentUserId).select("assignedDoctorId")
    : recipient;

  if (!patient || String(patient.role || "patient") !== "patient") {
    return { status: 404, message: "Patient not found." };
  }

  if (!patient.assignedDoctorId || String(patient.assignedDoctorId) !== String(doctorId)) {
    return {
      status: 403,
      message: "Doctor-patient assignment required before chatting.",
    };
  }

  return {
    doctorId,
    patientId,
    recipient,
  };
};

const getMyConversations = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    const filter = role === "doctor" ? { doctorId: userId } : { patientId: userId };

    const conversations = await Conversation.find(filter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate("doctorId", "name email")
      .populate("patientId", "name email");

    const conversationIds = conversations.map((item) => item._id);

    const unreadRows = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          receiverId: new mongoose.Types.ObjectId(userId),
          isRead: false,
        },
      },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]);

    const unreadMap = unreadRows.reduce((acc, row) => {
      acc[String(row._id)] = row.count;
      return acc;
    }, {});

    const payload = conversations.map((conversation) => {
      const counterpart = role === "doctor" ? conversation.patientId : conversation.doctorId;

      return {
        id: conversation._id,
        doctorId: conversation.doctorId && conversation.doctorId._id,
        patientId: conversation.patientId && conversation.patientId._id,
        counterpart: counterpart
          ? {
              id: counterpart._id,
              name: counterpart.name,
              email: counterpart.email,
              role: role === "doctor" ? "patient" : "doctor",
            }
          : null,
        lastMessage: conversation.lastMessage || "",
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: unreadMap[String(conversation._id)] || 0,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    });

    return res.status(200).json({ conversations: payload });
  } catch (error) {
    return next(error);
  }
};

const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { limit = 30, page = 1 } = req.query;

    const parsedLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
    const parsedPage = Math.max(Number(page) || 1, 1);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const requesterId = req.user.id;
    if (
      String(conversation.doctorId) !== String(requesterId) &&
      String(conversation.patientId) !== String(requesterId)
    ) {
      return res.status(403).json({ message: "Access denied for this conversation." });
    }

    const total = await Message.countDocuments({ conversationId: conversation._id });
    const totalPages = Math.max(Math.ceil(total / parsedLimit), 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate("senderId", "name role")
      .populate("receiverId", "name role");

    return res.status(200).json({
      conversationId: conversation._id,
      messages: messages.reverse(),
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

const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const recipientId = req.body.recipientId || req.body.patientId;
    const rawBody = req.body.body || req.body.content;

    const recipientObjectId = ensureObjectId(recipientId, "recipientId");
    if (recipientObjectId.error) {
      return res.status(400).json({ message: recipientObjectId.error });
    }

    const context = await resolveChatContext({
      currentUserId: senderId,
      currentRole: senderRole,
      recipientId,
    });

    if (context.status) {
      return res.status(context.status).json({ message: context.message });
    }

    const messageBody = String(rawBody || "").trim();

    const conversation = await Conversation.findOneAndUpdate(
      {
        doctorId: context.doctorId,
        patientId: context.patientId,
      },
      {
        $setOnInsert: {
          doctorId: context.doctorId,
          patientId: context.patientId,
        },
        $set: {
          lastMessage: messageBody,
          lastMessageAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      receiverId: recipientObjectId.objectId,
      body: messageBody,
    });

    return res.status(201).json({
      message: "Message sent successfully.",
      conversationId: conversation._id,
      chatMessage: message,
    });
  } catch (error) {
    return next(error);
  }
};

const markConversationRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const receiverId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    if (
      String(conversation.doctorId) !== String(receiverId) &&
      String(conversation.patientId) !== String(receiverId)
    ) {
      return res.status(403).json({ message: "Access denied for this conversation." });
    }

    const now = new Date();
    const result = await Message.updateMany(
      {
        conversationId: conversation._id,
        receiverId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: now,
        },
      }
    );

    return res.status(200).json({
      message: "Conversation marked as read.",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
};
