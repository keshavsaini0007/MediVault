const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
dotenv.config();

const validateEnv = require("./config/validateEnv");
const connectDB = require("./config/db.js");

try {
  validateEnv();
} catch (error) {
  console.error(`Environment validation failed: ${error.message}`);
  process.exit(1);
}


const authRoutes = require("./routes/auth");
const doctorRoutes = require("./routes/doctor");
const patientRoutes = require("./routes/patient");
const medicineRoutes = require("./routes/medicine");
const symptomRoutes = require("./routes/symptom");
const notificationRoutes = require("./routes/notification");
const qrRoutes = require("./routes/qr");
const messageRoutes = require("./routes/message");
const aiRoutes = require("./routes/ai");
const { router: cronRouter } = require("./schedulers/missedDoseScheduler");
const { router: dailySummaryRouter } = require("./schedulers/dailySummaryScheduler");
const { router: doseReminderRouter } = require("./schedulers/doseReminderScheduler");
const { router: lowSupplyRouter } = require("./schedulers/lowSupplyScheduler");

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send("MediVault server is running");
});

app.get("/api/v1/debug", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is reachable from mobile app",
    timestamp: new Date().toISOString(),
    cors: "enabled",
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "medivault-backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/ready", (req, res) => {
  const state = mongoose.connection.readyState;
  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbStatus = dbStateMap[state] || "unknown";
  const isReady = state === 1;

  return res.status(isReady ? 200 : 503).json({
    status: isReady ? "ready" : "not_ready",
    checks: {
      database: dbStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/doctor", doctorRoutes);
app.use("/api/v1/patient", patientRoutes);
app.use("/api/v1/medicine", medicineRoutes);
app.use("/api/v1/symptom", symptomRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/qr", qrRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/cron", cronRouter);
app.use("/api/v1/cron/daily-summary", dailySummaryRouter);
app.use("/api/v1/cron/dose-reminders", doseReminderRouter);
app.use("/api/v1/cron/low-supply", lowSupplyRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large. Max size is 10MB." });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      message: "Unexpected field. Upload file with form-data key 'report'.",
    });
  }

  if (
    err.message === "Only PDF, JPG, PNG, and WEBP files are allowed."
  ) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

connectDB().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}).catch((error) => {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
});