/**
 * Simple template generator for Learnova emails
 */

export function getWelcomeEmailTemplate(name) {
  return {
    subject: "Welcome to Learnova!",
    text: `Hi ${name},\n\nWelcome to Learnova! We are excited to have you on board.\n\nBest,\nThe Learnova Team`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Welcome to Learnova!</h2>
        <p>Hi ${name},</p>
        <p>Welcome to Learnova! We are excited to have you on board.</p>
        <br/>
        <p>Best,<br/>The Learnova Team</p>
      </div>
    `,
  };
}

export function getAttendanceAlertTemplate(childName, date, threshold) {
  return {
    subject: `Attendance Alert: ${childName}`,
    text: `Dear Parent,\n\nThis is an alert that ${childName}'s attendance on ${date} has fallen below the acceptable threshold (${threshold}%).\nPlease review their attendance record on the Parent Dashboard.\n\nBest,\nLearnova Administration`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ffcccc; background-color: #fff5f5; border-radius: 8px;">
        <h2 style="color: #d32f2f;">Attendance Alert</h2>
        <p>Dear Parent,</p>
        <p>This is an alert that <strong>${childName}</strong>'s attendance on ${date} has fallen below the acceptable threshold (${threshold}%).</p>
        <p>Please review their attendance record on the Parent Dashboard.</p>
        <br/>
        <p>Best,<br/>Learnova Administration</p>
      </div>
    `,
  };
}

export function getLowAttendanceDigestTemplate(childName, percentage) {
  return {
    subject: `Weekly Attendance Digest: ${childName}`,
    text: `Dear Parent,\n\nHere is your weekly digest.\n${childName}'s current attendance is ${percentage}%.\n\nBest,\nLearnova Administration`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
        <h2>Weekly Attendance Digest</h2>
        <p>Dear Parent,</p>
        <p>Here is your weekly digest.</p>
        <p><strong>${childName}</strong>'s current attendance is <strong>${percentage}%</strong>.</p>
        <br/>
        <p>Best,<br/>Learnova Administration</p>
      </div>
    `,
  };
}

export function getPasswordChangeTemplate(name) {
  return {
    subject: "Password Changed Successfully",
    text: `Hi ${name},\n\nYour Learnova password was recently changed. If this was not you, please contact support immediately.\n\nBest,\nThe Learnova Team`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Password Changed</h2>
        <p>Hi ${name},</p>
        <p>Your Learnova password was recently changed. If this was not you, please contact support immediately.</p>
        <br/>
        <p>Best,<br/>The Learnova Team</p>
      </div>
    `,
  };
}

export function getBulkAnnouncementTemplate(subject, bodyHtml, bodyText) {
  return {
    subject: subject,
    text: bodyText || bodyHtml.replace(/<[^>]+>/g, ''), // naive strip tags
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        ${bodyHtml}
        <hr style="margin-top: 40px; border-top: 1px solid #ccc;"/>
        <p style="font-size: 12px; color: #777;">This is an announcement from Learnova Administration.</p>
      </div>
    `,
  };
}
