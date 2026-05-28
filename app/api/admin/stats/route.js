import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import admin from "firebase-admin";
import {
  DEFAULT_SYSTEM_METRICS,
  DEFAULT_CRITICAL_ALERTS,
  DEFAULT_FEATURE_USAGE,
} from "@/constants/adminMockData";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["admin"]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`admin_stats_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }
  const db = admin.firestore();

  let totalUsers = 0;
  let institutes = [];
  let systemMetrics = DEFAULT_SYSTEM_METRICS;
  let criticalAlerts = DEFAULT_CRITICAL_ALERTS;
  let featureUsage = DEFAULT_FEATURE_USAGE;

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
