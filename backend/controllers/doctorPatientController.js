const mongoose = require("mongoose");
const User = require("../models/User");

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const sanitizePatient = (patientDoc) => ({
  id: patientDoc._id,
  firstName: patientDoc.firstName,
  lastName: patientDoc.lastName,
  name: patientDoc.name,
  email: patientDoc.email,
  mobile: patientDoc.mobile,
  phone: patientDoc.phone,
  bloodType: patientDoc.bloodType,
  allergies: patientDoc.allergies || [],
  emergencyContact: patientDoc.emergencyContact || null,
  assignedDoctorId: patientDoc.assignedDoctorId || null,
  createdAt: patientDoc.createdAt,
  updatedAt: patientDoc.updatedAt,
});

const getMyAssignedPatients = async (req, res, next) => {
  try {
    const { q = "", limit = 50 } = req.query;
    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

    const filter = {
      role: "patient",
      assignedDoctorId: req.user.id,
    };

    const keyword = String(q || "").trim();
    if (keyword) {
      const escapedKeyword = escapeRegex(keyword);
      const regex = new RegExp(escapedKeyword, "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { mobile: regex },
        { phone: regex },
      ];
    }

    const patients = await User.find(filter)
      .select(
        "firstName lastName name email mobile phone bloodType allergies emergencyContact assignedDoctorId createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    return res.status(200).json({
      count: patients.length,
      patients: patients.map(sanitizePatient),
    });
  } catch (error) {
    return next(error);
  }
};

const assignPatientToDoctor = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID format." });
    }

    const patient = await User.findOne({ _id: patientId, role: "patient" });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (
      patient.assignedDoctorId &&
      patient.assignedDoctorId.toString() !== req.user.id
    ) {
      return res.status(409).json({
        message: "Patient is already assigned to another doctor.",
        assignedDoctorId: patient.assignedDoctorId,
      });
    }

    if (
      patient.assignedDoctorId &&
      patient.assignedDoctorId.toString() === req.user.id
    ) {
      return res.status(200).json({
        message: "Patient is already assigned to you.",
        patient: sanitizePatient(patient),
      });
    }

    patient.assignedDoctorId = req.user.id;
    await patient.save();

    return res.status(200).json({
      message: "Patient assigned successfully.",
      patient: sanitizePatient(patient),
    });
  } catch (error) {
    return next(error);
  }
};

const unassignPatientFromDoctor = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID format." });
    }

    const patient = await User.findOne({ _id: patientId, role: "patient" });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (!patient.assignedDoctorId) {
      return res.status(200).json({
        message: "Patient is already unassigned.",
        patient: sanitizePatient(patient),
      });
    }

    if (patient.assignedDoctorId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can only unassign patients assigned to you.",
      });
    }

    patient.assignedDoctorId = null;
    await patient.save();

    return res.status(200).json({
      message: "Patient unassigned successfully.",
      patient: sanitizePatient(patient),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMyAssignedPatients,
  assignPatientToDoctor,
  unassignPatientFromDoctor,
};
