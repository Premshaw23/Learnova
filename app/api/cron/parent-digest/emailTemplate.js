export const generateParentDigestHtml = (studentName, weekStats) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f4f4f5; color: #18181b; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { text-align: center; border-bottom: 2px solid #f4f4f5; padding-bottom: 20px; margin-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin: 0; }
    .title { font-size: 20px; color: #3f3f46; margin-top: 10px; }
    .stat-card { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
    .stat-title { font-size: 14px; font-weight: 600; color: #71717a; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 24px; font-weight: bold; color: #27272a; margin: 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">Learnova</h1>
      <h2 class="title">Weekly Progress Digest for ${studentName}</h2>
    </div>
    
    <p>Hi there,</p>
    <p>Here is a quick summary of how ${studentName} performed on Learnova this week!</p>

    <div class="stat-card">
      <p class="stat-title">Attendance Rate</p>
      <p class="stat-value" style="color: #10b981;">${weekStats.attendance}%</p>
    </div>

    <div class="stat-card">
      <p class="stat-title">XP Earned this week</p>
      <p class="stat-value" style="color: #f59e0b;">+${weekStats.xpEarned} XP 🌟</p>
    </div>

    <div class="stat-card">
      <p class="stat-title">Assignments Completed</p>
      <p class="stat-value" style="color: #3b82f6;">${weekStats.assignmentsDone} / ${weekStats.assignmentsTotal}</p>
    </div>

    <p style="margin-top: 25px;">Log in to your Parent Dashboard to view detailed analytics and message teachers directly.</p>

    <div class="footer">
      <p>You are receiving this email because you opted into Weekly Digests.</p>
      <p>© 2026 Learnova. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
