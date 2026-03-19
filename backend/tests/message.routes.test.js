const express = require("express");
const request = require("supertest");

jest.mock("../controllers/messageController", () => ({
  getMyConversations: jest.fn((req, res) => res.status(200).json({ conversations: [] })),
  getConversationMessages: jest.fn((req, res) =>
    res.status(200).json({
      conversationId: req.params.conversationId,
      messages: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    })
  ),
  sendMessage: jest.fn((req, res) =>
    res.status(201).json({
      message: "Message sent successfully.",
      conversationId: "507f1f77bcf86cd799439011",
      chatMessage: { body: req.body.body || req.body.content || "" },
    })
  ),
  markConversationRead: jest.fn((req, res) =>
    res.status(200).json({ message: "Conversation marked as read.", matchedCount: 0, modifiedCount: 0 })
  ),
}));

jest.mock("../middleware/verifyToken", () => (req, res, next) => {
  req.user = { id: "507f1f77bcf86cd799439012", role: "doctor" };
  next();
});

jest.mock("../middleware/requireRole", () => () => (req, res, next) => next());

const messageRoutes = require("../routes/message");
const {
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
} = require("../controllers/messageController");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/messages", messageRoutes);
  return app;
};

describe("Message routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /conversations returns conversations", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/v1/messages/conversations");

    expect(res.status).toBe(200);
    expect(getMyConversations).toHaveBeenCalledTimes(1);
  });

  test("POST /send rejects invalid payload", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/v1/messages/send").send({ body: "hi" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed.");
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test("POST /send accepts patientId + content payload", async () => {
    const app = buildApp();
    const res = await request(app).post("/api/v1/messages/send").send({
      patientId: "507f1f77bcf86cd799439013",
      content: "hello",
    });

    expect(res.status).toBe(201);
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  test("GET /conversations/:id/messages validates conversationId", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/v1/messages/conversations/not-an-id/messages");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed.");
    expect(getConversationMessages).not.toHaveBeenCalled();
  });

  test("PATCH /conversations/:id/read validates conversationId and calls controller", async () => {
    const app = buildApp();
    const validId = "507f1f77bcf86cd799439011";
    const res = await request(app).patch(`/api/v1/messages/conversations/${validId}/read`);

    expect(res.status).toBe(200);
    expect(markConversationRead).toHaveBeenCalledTimes(1);
  });
});
