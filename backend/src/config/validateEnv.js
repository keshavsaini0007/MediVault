const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  const optionalMailVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"];
  const providedMailVars = optionalMailVars.filter((key) => Boolean(process.env[key]));

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (!process.env.BACKEND_PUBLIC_URL) {
    console.warn(
      "BACKEND_PUBLIC_URL is not set. QR URLs will use request host/protocol."
    );
  }

  if (providedMailVars.length > 0 && providedMailVars.length < optionalMailVars.length) {
    console.warn(
      "SMTP config is partially set. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM to enable caregiver email summaries."
    );
  }

  if (providedMailVars.length === 0) {
    console.warn(
      "SMTP config is not set. Caregiver daily summary emails are disabled."
    );
  }
};

module.exports = validateEnv;
