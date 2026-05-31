import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cronAuth';
import { connectDb } from '@/lib/mongodb';
import { evaluateStudentAttendance } from '@/lib/attendanceUtils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Basic authorization for cron endpoint
    const cronAuth = authorizeCronRequest(request);
    if (!cronAuth.authorized) {
      return cronAuth.response;
    }

    const db = await connectDb();

    // 1. Fetch settings to check if automation is enabled and get threshold
    // We assume there's a global admin or institute settings doc. For now, fetch the first one with institute settings or a specific one.
    // In a multi-tenant system, we might loop through all institutes. We'll fetch all settings where automation is enabled.
    const allSettings = await db.collection('settings').find({
      'institute.enableAttendanceAutomation': true
    }).toArray();

    if (!allSettings || allSettings.length === 0) {
      return NextResponse.json({ message: 'Automation is not enabled for any institute or no settings found.' });
    }

    // Process each institute/admin that enabled automation
    const notificationsToInsert = [];
    const warningLogsToInsert = [];
    const emailsToSend = [];
    
    for (const settings of allSettings) {
      const threshold = settings.institute.lowAttendanceThreshold || 75;
      
      // Fetch all attendance records (in a real system, filter by institute/classes managed by this admin)
      // Since it's a single DB instance, we'll fetch all students.
      // Fetch users with role 'student'
      const students = await db.collection('users').find({ role: 'student' }).toArray();
      
      const now = new Date();
      // Cooldown of 7 days
      const cooldownPeriod = 7 * 24 * 60 * 60 * 1000;
      const cooldownDate = new Date(now.getTime() - cooldownPeriod);

      for (const student of students) {
        // Find recent warning logs to prevent spam
        const recentLog = await db.collection('warning_logs').findOne({
          userId: student.uid,
          createdAt: { $gte: cooldownDate }
        });

        if (recentLog) {
          continue; // Skip if warned recently
        }

        // Fetch attendance for this student
        const attendanceRecords = await db.collection('attendance').find({
          userId: student.uid
        }).toArray();

        const evaluation = evaluateStudentAttendance(attendanceRecords, threshold);

        if (evaluation.isBelowThreshold) {
          // Generate Notification
          notificationsToInsert.push({
            userId: student.uid,
            title: 'Low Attendance Warning',
            message: `Your current attendance is ${evaluation.percentage}%, which is below the required ${threshold}%. Please improve your attendance.`,
            type: 'warning',
            read: false,
            createdAt: now
          });

          warningLogsToInsert.push({
            userId: student.uid,
            percentage: evaluation.percentage,
            threshold: threshold,
            createdAt: now
          });

          // Queue email if we have user email
          if (student.email) {
            emailsToSend.push({
              to_email: student.email,
              to_name: student.name || 'Student',
              attendance_percentage: evaluation.percentage,
              threshold: threshold
            });
          }
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      await db.collection('notifications').insertMany(notificationsToInsert);
      await db.collection('warning_logs').insertMany(warningLogsToInsert);
    }

    // Send emails using EmailJS REST API
    if (emailsToSend.length > 0 && process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY) {
      for (const emailData of emailsToSend) {
        try {
          await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              service_id: process.env.EMAILJS_SERVICE_ID,
              template_id: process.env.EMAILJS_TEMPLATE_ID,
              user_id: process.env.EMAILJS_PUBLIC_KEY,
              template_params: emailData
            })
          });
        } catch (error) {
          console.error(`Failed to send email to ${emailData.to_email}:`, error);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      warningsIssued: notificationsToInsert.length,
      message: `Issued ${notificationsToInsert.length} warnings.`
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
