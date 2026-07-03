import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs, setDoc, doc, increment } from "firebase/firestore";
import { calculateStreak, getLast30Days } from "@/utils/streakUtils";

export function useStudyStreak(studentId) {
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [heatmap, setHeatmap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      const last30 = getLast30Days();
      const startDate = last30[0];

      const q = query(
        collection(db, "student_activity_log"),
        where("studentId", "==", studentId),
        where("date", ">=", startDate)
      );

      const snap = await getDocs(q);
      const map = {};
      snap.forEach(d => { map[d.data().date] = d.data().actionsCount; });

      setHeatmap(map);
      setStreak(calculateStreak(Object.keys(map)));
      setLoading(false);
    };

    fetchData();
  }, [studentId]);

  const logActivity = async (action) => {
    if (!studentId) return;
    const today = new Date().toISOString().split("T")[0];
    const docId = `${studentId}_${today}`;
    await setDoc(doc(db, "student_activity_log", docId), {
      studentId,
      date: today,
      actionsCount: increment(1),
      lastActionAt: new Date(),
      actions: [action],
    }, { merge: true });
  };

  return { streak, heatmap, loading, logActivity };
}
