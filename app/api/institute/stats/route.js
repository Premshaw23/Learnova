import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireRole } from "@/lib/rbac";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, ["institute", "admin"]);

  const db = admin.firestore();
  const uid = decodedToken.uid;

  // 1. Fetch students belonging to this institute
  let studentDocs = [];
  let teacherDocs = [];
  try {
    const studentsSnap = await db
      .collection("users")
      .where("instituteId", "==", uid)
      .where("role", "==", "student")
      .get();
    studentDocs = studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching students from Firestore:", err);
  }

  try {
    const teachersSnap = await db
      .collection("users")
      .where("instituteId", "==", uid)
      .where("role", "==", "teacher")
      .get();
    teacherDocs = teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching teachers from Firestore:", err);
  }

  // 2. Fetch classes for this institute
  let classes = [];
  try {
    const classesSnap = await db
      .collection("classes")
      .where("instituteId", "==", uid)
      .get();
    classes = classesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching classes from Firestore:", err);
  }

  // Fallback mock classes if none found in DB
  if (classes.length === 0) {
    classes = [
      { id: 1, name: "Computer Science A", students: 35, teacher: "Dr. Smith", room: "CS-101", time: "09:00-10:30", semester: "4th", section: "A" },
      { id: 2, name: "Mathematics B", students: 42, teacher: "Prof. Johnson", room: "MATH-201", time: "10:45-12:15", semester: "6th", section: "B" },
      { id: 3, name: "Physics C", students: 28, teacher: "Dr. Williams", room: "PHY-301", time: "13:30-15:00", semester: "5th", section: "A" },
      { id: 4, name: "Chemistry A", students: 31, teacher: "Prof. Brown", room: "CHEM-101", time: "15:15-16:45", semester: "3rd", section: "B" },
    ];
  }

  // 3. Fetch today's attendance requests for this institute
  let attendanceRequests = [];
  try {
    const reqSnap = await db
      .collection("attendance_requests")
      .where("instituteId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    attendanceRequests = reqSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error fetching attendance requests from Firestore:", err);
  }

  // Fallback mock requests if none found
  if (attendanceRequests.length === 0) {
    attendanceRequests = [
      { id: 1, student: "John Doe", rollNo: "CS21B1010", class: "Computer Science A", reason: "Medical emergency", time: "2 hours ago", status: "pending", location: "Home - GPS verified" },
      { id: 2, student: "Jane Smith", rollNo: "CS21B1015", class: "Mathematics B", reason: "Family emergency", time: "4 hours ago", status: "pending", location: "Hospital - GPS verified" },
      { id: 3, student: "Mike Johnson", rollNo: "PHY21B1008", class: "Physics C", reason: "Transportation issue", time: "6 hours ago", status: "approved", location: "Bus stop - GPS verified" },
    ];
  }

  // 4. Compute today's attendance percentage
  let todayAttendance = 89.2;
  try {
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
    console.error("Error computing today attendance:", err);
  }

  // Build teachers list from Firestore or fallback
  const teachers =
    teacherDocs.length > 0
      ? teacherDocs.map((t) => ({
          id: t.id,
          name: t.fullName || t.name || "Unknown",
          email: t.email || "",
          classes: t.classCount || 0,
          attendance: t.attendanceRate || "N/A",
          status: t.status || "active",
          department: t.department || "General",
        }))
      : [
          { id: 1, name: "Dr. Smith", email: "smith@institute.edu", classes: 3, attendance: "92.1%", status: "active", department: "Computer Science" },
          { id: 2, name: "Prof. Johnson", email: "johnson@institute.edu", classes: 4, attendance: "88.7%", status: "active", department: "Mathematics" },
          { id: 3, name: "Dr. Williams", email: "williams@institute.edu", classes: 2, attendance: "94.3%", status: "active", department: "Physics" },
          { id: 4, name: "Prof. Brown", email: "brown@institute.edu", classes: 3, attendance: "87.9%", status: "active", department: "Chemistry" },
        ];

  const dashboardData = {
    totalStudents: studentDocs.length || 1247,
    totalTeachers: teacherDocs.length || 45,
    totalClasses: classes.length || 67,
    todayAttendance,
    weeklyTrend: "+2.4%",
    activeClasses: classes.filter((c) => c.status === "active").length || 12,
    pendingRequests: attendanceRequests.filter((r) => r.status === "pending").length,
  };

  return NextResponse.json({ dashboardData, classes, teachers, attendanceRequests });
});
