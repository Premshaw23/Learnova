import { sendEmail, isEmailConfigured } from "@/lib/email/provider";
import { renderTemplate } from "@/lib/email/renderTemplate";

const RATE_LIMIT_PER_SECOND = 10;
const BATCH_SIZE = 50;

const queue = [];
let processing = false;
let tickCount = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const batch = queue.splice(0, BATCH_SIZE);
    tickCount = (tickCount + 1) % 10;

    await Promise.allSettled(batch.map((item) => sendEmail(item)));

    if (tickCount === 0) {
      await sleep(1000);
    }
  }

  processing = false;
}

export function enqueueEmail({ to, subject, html, text }) {
  queue.push({ to, subject, html, text });
  processQueue().catch((err) =>
    console.error("[emailService] Queue processing error:", err)
  );
  return { queued: true, queueLength: queue.length };
}

export function sendWelcomeEmail({ email, name, dashboardUrl }) {
  if (!isEmailConfigured()) return;
  const html = renderTemplate("welcome", { name, dashboardUrl });
  enqueueEmail({
    to: email,
    subject: "Welcome to Learnova!",
    html,
    text: `Welcome to Learnova, ${name}! Visit ${dashboardUrl} to get started.`,
  });
}

export function sendAttendanceAlert({ parentEmail, parentName, studentName, date, dashboardUrl }) {
  if (!isEmailConfigured()) return;
  const html = renderTemplate("attendanceAlert", {
    parentName,
    studentName,
    date,
    dashboardUrl,
  });
  enqueueEmail({
    to: parentEmail,
    subject: `Attendance Alert: ${studentName} was absent today`,
    html,
    text: `${studentName} was marked absent today (${date}). Please discuss regular attendance.`,
  });
}

export function sendWeeklyDigest({ email, name, weekRange, presentDays, absentDays, attendanceRate, dashboardUrl }) {
  if (!isEmailConfigured()) return;
  const html = renderTemplate("weeklyDigest", {
    name,
    weekRange,
    presentDays,
    absentDays,
    attendanceRate,
    dashboardUrl,
  });
  enqueueEmail({
    to: email,
    subject: `Weekly Attendance Summary - ${weekRange}`,
    html,
    text: `Your attendance this week: ${presentDays} present, ${absentDays} absent. Rate: ${attendanceRate}%`,
  });
}

export function sendPasswordChangeConfirmation({ email, name, dashboardUrl }) {
  if (!isEmailConfigured()) return;
  const html = renderTemplate("passwordChange", {
    name,
    changeDate: new Date().toLocaleDateString(),
    dashboardUrl,
  });
  enqueueEmail({
    to: email,
    subject: "Your Learnova password has been changed",
    html,
    text: `Your password was changed on ${new Date().toLocaleDateString()}. If this wasn't you, contact your admin.`,
  });
}

export function sendLowAttendanceWarning({ email, name, attendancePercentage, threshold, dashboardUrl }) {
  if (!isEmailConfigured()) return;
  const html = renderTemplate("lowAttendanceWarning", {
    name,
    attendancePercentage,
    threshold,
    dashboardUrl,
  });
  enqueueEmail({
    to: email,
    subject: `Attendance Warning: ${attendancePercentage}% - Below ${threshold}% Threshold`,
    html,
    text: `Your attendance is ${attendancePercentage}%, below the required ${threshold}%. Please improve attendance.`,
  });
}

export function sendBulkAnnouncement({ email, name, subject, body, senderName, instituteName, dashboardUrl }) {
  if (!isEmailConfigured()) return;
  const html = renderTemplate("bulkAnnouncement", {
    name,
    subject,
    body,
    senderName,
    instituteName,
    dashboardUrl,
  });
  enqueueEmail({
    to: email,
    subject,
    html,
    text: body,
  });
}
