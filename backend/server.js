const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db.js");
const authRoutes = require("./routes/auth");
const doctorRoutes = require("./routes/doctor");
const patientRoutes = require("./routes/patient");
const medicineRoutes = require("./routes/medicine");
const symptomRoutes = require("./routes/symptom");
const notificationRoutes = require("./routes/notification");
const qrRoutes = require("./routes/qr");
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send("MediVault server is running");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/doctor", doctorRoutes);
app.use("/api/v1/patient", patientRoutes);
app.use("/api/v1/medicine", medicineRoutes);
app.use("/api/v1/symptom", symptomRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/qr", qrRoutes);

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});