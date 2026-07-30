import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { db } from '@/lib/firebaseAdmin';

/**
 * POST /api/cron/weekly-report
 * Compiles and dispatches a weekly progress report for a student to their parent.
 * In production, this would be triggered by a scheduled Cloud Function (cron).
 * A teacher/admin can also trigger it manually for any student.
 */
export async function POST(request) {
  try {
    const token = await requireAuth(request);
    if (!['teacher', 'admin'].includes(token.role)) {
      return NextResponse.json({ error: 'Only teachers or admins can trigger reports.' }, { status: 403 });
    }

    const { studentId } = await request.json();
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required.' }, { status: 400 });
    }

    // Fetch student profile
    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    const student = studentDoc.data();

    // Compile report data from Firestore
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const attendanceSnap = await db.collection('attendance')
      .where('studentId', '==', studentId)
      .where('date', '>=', weekAgo.toISOString())
      .get();

    const submissionsSnap = await db.collection('submissions')
      .where('studentId', '==', studentId)
      .where('submittedAt', '>=', weekAgo.toISOString())
      .get();

    const attendanceRecords = attendanceSnap.docs.map(d => d.data());
    const submissions = submissionsSnap.docs.map(d => d.data());

    const attendanceRate = attendanceRecords.length > 0
      ? (attendanceRecords.filter(a => a.status === 'present').length / attendanceRecords.length * 100).toFixed(1)
      : 'N/A';

    const avgGrade = submissions.length > 0
      ? (submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.length).toFixed(1)
      : 'N/A';

    const report = {
      studentName: student.displayName || student.name || 'Student',
      parentEmail: student.parentEmail || null,
      weekStarting: weekAgo.toISOString().split('T')[0],
      weekEnding: now.toISOString().split('T')[0],
      attendanceRate: `${attendanceRate}%`,
      assignmentsSubmitted: submissions.length,
      averageGrade: avgGrade,
      currentStreak: student.streak || 0,
      generatedAt: now.toISOString(),
    };

    // Log the report to Firestore for audit trail
    await db.collection('weekly_reports').add({
      ...report,
      triggeredBy: token.uid,
    });

    // NOTE: In production, send email via SendGrid/Nodemailer here.
    // Email sending omitted as SMTP is not configured in development.
    // The report payload is returned for verification.

    return NextResponse.json({
      success: true,
      message: report.parentEmail
        ? `Report compiled and would be sent to ${report.parentEmail} in production.`
        : 'No parent email on file. Report saved to audit log.',
      report,
    });
  } catch (error) {
    console.error('Weekly Report Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
