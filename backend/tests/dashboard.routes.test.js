const express = require("express");
const request = require("supertest");

const currentRole = { value: "patient" };

jest.mock("../controllers/dashboardController", () => ({
  getPatientDashboard: jest.fn((req, res) =>
    res.status(200).json({
      summary: { unreadNotifications: 0, unreadNotificationsByType: {} },
      generatedAt: new Date().toISOString(),
    })
  ),
  getDoctorDashboard: jest.fn((req, res) =>
    res.status(200).json({
      summary: { assignedPatients: 0, unreadNotifications: 0, unreadNotificationsByType: {} },
      generatedAt: new Date().toISOString(),
    })
  ),
}));

jest.mock("../middleware/verifyToken", () => (req, res, next) => {
  req.user = { id: "507f1f77bcf86cd799439011", role: currentRole.value };
  next();
});

jest.mock("../middleware/requireRole", () => (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
});

jest.mock("../controllers/recordController", () => ({
  getMyRecords: jest.fn((req, res) => res.status(200).json({ records: [] })),
  getRecordById: jest.fn((req, res) => res.status(200).json({ record: { id: req.params.id } })),
  createRecord: jest.fn((req, res) => res.status(201).json({ message: "ok" })),
  getPatientRecords: jest.fn((req, res) => res.status(200).json({ records: [] })),
}));

jest.mock("../controllers/reportController", () => ({
  getMyReports: jest.fn((req, res) => res.status(200).json({ reports: [] })),
  uploadMyReport: jest.fn((req, res) => res.status(201).json({ message: "ok" })),
  deleteMyReport: jest.fn((req, res) => res.status(200).json({ message: "ok" })),
  getPatientReports: jest.fn((req, res) => res.status(200).json({ reports: [] })),
}));

jest.mock("../controllers/doctorPatientController", () => ({
  getMyAssignedPatients: jest.fn((req, res) => res.status(200).json({ patients: [] })),
  assignPatientToDoctor: jest.fn((req, res) => res.status(200).json({ message: "ok" })),
  unassignPatientFromDoctor: jest.fn((req, res) => res.status(200).json({ message: "ok" })),
}));

jest.mock("../middleware/requestValidation", () => ({
  validateRecordIdParam: (req, res, next) => next(),
  validateReportIdParam: (req, res, next) => next(),
  validateCreateRecord: (req, res, next) => next(),
  validateDoctorPatientIdParam: (req, res, next) => next(),
  validateDoctorPatientsQuery: (req, res, next) => next(),
}));

jest.mock("../middleware/uploadReport", () => ({
  single: () => (req, res, next) => next(),
}));

jest.mock("../middleware/rateLimiters", () => ({
  reportUploadLimiter: (req, res, next) => next(),
}));

const patientRoutes = require("../routes/patient");
const doctorRoutes = require("../routes/doctor");
const { getPatientDashboard, getDoctorDashboard } = require("../controllers/dashboardController");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/patient", patientRoutes);
  app.use("/api/v1/doctor", doctorRoutes);
  return app;
};

describe("Dashboard route wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentRole.value = "patient";
  });

  test("GET /api/v1/patient/dashboard allows patient role and calls controller", async () => {
    currentRole.value = "patient";
    const app = buildApp();

    const res = await request(app).get("/api/v1/patient/dashboard");

    expect(res.status).toBe(200);
    expect(getPatientDashboard).toHaveBeenCalledTimes(1);
  });

  test("GET /api/v1/patient/dashboard blocks doctor role", async () => {
    currentRole.value = "doctor";
    const app = buildApp();

    const res = await request(app).get("/api/v1/patient/dashboard");

    expect(res.status).toBe(403);
    expect(getPatientDashboard).not.toHaveBeenCalled();
  });

  test("GET /api/v1/doctor/dashboard allows doctor role and calls controller", async () => {
    currentRole.value = "doctor";
    const app = buildApp();

    const res = await request(app).get("/api/v1/doctor/dashboard");

    expect(res.status).toBe(200);
    expect(getDoctorDashboard).toHaveBeenCalledTimes(1);
  });

  test("GET /api/v1/doctor/dashboard blocks patient role", async () => {
    currentRole.value = "patient";
    const app = buildApp();

    const res = await request(app).get("/api/v1/doctor/dashboard");

    expect(res.status).toBe(403);
    expect(getDoctorDashboard).not.toHaveBeenCalled();
  });
});
