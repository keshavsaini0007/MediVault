const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lastMessage: {
      type: String,
      trim: true,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
