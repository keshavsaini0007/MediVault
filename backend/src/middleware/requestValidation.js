const { body, param, query, validationResult } = require("express-validator");

const objectIdPattern = /^[a-fA-F0-9]{24}$/;
const hhmmPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const handleValidation = (req, res, next) => {
  const errors = validationResult(req).formatWith((error) => ({
    field: error.path,
    message: error.msg,
  }));

  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    message: "Validation failed.",
    errors: errors.array({ onlyFirstError: true }),
  });
};

const validateDoctorPatientsQuery = [
  query("q")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage("q must be between 1 and 80 characters."),
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100."),
  handleValidation,
];

const validateDoctorPatientIdParam = [
  param("patientId")
    .matches(objectIdPattern)
    .withMessage("patientId must be a valid ObjectId."),
  handleValidation,
];

const validateRecordIdParam = [
  param("id")
    .matches(objectIdPattern)
    .withMessage("id must be a valid ObjectId."),
  handleValidation,
];

const validateReportIdParam = [
  param("id")
    .matches(objectIdPattern)
    .withMessage("id must be a valid ObjectId."),
  handleValidation,
];

const validateCreateRecord = [
  body("patientId")
    .notEmpty()
    .withMessage("patientId is required.")
    .bail()
    .matches(objectIdPattern)
    .withMessage("patientId must be a valid ObjectId."),
  body("diagnosis")
    .notEmpty()
    .withMessage("diagnosis is required.")
    .bail()
    .isString()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("diagnosis must be between 2 and 200 characters."),
  body("notes")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: 3000 })
    .withMessage("notes can be at most 3000 characters."),
  body("medicines")
    .optional({ values: "falsy" })
    .isArray()
    .withMessage("medicines must be an array."),
  body("medicines.*")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage("Each medicine entry must be between 1 and 120 characters."),
  body("fileUrls")
    .optional({ values: "falsy" })
    .isArray()
    .withMessage("fileUrls must be an array."),
  body("fileUrls.*")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage("Each fileUrls entry must be between 3 and 500 characters."),
  body("aiSummary")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: 3000 })
    .withMessage("aiSummary can be at most 3000 characters."),
  body("date")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("date must be a valid ISO 8601 datetime."),
  handleValidation,
];

const validateAddMedicine = [
  body("name")
    .notEmpty()
    .withMessage("name is required.")
    .bail()
    .isString()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("name must be between 2 and 120 characters."),
  body("dosage")
    .notEmpty()
    .withMessage("dosage is required.")
    .bail()
    .isString()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage("dosage must be between 1 and 80 characters."),
  body("frequency")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ min: 1, max: 40 })
    .withMessage("frequency must be between 1 and 40 characters."),
  body("timeSlots")
    .optional({ values: "falsy" })
    .isArray({ min: 1, max: 10 })
    .withMessage("timeSlots must be an array with 1 to 10 entries."),
  body("timeSlots.*")
    .optional({ values: "falsy" })
    .matches(hhmmPattern)
    .withMessage("Each timeSlots entry must be in HH:mm format."),
  body("startDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 datetime."),
  body("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 datetime."),
  body("instructions")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("instructions can be at most 500 characters."),
  handleValidation,
];

const validateLogDose = [
  param("id")
    .matches(objectIdPattern)
    .withMessage("id must be a valid ObjectId."),
  body("status")
    .isIn(["taken", "missed"])
    .withMessage("status must be either taken or missed."),
  body("scheduledTime")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("scheduledTime must be a valid ISO 8601 datetime."),
  handleValidation,
];

const validateMarkDoseStatus = [
  body("medicineId")
    .notEmpty()
    .withMessage("medicineId is required.")
    .bail()
    .matches(objectIdPattern)
    .withMessage("medicineId must be a valid ObjectId."),
  body("status")
    .isIn(["taken", "missed"])
    .withMessage("status must be either taken or missed."),
  body("scheduledTime")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("scheduledTime must be a valid ISO 8601 datetime."),
  handleValidation,
];

