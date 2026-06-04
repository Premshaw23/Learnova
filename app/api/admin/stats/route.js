import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import admin from "firebase-admin";
import { AggregateField } from "firebase-admin/firestore";
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

    const totalCountSnap = await db.collection("institutes").count().get();
    const totalInstitutes = totalCountSnap.data().count || 0;

    const activeCountSnap = await db.collection("institutes").where("status", "==", "active").count().get();
    const activeInstitutes = activeCountSnap.data().count || 0;

    // Fetch the aggregate sum of issues field using Firestore server-side aggregation
    const sumQuery = db.collection("institutes").aggregate({
      totalIssues: AggregateField.sum("issues")
    });
    const allInstitutesSnap = await sumQuery.get();
    const pendingIssues = allInstitutesSnap.data().totalIssues || 0;

    const instSnapshot = await db.collection("institutes")
      .select("name", "status", "issues")
      .limit(100)
      .get();
    if (!instSnapshot.empty) {
      institutes = instSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    const metricsDoc = await db.collection("system_metrics").doc("current").get();
    if (metricsDoc.exists) {
      const data = metricsDoc.data();
      systemMetrics = {
        activeInstances: data.activeInstances ?? 0,
        totalCourses: data.totalCourses ?? 0,
        totalUsers: data.totalUsers ?? 0,
        storageUsed: data.storageUsed ?? "0 GB",
      };
    }

    const alertsSnapshot = await db.collection("critical_alerts")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    if (!alertsSnapshot.empty) {
      criticalAlerts = alertsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    const usageDoc = await db.collection("feature_usage").doc("current").get();
    if (usageDoc.exists) {
      const data = usageDoc.data();
      featureUsage = {
        dailyActiveUsers: data.dailyActiveUsers ?? 0,
        featureBreakdown: data.featureBreakdown ?? {},
      };
    }
  } catch (err) {
    console.error("Error fetching admin stats from Firestore:", err);
    return NextResponse.json(
      { error: "Dashboard data temporarily unavailable" },
      { status: 502 }
    );
  }

  // Totals are computed from dedicated count queries (not from the truncated list)

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
