const nodemailer = require("nodemailer");

let transporter;
let hasWarnedAboutConfig = false;

const getMailConfig = () => ({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.MAIL_FROM,
});

const isEmailConfigured = () => {
  const config = getMailConfig();
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
};

const getTransporter = () => {
  if (!isEmailConfigured()) {
    if (!hasWarnedAboutConfig) {
      hasWarnedAboutConfig = true;
      console.warn("[EmailService] SMTP config is incomplete. Caregiver summary emails are disabled.");
    }
    return null;
  }

  if (!transporter) {
    const config = getMailConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return transporter;
};

const buildCaregiverSummaryContent = ({ patientName, dateLabel, missedMedicines }) => {
  const medicationLines = missedMedicines.map((item) => {
    const times = item.times.join(", ");
    return `- ${item.medicineName}${item.dosage ? ` (${item.dosage})` : ""}: ${times}`;
  });

  const text = [
    `Daily missed medication summary for ${patientName}`,
    `Date: ${dateLabel}`,
    "",
    "Missed medicines:",
    ...medicationLines,
  ].join("\n");

  const htmlItems = missedMedicines
    .map(
      (item) =>
        `<li><strong>${item.medicineName}</strong>${item.dosage ? ` (${item.dosage})` : ""} - ${item.times.join(", ")}</li>`
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.4; color: #1f2937;">
      <h2 style="margin-bottom: 4px;">Daily Missed Medication Summary</h2>
      <p style="margin: 0 0 12px 0;"><strong>Patient:</strong> ${patientName}</p>
      <p style="margin: 0 0 16px 0;"><strong>Date:</strong> ${dateLabel}</p>
      <p style="margin: 0 0 8px 0;">The patient missed the following medications today:</p>
      <ul style="padding-left: 20px; margin-top: 0;">${htmlItems}</ul>
    </div>
  `;

  return { text, html };
};

const sendCaregiverDailyMissedDoseSummary = async ({
  caregiverEmail,
  caregiverName,
  patientName,
  dateLabel,
  missedMedicines,
}) => {
  const transport = getTransporter();
  if (!transport) {
    return { skipped: true, reason: "smtp_not_configured" };
  }

  const config = getMailConfig();
  const subject = `MediVault: Missed medications for ${patientName} on ${dateLabel}`;
  const { text, html } = buildCaregiverSummaryContent({
    patientName,
    dateLabel,
    missedMedicines,
  });

  const info = await transport.sendMail({
    from: config.from,
    to: caregiverEmail,
    subject,
    text,
    html,
  });

  return {
    skipped: false,
    messageId: info.messageId,
    accepted: info.accepted,
    caregiverName,
  };
};

module.exports = {
  isEmailConfigured,
  sendCaregiverDailyMissedDoseSummary,
};
