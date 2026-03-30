const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");
const {
  cloudinary,
  uploadBufferToCloudinary,
} = require("../config/cloudinary");
const {
  extractTextFromImageBuffer,
  extractTextFromPdfBuffer,
} = require("../services/ocrService");

const getMyReports = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = { patientId: req.user.id };
    const total = await Report.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / parsedLimit), 1);

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    return res.status(200).json({
      reports,
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

const uploadMyReport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file." });
    }

    const reportType = req.body.reportType || "Other";
    const originalName = (req.file.originalname || "").toLowerCase();
    const isPdf =
      req.file.mimetype === "application/pdf" || originalName.endsWith(".pdf");

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      public_id: `${req.user.id}_${Date.now()}`,
      resource_type: isPdf ? "raw" : "auto",
    });

    const deliveredFileUrl = uploadResult.secure_url;

    let ocrText = "";
    let ocrConfidence = null;
    let ocrReason = null;

    if (req.file.mimetype.startsWith("image/")) {
      try {
        const ocrResult = await extractTextFromImageBuffer(req.file.buffer);
        ocrText = ocrResult.text;
        ocrConfidence = ocrResult.confidence;
        if (!ocrText) {
          ocrReason = "No readable text found in image.";
        }
      } catch (ocrError) {
        console.error("Tesseract OCR failed:", ocrError.message);
        ocrConfidence = 0;
        ocrReason = ocrError.message;
      }
    } else if (isPdf) {
      try {
        const ocrResult = await extractTextFromPdfBuffer(req.file.buffer);
        ocrText = ocrResult.text;
        ocrConfidence = ocrResult.confidence;
        if (!ocrText) {
          ocrReason =
            "PDF has no selectable text (likely scanned). Text extraction returned empty.";
        }
      } catch (ocrError) {
        console.error("PDF text extraction failed:", ocrError.message);
        ocrConfidence = 0;
        ocrReason = ocrError.message;
      }
    }

    const report = await Report.create({
      patientId: req.user.id,
      reportType,
      originalName: req.file.originalname,
      mimeType: isPdf ? "application/pdf" : req.file.mimetype,
      size: req.file.size,
      fileUrl: deliveredFileUrl,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryResourceType: uploadResult.resource_type,
      aiSummary: "",
      ocrText,
      ocrConfidence,
    });

    return res.status(201).json({
      message: "Report uploaded successfully.",
      report,
      ocr: {
        extracted: Boolean(ocrText),
        confidence: ocrConfidence,
        reason: ocrReason,
      },
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
