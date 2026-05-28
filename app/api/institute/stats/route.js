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

  try {
    const studentsSnap = await db
      .collection("users")
      .where("instituteId", "==", uid)
      .where("role", "==", "student")
      .get();
    studentDocs = studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const teachersSnap = await db
      .collection("users")
      .where("instituteId", "==", uid)
      .where("role", "==", "teacher")
      .get();
    teacherDocs = teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const classesSnap = await db
      .collection("classes")
      .where("instituteId", "==", uid)
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
    const attSnap = await db
      .collection("attendance_records")
      .where("instituteId", "==", uid)
      .where("date", "==", today)
      .get();
    const presentCount = attSnap.docs.filter((d) => (d.data().status ?? "present") === "present").length;
    const totalStudents = studentDocs.length || 1;
    todayAttendance = Math.round((presentCount / totalStudents) * 1000) / 10;
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
    totalStudents: studentDocs.length,
    totalTeachers: teacherDocs.length,
    totalClasses: classes.length,
    todayAttendance,
    activeClasses: classes.filter((c) => c.status === "active").length,
    pendingRequests: attendanceRequests.filter((r) => r.status === "pending").length,
  };

  return NextResponse.json({ dashboardData, classes, teachers, attendanceRequests });
});
