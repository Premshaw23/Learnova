let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  const nodemailer = await import("nodemailer");

  transporter = nodemailer.default.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  return transporter;
}

export function isEmailConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

export async function sendEmail({ to, subject, html, text }) {
  const transport = await getTransporter();
  if (!transport) {
    console.warn("[email/provider] SMTP not configured, skipping email");
    return { success: false, skipped: true };
  }

  const fromName = process.env.EMAIL_FROM_NAME || "Learnova";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "noreply@learnova.app";

  const info = await transport.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    text: text || "",
    html: html || "",
  });

  return { success: true, messageId: info.messageId };
}
