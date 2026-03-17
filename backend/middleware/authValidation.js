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
    .trim()
    .notEmpty()
    .bail()
    .withMessage("Name is required.")
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters."),
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
    .withMessage("Password must be at least 8 characters long."),
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
  body("hospitalId")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 40 })
    .withMessage("Hospital ID must be between 3 and 40 characters."),
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
  handleValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
};
