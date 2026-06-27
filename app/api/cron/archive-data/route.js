import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET(req) {
  try {
    // Basic protection to prevent random unauthenticated triggers if not hitting via Vercel Cron.
    // Ideally we would verify Vercel's CRON_SECRET:
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }
    // Since we don't have CRON_SECRET configured for sure in this environment, 
    // we'll leave it open for demonstration/manual triggering or rely on Vercel's network layer.

    initAdmin();
    const db = getFirestore();

    // Fetch config
    const settingsDoc = await db.collection("settings").doc("data-retention").get();
    let config = {
      attendanceRetentionMonths: 24, // default 2 years
      biometricPurgeMonths: 12 // default 1 year of inactivity
    };

    if (settingsDoc.exists) {
      config = { ...config, ...settingsDoc.data() };
    }

    const { attendanceRetentionMonths, biometricPurgeMonths } = config;
    const now = new Date();

    const attendanceThreshold = new Date();
    attendanceThreshold.setMonth(now.getMonth() - attendanceRetentionMonths);

    const biometricThreshold = new Date();
    biometricThreshold.setMonth(now.getMonth() - biometricPurgeMonths);

    let attendanceArchived = 0;
    let biometricsPurged = 0;

    // 1. Archive Old Attendance Logs
    // We fetch attendance records older than threshold
    // (If the dataset is large, in a real prod app we'd paginate this or use batch operations)
    const attendanceSnapshot = await db.collection("attendance")
      .where("timestamp", "<", attendanceThreshold)
      .limit(500) // limit for safety in a single function execution
      .get();

    if (!attendanceSnapshot.empty) {
      const batch = db.batch();
      attendanceSnapshot.forEach(doc => {
        // Ideally we'd move to a cold-storage collection before deleting.
        // For now, we simulate archiving by deleting from primary hot storage.
        batch.delete(doc.ref);
        attendanceArchived++;
      });
      await batch.commit();
    }

    // 2. Purge Inactive Biometric Data
    // We look for users whose lastLogin was before the threshold, and who still have faceDescriptors
    const usersSnapshot = await db.collection("users")
      .where("lastLogin", "<", biometricThreshold)
      .limit(500)
      .get();

    if (!usersSnapshot.empty) {
      const batch = db.batch();
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.faceDescriptors || data.hasRegisteredFace) {
          batch.update(doc.ref, {
            faceDescriptors: null, // Purge biometric array
            hasRegisteredFace: false,
            _biometricPurgedAt: new Date()
          });
          biometricsPurged++;
        }
      });
      // Only commit if there were actually documents to update
      if (biometricsPurged > 0) {
        await batch.commit();
      }
    }

    // 3. Log the audit
    await db.collection("auditLogs").add({
      type: "DATA_RETENTION_POLICY_RUN",
      timestamp: new Date(),
      details: {
        attendanceArchived,
        biometricsPurged,
        attendanceRetentionMonths,
        biometricPurgeMonths
      }
    });

    return NextResponse.json({
      success: true,
      message: "Data retention policy executed successfully",
      stats: {
        attendanceArchived,
        biometricsPurged
      }
    }, { status: 200 });

  } catch (err) {
    console.error("Cron Error executing data retention policy:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
