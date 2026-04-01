const { body, validationResult } = require("express-validator");

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

const validateRegister = [
  body("name")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters."),
  body("firstName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1, max: 40 })
    .withMessage("First name must be between 1 and 40 characters."),
  body("lastName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1, max: 40 })
    .withMessage("Last name must be between 1 and 40 characters."),
  body()
    .custom((_, { req }) => {
      const hasName = Boolean(req.body.name && String(req.body.name).trim());
      const hasFirst = Boolean(req.body.firstName && String(req.body.firstName).trim());
      const hasLast = Boolean(req.body.lastName && String(req.body.lastName).trim());

      if (!hasName && !(hasFirst && hasLast)) {
        throw new Error("Provide either name, or both firstName and lastName.");
      }

      return true;
    }),
  body("email")
    .trim()
    .notEmpty()
    .bail()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Enter a valid email address.")
    .normalizeEmail(),
  body("username")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters.")
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage("Username can contain only letters, numbers, underscore, dot, and hyphen."),
  body("password")
    .notEmpty()
    .bail()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character."),
  body("role")
    .notEmpty()
    .bail()
    .withMessage("Role is required.")
    .isIn(["patient", "doctor"])
    .withMessage("Role must be either patient or doctor."),
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage("Phone must be between 7 and 20 characters."),
  body("mobile")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage("Mobile must be between 7 and 20 characters."),
  body("caregiverName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Caregiver name must be between 2 and 80 characters."),
  body("caregiverEmail")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Enter a valid caregiver email address.")
    .normalizeEmail(),
  body("caregiverPhone")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage("Caregiver phone must be between 7 and 20 characters."),
  body("caregiver")
    .optional({ values: "falsy" })
    .custom((value) => {
      if (typeof value !== "object" || Array.isArray(value)) {
        throw new Error("caregiver must be an object.");
      }
      return true;
    }),
  body("caregiver.name")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Caregiver name must be between 2 and 80 characters."),
  body("caregiver.email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Enter a valid caregiver email address.")
    .normalizeEmail(),
  body("caregiver.phone")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage("Caregiver phone must be between 7 and 20 characters."),
  body()
    .custom((_, { req }) => {
      if (req.body.role !== "patient") {
        return true;
      }

      const caregiverName = req.body.caregiverName ?? req.body.caregiver?.name;
      const caregiverEmail = req.body.caregiverEmail ?? req.body.caregiver?.email;
      const caregiverPhone = req.body.caregiverPhone ?? req.body.caregiver?.phone;

      if (!caregiverName || !String(caregiverName).trim()) {
        throw new Error("Caregiver name is required for patient registration.");
      }

      if (!caregiverEmail || !String(caregiverEmail).trim()) {
        throw new Error("Caregiver email is required for patient registration.");
      }

      if (!caregiverPhone || !String(caregiverPhone).trim()) {
        throw new Error("Caregiver phone is required for patient registration.");
      }

      return true;
    }),
  body("hospitalId")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 40 })
    .withMessage("Hospital ID must be between 3 and 40 characters."),
  body("hospitalId")
    .custom((value, { req }) => {
      if (req.body.role === "doctor" && (!value || String(value).trim() === "")) {
        throw new Error("Hospital ID is required for doctor registration.");
      }
      return true;
    }),
  body("bloodType")
    .optional({ values: "falsy" })
    .isIn(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])
    .withMessage("Blood type must be one of A+, A-, B+, B-, O+, O-, AB+, AB-."),
  body("allergies")
    .optional({ values: "falsy" })
    .custom((value) => {
      const isString = typeof value === "string";
      const isStringArray = Array.isArray(value) && value.every((item) => typeof item === "string");
      if (!isString && !isStringArray) {
        throw new Error("Allergies must be a string or array of strings.");
      }
      return true;
    }),
  body("specialization")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Specialization must be between 2 and 80 characters."),
  body("spec")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Spec must be between 2 and 80 characters."),
  handleValidation,
];

const validateLogin = [
  body("password")
    .notEmpty()
    .withMessage("Password is required."),
  body()
    .custom((_, { req }) => {
      const hasIdentifier = Boolean(
        req.body.email ||
        req.body.mobile ||
        req.body.phone ||
        req.body.username ||
        req.body.hospitalId ||
        req.body.identifier
      );

      if (!hasIdentifier) {
        throw new Error(
          "Provide at least one login identifier: email, mobile, phone, username, hospitalId, or identifier."
        );
      }

      return true;
    }),
  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address.")
    .normalizeEmail(),
  body("mobile")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage("Mobile must be between 7 and 20 characters."),
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage("Phone must be between 7 and 20 characters."),
  body("username")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters."),
  body("hospitalId")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 40 })
    .withMessage("Hospital ID must be between 3 and 40 characters."),
  body("identifier")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 80 })
    .withMessage("Identifier must be between 3 and 80 characters."),
  body("role")
    .optional({ values: "falsy" })
    .isIn(["patient", "doctor"])
    .withMessage("Role must be either patient or doctor."),
  body("loginMode")
    .optional({ values: "falsy" })
    .isIn(["email", "mobile", "username", "hospitalId"])
    .withMessage("loginMode must be one of email, mobile, username, hospitalId."),
  handleValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
};
