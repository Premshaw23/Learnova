import { NextResponse } from 'next/server';
import { authorizeCronRequest } from '@/lib/cronAuth';
import { connectDb } from '@/lib/mongodb';
import { getUserProfile } from '@/lib/firebase-admin';
import { initializeFirebase } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { evaluateStudentAttendance } from '@/lib/attendanceUtils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const cronAuth = authorizeCronRequest(request);
    if (!cronAuth.authorized) {
      return cronAuth.response;
    }

    const db = await connectDb();
    initializeFirebase();
    const firestore = admin.firestore();

    // 1. Fetch settings for institutes that enabled automation
    // Fetch settings where attendance automation is enabled
    const allSettings = await db.collection('settings').find({
      'institute.enableAttendanceAutomation': true
    }).toArray();

    if (!allSettings || allSettings.length === 0) {
      return NextResponse.json({ message: 'Automation is not enabled for any institute or no settings found.' });
    }

    const now = new Date();
    const cooldownPeriod = 7 * 24 * 60 * 60 * 1000;
    const cooldownDate = new Date(now.getTime() - cooldownPeriod);

    const notificationsToInsert = [];
    const warningLogsToInsert = [];
    const emailsToSend = [];

    for (const settings of allSettings) {
      const threshold = settings.institute.lowAttendanceThreshold || 75;

      // Fetch all students from MongoDB
      const students = await db.collection('users').find({ role: 'student' }).toArray();

      for (const student of students) {
        const studentUid = student.firebaseUid;
        if (!studentUid) continue;

        // Check recent warning logs to prevent spam
        const recentLog = await db.collection('warning_logs').findOne({
          userId: studentUid,
          createdAt: { $gte: cooldownDate }
        });

        if (recentLog) {
          continue;
        }

        // Fetch attendance records from Firestore attendance_records collection
        const attendanceSnapshot = await firestore
          .collection('attendance_records')
          .where('userId', '==', studentUid)
          .get();

        const studentAttendance = attendanceSnapshot.docs.map(doc => doc.data());

        const evaluation = evaluateStudentAttendance(studentAttendance, threshold);

        if (evaluation.isBelowThreshold) {
          notificationsToInsert.push({
            userId: studentUid,
            title: 'Low Attendance Warning',
            message: `Your current attendance is ${evaluation.percentage}%, which is below the required ${threshold}%. Please improve your attendance.`,
            type: 'warning',
            read: false,
            createdAt: now,
          });

          warningLogsToInsert.push({
            userId: studentUid,
            percentage: evaluation.percentage,
            threshold,
            createdAt: now,
          });

          if (student.email) {
            emailsToSend.push({
              to_email: student.email,
              to_name: student.fullName || student.name || 'Student',
              attendance_percentage: evaluation.percentage,
              threshold,
            });
          }
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      await db.collection('notifications').insertMany(notificationsToInsert);
      await db.collection('warning_logs').insertMany(warningLogsToInsert);
    }

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
              template_params: emailData,
            }),
          });
        } catch (error) {
          console.error(`Failed to send email to ${emailData.to_email}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      warningsIssued: notificationsToInsert.length,
      message: `Issued ${notificationsToInsert.length} warnings.`,
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