const validateAdherenceQuery = [
  query("medicineId")
    .optional({ values: "falsy" })
    .matches(objectIdPattern)
    .withMessage("medicineId must be a valid ObjectId."),
  handleValidation,
];

const validateSymptomCheck = [
  body("symptoms")
    .notEmpty()
    .withMessage("symptoms is required.")
    .bail()
    .isString()
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage("symptoms length must be between 3 and 1000 characters."),
  handleValidation,
];

const validateNotificationsQuery = [
  query("unreadOnly")
    .optional({ values: "falsy" })
    .isBoolean()
    .withMessage("unreadOnly must be a boolean."),
  query("isRead")
    .optional({ values: "falsy" })
    .isBoolean()
    .withMessage("isRead must be a boolean."),
  query("type")
    .optional({ values: "falsy" })
    .isIn(["dose_missed", "dose_missed_caregiver", "dose_daily_summary", "symptom_urgent", "system"])
    .withMessage("type must be one of dose_missed, dose_missed_caregiver, dose_daily_summary, symptom_urgent, or system."),
  query("from")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("from must be a valid ISO 8601 datetime."),
  query("to")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("to must be a valid ISO 8601 datetime."),
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100."),
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 10000 })
    .withMessage("page must be an integer between 1 and 10000."),
  handleValidation,
];

const validateNotificationIdParam = [
  param("id")
    .matches(objectIdPattern)
    .withMessage("id must be a valid ObjectId."),
  handleValidation,
];

const validateQrEmergencyTokenParam = [
  param("qrToken")
    .notEmpty()
    .withMessage("qrToken is required.")
    .bail()
    .isString()
    .isLength({ min: 20, max: 2000 })
    .withMessage("qrToken is invalid."),
  handleValidation,
];

const validateQrScan = [
  body("qrToken")
    .notEmpty()
    .withMessage("qrToken is required.")
    .bail()
    .isString()
    .isLength({ min: 20, max: 2000 })
    .withMessage("qrToken is invalid."),
  body("context")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("context must be between 2 and 80 characters."),
  handleValidation,
];

const validateQrAuditQuery = [
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100."),
  handleValidation,
];

const validateSendMessage = [
  body().custom((_, { req }) => {
    const recipientId = req.body.recipientId || req.body.patientId;
    if (!recipientId) {
      throw new Error("recipientId or patientId is required.");
    }

    if (!objectIdPattern.test(String(recipientId))) {
      throw new Error("recipientId/patientId must be a valid ObjectId.");
    }

    return true;
  }),
  body().custom((_, { req }) => {
    const content = req.body.body || req.body.content;
    if (typeof content !== "string") {
      throw new Error("body or content is required.");
    }

    const trimmed = content.trim();
    if (trimmed.length < 1 || trimmed.length > 2000) {
      throw new Error("body/content must be between 1 and 2000 characters.");
    }

    return true;
  }),
  handleValidation,
];

const validateConversationIdParam = [
  param("conversationId")
    .matches(objectIdPattern)
    .withMessage("conversationId must be a valid ObjectId."),
  handleValidation,
];

const validateConversationMessagesQuery = [
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100."),
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 10000 })
    .withMessage("page must be an integer between 1 and 10000."),
  handleValidation,
];

module.exports = {
  validateDoctorPatientsQuery,
  validateDoctorPatientIdParam,
  validateRecordIdParam,
  validateReportIdParam,
  validateCreateRecord,
  validateAddMedicine,
  validateLogDose,
  validateMarkDoseStatus,
  validateAdherenceQuery,
  validateSymptomCheck,
  validateNotificationsQuery,
  validateNotificationIdParam,
  validateQrEmergencyTokenParam,
  validateQrScan,
  validateQrAuditQuery,
  validateSendMessage,
  validateConversationIdParam,
  validateConversationMessagesQuery,
};
