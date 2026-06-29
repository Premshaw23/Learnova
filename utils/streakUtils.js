export function calculateStreak(activeDates) {
  const sorted = [...new Set(activeDates)].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (!sorted.includes(today) && !sorted.includes(yesterday)) {
    return { current: 0, best: getLongestStreak(sorted) };
  }

  let current = 0;
  let checkDate = sorted.includes(today) ? today : yesterday;

  for (const date of sorted) {
    if (date === checkDate) {
      current++;
      const prev = new Date(new Date(checkDate) - 86400000);
      checkDate = prev.toISOString().split("T")[0];
    } else break;
  }

  return { current, best: getLongestStreak(sorted) };
}

function getLongestStreak(sortedDates) {
  let best = 0, current = 0, prev = null;
  for (const date of [...sortedDates].reverse()) {
    if (!prev) { current = 1; }
    else {
      const diff = (new Date(date) - new Date(prev)) / 86400000;
      current = diff === 1 ? current + 1 : 1;
    }
    best = Math.max(best, current);
    prev = date;
  }
  return best;
}

export function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000);
    return d.toISOString().split("T")[0];
  }).reverse();
}
