import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["institute", "admin"]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`institute_stats_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }
  const db = admin.firestore();
  const uid = decodedToken.uid;

  let studentDocs = [];
  let teacherDocs = [];
  let classes = [];
  let attendanceRequests = [];
  let todayAttendance = 0;

  let totalStudents = 0;
  let totalTeachers = 0;
  let totalClasses = 0;
  let activeClasses = 0;

  try {
    const studentsCountSnap = await db
      .collection("users")
      .where("instituteId", "==", uid)
      .where("role", "==", "student")
      .count()
      .get();
    totalStudents = studentsCountSnap.data().count;

    const teachersCountSnap = await db
      .collection("users")
      .where("instituteId", "==", uid)
      .where("role", "==", "teacher")
      .count()
      .get();
    totalTeachers = teachersCountSnap.data().count;

    const teachersSnap = await db
      .collection("users")
      .where("instituteId", "==", uid)
      .where("role", "==", "teacher")
      .limit(50)
      .get();
    teacherDocs = teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const classesCountSnap = await db
      .collection("classes")
      .where("instituteId", "==", uid)
      .count()
      .get();
    totalClasses = classesCountSnap.data().count;

    const activeClassesSnap = await db
      .collection("classes")
      .where("instituteId", "==", uid)
      .where("status", "==", "active")
      .count()
      .get();
    activeClasses = activeClassesSnap.data().count;

    const classesSnap = await db
      .collection("classes")
      .where("instituteId", "==", uid)
      .limit(50)
      .get();
    classes = classesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const reqSnap = await db
      .collection("attendance_requests")
      .where("instituteId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    attendanceRequests = reqSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const today = new Date().toISOString().slice(0, 10);
    const presentSnap = await db
      .collection("attendance_records")
      .where("instituteId", "==", uid)
      .where("date", "==", today)
      .where("status", "==", "present")
      .count()
      .get();
    const presentCount = presentSnap.data().count;
    
    const divisor = totalStudents || 1;
    todayAttendance = Math.round((presentCount / divisor) * 1000) / 10;
  } catch (err) {
    console.error("Error fetching institute stats from Firestore:", err);
    return NextResponse.json(
      { error: "Dashboard data temporarily unavailable" },
      { status: 502 }
    );
  }

  const teachers = teacherDocs.map((t) => ({
    id: t.id,
    name: t.fullName || t.name || "Unknown",
    email: t.email || "",
    classes: t.classCount || 0,
    attendance: t.attendanceRate || "N/A",
    status: t.status || "active",
    department: t.department || "General",
  }));

  const dashboardData = {
    totalStudents,
    totalTeachers,
    totalClasses,
    todayAttendance,
    activeClasses,
    pendingRequests: attendanceRequests.filter((r) => r.status === "pending").length,
  };

  return NextResponse.json({ dashboardData, classes, teachers, attendanceRequests });
});
