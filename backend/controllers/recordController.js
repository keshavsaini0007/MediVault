const mongoose = require("mongoose");
const MedRecord = require("../models/MedRecord");
const User = require("../models/User");

// Create a new medical record
// Called by: doctor observation, file upload, symptom checker
const createRecord = async (req, res, next) => {
  try {
    const { patientId, diagnosis, notes, medicines, fileUrls, aiSummary } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID format." });
    }

    // Verify the patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ message: "Patient not found." });
    }

    // If a doctor is creating this, verify the patient is assigned to them
    if (req.user.role === "doctor") {
      if (
        !patient.assignedDoctorId ||
        patient.assignedDoctorId.toString() !== req.user.id
      ) {
        return res.status(403).json({
          message: "This patient is not assigned to you.",
        });
      }
    }

    const record = await MedRecord.create({
      patientId,
      doctorId: req.user.role === "doctor" ? req.user.id : null,
      diagnosis,
      notes,
      medicines: Array.isArray(medicines) ? medicines : [],
      fileUrls: Array.isArray(fileUrls) ? fileUrls : [],
      aiSummary,
      date: req.body.date || Date.now(),
    });

    return res.status(201).json({
      message: "Medical record created successfully.",
      record,
    });
  } catch (error) {
    return next(error);
  }
};

// Get all records for the logged in patient
const getMyRecords = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = { patientId: req.user.id };
    const total = await MedRecord.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / parsedLimit), 1);

    const records = await MedRecord.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parsedLimit);

    return res.status(200).json({
      records,
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

// Get a single record by ID
const getRecordById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid record ID format." });
    }

    const record = await MedRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found." });
    }

    // Patients can only view their own records
    if (
      req.user.role === "patient" &&
      record.patientId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    // Doctors can only view records of their assigned patients
    if (req.user.role === "doctor") {
      const patient = await User.findById(record.patientId);
      if (
        !patient.assignedDoctorId ||
        patient.assignedDoctorId.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: "Access denied." });
      }
    }

    return res.status(200).json({ record });
  } catch (error) {
    return next(error);
  }
};

// Doctor views full record history of an assigned patient
const getPatientRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID format." });
    }

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ message: "Patient not found." });
    }

    // Verify patient is assigned to this doctor
    if (
      !patient.assignedDoctorId ||
      patient.assignedDoctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "This patient is not assigned to you.",
      });
    }

    const records = await MedRecord.find({ patientId }).sort({ date: -1 });

    return res.status(200).json({
      patient: {
        id: patient._id,
        name: patient.name,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
      },
      records,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRecord,
  getMyRecords,
  getRecordById,
  getPatientRecords,
};
