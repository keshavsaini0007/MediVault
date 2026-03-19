jest.mock("../models/User", () => ({
  find: jest.fn(),
}));

jest.mock("../models/Medicine", () => ({
  find: jest.fn(),
}));

jest.mock("../models/DoseLog", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock("../models/Notification", () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock("../models/SymptomLog", () => ({
  find: jest.fn(),
  distinct: jest.fn(),
}));

jest.mock("../models/Report", () => ({
  find: jest.fn(),
}));

jest.mock("../models/MedRecord", () => ({
  countDocuments: jest.fn(),
}));

const User = require("../models/User");
const Medicine = require("../models/Medicine");
const DoseLog = require("../models/DoseLog");
const Notification = require("../models/Notification");
const SymptomLog = require("../models/SymptomLog");
const Report = require("../models/Report");
const MedRecord = require("../models/MedRecord");
const {
  getPatientDashboard,
  getDoctorDashboard,
} = require("../controllers/dashboardController");

const buildRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const mockChain = (terminalValue, methods) => {
  const chain = {};
  let current = chain;

  methods.forEach((method, index) => {
    const isLast = index === methods.length - 1;
    current[method] = jest.fn(() => (isLast ? Promise.resolve(terminalValue) : current));
  });

  return chain;
};

describe("dashboardController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getPatientDashboard includes unreadNotificationsByType and dose summary", async () => {
    const activeMedicines = [
      {
        _id: "m1",
        timeSlots: ["08:00", "20:00"],
        startDate: new Date("2026-03-01T00:00:00.000Z"),
        endDate: null,
      },
      {
        _id: "m2",
        timeSlots: ["09:00"],
        startDate: new Date("2026-03-01T00:00:00.000Z"),
        endDate: null,
      },
    ];

    const doseLogs = [
      { status: "taken" },
      { status: "taken" },
      { status: "missed" },
    ];

    Medicine.find.mockReturnValue(mockChain(activeMedicines, ["select", "sort"]));
    DoseLog.find.mockReturnValue(mockChain(doseLogs, ["select"]));
    Notification.countDocuments.mockResolvedValue(3);
    Notification.aggregate.mockResolvedValue([
      { _id: "system", count: 1 },
      { _id: "dose_missed", count: 2 },
    ]);
    SymptomLog.find.mockReturnValue(mockChain([], ["sort", "limit", "select"]));
    Report.find.mockReturnValue(mockChain([], ["sort", "limit", "select"]));
    MedRecord.countDocuments.mockResolvedValue(2);

    const req = { user: { id: "507f1f77bcf86cd799439011" } };
    const res = buildRes();

    await getPatientDashboard(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.summary.unreadNotifications).toBe(3);
    expect(payload.summary.unreadNotificationsByType).toEqual({
      system: 1,
      dose_missed: 2,
    });
    expect(payload.summary.scheduledDosesToday).toBe(3);
    expect(payload.summary.takenToday).toBe(2);
    expect(payload.summary.missedToday).toBe(1);
    expect(payload.summary.pendingToday).toBe(0);
    expect(payload.summary.adherencePercent).toBe(66.67);
  });

  test("getDoctorDashboard includes unreadNotificationsByType and urgency counts", async () => {
    const patients = [
      { _id: "507f1f77bcf86cd799439021", name: "A" },
      { _id: "507f1f77bcf86cd799439022", name: "B" },
    ];

    User.find.mockReturnValue(mockChain(patients, ["select", "sort"]));
    Notification.countDocuments.mockResolvedValue(4);
    Notification.aggregate.mockResolvedValue([
      { _id: "symptom_urgent", count: 3 },
      { _id: "system", count: 1 },
    ]);
    SymptomLog.distinct
      .mockResolvedValueOnce(["507f1f77bcf86cd799439021"])
      .mockResolvedValueOnce(["507f1f77bcf86cd799439022"]);
    DoseLog.countDocuments.mockResolvedValue(5);
    SymptomLog.find.mockReturnValue(mockChain([], ["sort", "limit", "select", "populate"]));
    Report.find.mockReturnValue(mockChain([], ["sort", "limit", "select", "populate"]));
    MedRecord.countDocuments.mockResolvedValue(6);

    const req = { user: { id: "507f1f77bcf86cd799439011" } };
    const res = buildRes();

    await getDoctorDashboard(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.summary.assignedPatients).toBe(2);
    expect(payload.summary.highUrgencyPatients).toBe(1);
    expect(payload.summary.mediumUrgencyPatients).toBe(1);
    expect(payload.summary.missedDosesLast24h).toBe(5);
    expect(payload.summary.unreadNotifications).toBe(4);
    expect(payload.summary.unreadNotificationsByType).toEqual({
      symptom_urgent: 3,
      system: 1,
    });
  });
});
