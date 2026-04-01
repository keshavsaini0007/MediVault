const express = require("express");
const request = require("supertest");

jest.mock("../src/controllers/authController", () => ({
  register: jest.fn((req, res) => res.status(201).json({ token: "t", user: { id: "u1", role: req.body.role || "patient" } })),
  login: jest.fn((req, res) => res.status(200).json({ token: "t", user: { id: "u1", role: req.body.role || "patient" } })),
  me: jest.fn((req, res) => res.status(200).json({ user: { id: "u1", role: "patient" } })),
  updateProfile: jest.fn((req, res) => res.status(200).json({ message: "Profile updated successfully.", user: { id: "u1" } })),
  updateHealthInfo: jest.fn((req, res) => res.status(200).json({ message: "Health information updated successfully.", user: { id: "u1" } })),
  changePassword: jest.fn((req, res) => res.status(200).json({ message: "Password changed successfully." })),
}));

jest.mock("../src/middleware/rateLimiters", () => ({
  authLimiter: (req, res, next) => next(),
}));

jest.mock("../src/middleware/verifyToken", () => (req, res, next) => {
  req.user = { id: "u1", role: "patient" };
  next();
});

const authRoutes = require("../src/routes/auth");
const { register, login, me } = require("../src/controllers/authController");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/auth", authRoutes);
  return app;
};

describe("Auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /register validates doctor hospitalId", async () => {
    const app = buildApp();

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "Pass@123",
        role: "doctor",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed.");
    expect(register).not.toHaveBeenCalled();
  });

  test("POST /register accepts valid doctor payload", async () => {
    const app = buildApp();

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        username: "johndoe",
        password: "Pass@123",
        role: "doctor",
        hospitalId: "HOSP-123",
      });

    expect(res.status).toBe(201);
    expect(register).toHaveBeenCalledTimes(1);
  });

  test("POST /register validates patient caregiver fields", async () => {
    const app = buildApp();

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "Pass@123",
        role: "patient",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed.");
    expect(register).not.toHaveBeenCalled();
  });

  test("POST /register accepts valid patient payload with caregiver", async () => {
    const app = buildApp();

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "Pass@123",
        role: "patient",
        caregiverName: "Ravi Doe",
        caregiverEmail: "ravi@example.com",
        caregiverPhone: "+15555551212",
      });

    expect(res.status).toBe(201);
    expect(register).toHaveBeenCalledTimes(1);
  });

  test("POST /login requires password", async () => {
    const app = buildApp();

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "john@example.com", loginMode: "email" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed.");
    expect(login).not.toHaveBeenCalled();
  });

  test("POST /login accepts valid payload", async () => {
    const app = buildApp();

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "john@example.com", loginMode: "email", password: "Pass@123", role: "patient" });

    expect(res.status).toBe(200);
    expect(login).toHaveBeenCalledTimes(1);
  });

  test("GET /me requires auth middleware and returns user", async () => {
    const app = buildApp();

    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(200);
    expect(me).toHaveBeenCalledTimes(1);
  });
});
