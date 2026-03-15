const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");
const {
  cloudinary,
  uploadBufferToCloudinary,
} = require("../config/cloudinary");

const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ patientId: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ reports });
  } catch (error) {
    return next(error);
  }
};

const uploadMyReport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file." });
    }

    const reportType = req.body.reportType || "Other";

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      public_id: `${req.user.id}_${Date.now()}`,
    });

    const report = await Report.create({
      patientId: req.user.id,
      reportType,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryResourceType: uploadResult.resource_type,
      aiSummary: "",
    });

    return res.status(201).json({
      message: "Report uploaded successfully.",
      report,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteMyReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid report id." });
    }

    const report = await Report.findOne({ _id: id, patientId: req.user.id });
    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    await cloudinary.uploader.destroy(report.cloudinaryPublicId, {
      resource_type: report.cloudinaryResourceType || "image",
    });

    await report.deleteOne();

    return res.status(200).json({ message: "Report deleted successfully." });
  } catch (error) {
    return next(error);
  }
};

const getPatientReports = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient id." });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ message: "Patient not found." });
    }

    if (
      !patient.assignedDoctorId ||
      patient.assignedDoctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "This patient is not assigned to you." });
    }

    const reports = await Report.find({ patientId }).sort({ createdAt: -1 });

    return res.status(200).json({
      patient: {
        id: patient._id,
        name: patient.name,
      },
      reports,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMyReports,
  uploadMyReport,
  deleteMyReport,
  getPatientReports,
};
