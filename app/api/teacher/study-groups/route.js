import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { getUserProfile } from "@/lib/firebase-admin";

export async function GET(request) {
  try {
    const decodedToken = await requireAuth(request);
    const profile = await getUserProfile(decodedToken.uid);
    if (!profile)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const instituteId = profile.instituteId || profile.uid;
    const db = await connectDb();

    // 1. Fetch students for this teacher/institute
    // For this mock engine, we just grab some students and assign them mock scores
    // if they don't have them, or use their actual attendance/quiz scores.
    const students = await db
      .collection("users")
      .find({ role: "student", instituteId })
      .toArray();

    if (students.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // 2. Fetch recent attendance to compute risk/attendance score
    const attendanceRecords = await db
      .collection("attendance")
      .find({ instituteId })
      .sort({ date: -1 })
      .limit(500)
      .toArray();

    const attendanceMap = {};
    for (const record of attendanceRecords) {
      if (!attendanceMap[record.userId]) {
        attendanceMap[record.userId] = { present: 0, total: 0 };
      }
      attendanceMap[record.userId].total++;
      if (record.status === "present" || record.status === "late") {
        attendanceMap[record.userId].present++;
      }
    }

    // 3. AI Grouping Logic (Mock AI engine)
    // We want to pair students who excel (high score/attendance) with those who struggle,
    // balancing the groups.
    const enrichedStudents = students.map((s) => {
      const att = attendanceMap[s.uid] || { present: 1, total: 1 };
      const attendanceRate =
        att.total > 0 ? (att.present / att.total) * 100 : 100;
      // Mock an academic score between 50 and 100 based on their uid length as a deterministic randomizer
      const academicScore = 50 + ((s.uid.length * 7) % 50);

      return {
        id: s.uid,
        name: s.displayName || s.email.split("@")[0],
        email: s.email,
        attendanceRate,
        academicScore,
        avatar: s.photoURL || null,
        // Calculate a composite "strength" score
        strength: attendanceRate * 0.4 + academicScore * 0.6,
      };
    });

    // Sort by strength descending
    enrichedStudents.sort((a, b) => b.strength - a.strength);

    // Create groups of 4 using the "snake" drafting method to balance groups
    const groupCount = Math.max(1, Math.ceil(enrichedStudents.length / 4));
    const groups = Array.from({ length: groupCount }, (_, i) => ({
      id: `group-${i + 1}`,
      name: `Study Group ${String.fromCharCode(65 + i)}`,
      members: [],
      focusArea: i % 2 === 0 ? "Peer Mentorship" : "Collaborative Review",
    }));

    let forward = true;
    let groupIndex = 0;

    for (const student of enrichedStudents) {
      groups[groupIndex].members.push(student);

      if (forward) {
        groupIndex++;
        if (groupIndex >= groupCount) {
          groupIndex = groupCount - 1;
          forward = false;
        }
      } else {
        groupIndex--;
        if (groupIndex < 0) {
          groupIndex = 0;
          forward = true;
        }
      }
    }

    return NextResponse.json({
      groups,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
