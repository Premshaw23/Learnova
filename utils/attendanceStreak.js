function toUTCDay(date) {
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateCurrentStreak(records) {
  const safeRecords = Array.isArray(records) ? records : [];
  if (safeRecords.length === 0) return 0;

  const filtered = safeRecords.filter((r) => r.date);
  if (filtered.length === 0) return 0;

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const unique = [];
  const seen = new Set();
  for (const r of sorted) {
    const day = toUTCDay(r.date);
    if (!seen.has(day)) {
      seen.add(day);
      unique.push(r);
    }
  }

  if (unique[0].status?.toLowerCase() === "absent") return 0;

  const latestDay = toUTCDay(unique[0].date);
  const today = toUTCDay(new Date());
  const yesterday = today - MS_PER_DAY;

  if (latestDay < yesterday) return 0;

  let streak = 0;
  let expectedDay = latestDay;

  for (const r of unique) {
    const day = toUTCDay(r.date);
    if (day === expectedDay) {
      const status = r.status?.toLowerCase();
      if (status === "present" || status === "late") {
        streak++;
        expectedDay -= MS_PER_DAY;
      } else {
        break;
      }
    } else if (day < expectedDay) {
      break;
    }
  }

  return streak;
}

export function calculateLongestStreak(records) {
  const safeRecords = Array.isArray(records) ? records : [];
  if (safeRecords.length === 0) return 0;

  const filtered = safeRecords.filter((r) => r.date);
  if (filtered.length === 0) return 0;

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const unique = [];
  const seen = new Set();
  for (const r of sorted) {
    const day = toUTCDay(r.date);
    if (!seen.has(day)) {
      seen.add(day);
      unique.push({ ...r, day });
    }
  }

  if (unique.length === 0) return 0;

  unique.sort((a, b) => a.day - b.day);

  let longest = 0;
  let current = 0;
  let prevDay = null;

  for (const r of unique) {
    const status = r.status?.toLowerCase();
    const isAttended = status === "present" || status === "late";

    if (isAttended) {
      if (prevDay === null) {
        current = 1;
      } else if (r.day - prevDay === MS_PER_DAY) {
        current++;
      } else {
        current = 1;
      }
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }

    if (isAttended) {
      prevDay = r.day;
    } else {
      prevDay = null;
    }
  }

  return longest;
}

export function calculateConsistency(records) {
  const safeRecords = Array.isArray(records) ? records : [];
  if (safeRecords.length === 0) return 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthRecords = safeRecords.filter((r) => {
    if (!r.date) return false;
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  if (monthRecords.length === 0) return 0;

  const sorted = [...monthRecords].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const unique = [];
  const seen = new Set();
  for (const r of sorted) {
    const day = toUTCDay(r.date);
    if (!seen.has(day)) {
      seen.add(day);
      unique.push(r);
    }
  }

  if (unique.length === 0) return 0;

  const attended = unique.filter((r) => {
    const status = r.status?.toLowerCase();
    return status === "present" || status === "late";
  }).length;

  return Math.round((attended / unique.length) * 100);
}

export function getBadge(consistency) {
  if (consistency >= 90) return "Excellent";
  if (consistency >= 75) return "Good";
  return "Needs Improvement";
}
