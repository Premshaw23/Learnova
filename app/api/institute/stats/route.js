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
    const today = new Date().toISOString().slice(0, 10);

    const [studentsSnap, teachersSnap, classesSnap, reqSnap, attSnap] = await Promise.all([
      db.collection("users")
        .where("instituteId", "==", uid)
        .where("role", "==", "student")
        .select("fullName", "name", "email", "status")
        .limit(10000)
        .get(),
      db.collection("users")
        .where("instituteId", "==", uid)
        .where("role", "==", "teacher")
        .select("fullName", "name", "email", "classCount", "attendanceRate", "status", "department")
        .limit(1000)
        .get(),
      db.collection("classes")
        .where("instituteId", "==", uid)
        .select("name", "status")
        .limit(1000)
        .get(),
      db.collection("attendance_requests")
        .where("instituteId", "==", uid)
        .orderBy("createdAt", "desc")
        .select("status", "createdAt", "studentEmail")
        .limit(20)
        .get(),
      db.collection("attendance_records")
        .where("instituteId", "==", uid)
        .where("date", "==", today)
        .select("status")
        .get(),
    ]);

    studentDocs = studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    teacherDocs = teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    classes = classesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    attendanceRequests = reqSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

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
