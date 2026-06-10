import admin from "firebase-admin";

export async function exportUserData(userId) {
  const db = admin.firestore();
  const collections = ["users", "attendance_records", "activities", "notifications"];
  const data = {};

  for (const col of collections) {
    const snap = await db.collection(col).where("userId", "==", userId).get();
    data[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return data;
}

export async function exportAttendance({
  instituteId,
  classId,
  startDate,
  endDate,
  status,
}) {
  const db = admin.firestore();
  let query = db
    .collection("attendance_records")
    .where("instituteId", "==", instituteId);

  if (classId) query = query.where("classId", "==", classId);
  if (startDate) query = query.where("date", ">=", startDate);
  if (endDate) query = query.where("date", "<=", endDate);
  if (status) query = query.where("status", "==", status);

  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function exportInstituteData(instituteId) {
  const db = admin.firestore();
  const collections = ["users", "classes", "attendance_records", "attendance_requests"];
  const data = {};

  for (const col of collections) {
    const snap = await db.collection(col).where("instituteId", "==", instituteId).get();
    data[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return data;
}

export function formatCSV(data) {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const lines = [headers.join(",")];
  for (const row of data) {
    lines.push(
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    );
  }
  return lines.join("\n");
}
