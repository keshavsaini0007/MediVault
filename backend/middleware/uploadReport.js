const multer = require("multer");

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error("Only PDF, JPG, PNG, and WEBP files are allowed."));
  }

  return cb(null, true);
};

const uploadReport = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = uploadReport;
