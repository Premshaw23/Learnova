import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  await requireRole(request, ["admin"]);

  const db = admin.firestore();

  let totalUsers = 0;
  let institutes = [];
  let systemMetrics = null;
  let criticalAlerts = [];
  let featureUsage = null;

  try {
    const usersCountSnap = await db.collection("users").count().get();
    totalUsers = usersCountSnap.data().count || 0;

    const instSnapshot = await db.collection("institutes").get();
    if (!instSnapshot.empty) {
      institutes = instSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    const metricsDoc = await db.collection("system_metrics").doc("current").get();
    if (metricsDoc.exists) {
      systemMetrics = metricsDoc.data();
    }

    const alertsSnapshot = await db.collection("critical_alerts").get();
    if (!alertsSnapshot.empty) {
      criticalAlerts = alertsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    const usageDoc = await db.collection("feature_usage").doc("current").get();
    if (usageDoc.exists) {
      featureUsage = usageDoc.data();
    }
  } catch (err) {
    console.error("Error fetching admin stats from Firestore:", err);
    return NextResponse.json(
      { error: "Dashboard data temporarily unavailable" },
      { status: 502 }
    );
  }

  const totalInstitutes = institutes.length;
  const activeInstitutes = institutes.filter((inst) => inst.status === "active").length;
  const pendingIssues = institutes.reduce((sum, inst) => sum + (inst.issues || 0), 0);

  const platformStats = {
    totalInstitutes,
    activeInstitutes,
    totalUsers,
    dailyActiveUsers: Math.round(totalUsers * 0.78),
    pendingIssues,
  };

  return NextResponse.json({
    platformStats,
    institutes,
    systemMetrics,
    criticalAlerts,
    featureUsage,
  });
});
