import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

// Force dynamic so calendar clients always get a fresh .ics feed,
// not a stale CDN-cached copy from a previous timetable version.
export const dynamic = "force-dynamic";

const byDayMap = {
  Sunday: "SU",
  Monday: "MO",
  Tuesday: "TU",
  Wednesday: "WE",
  Thursday: "TH",
  Friday: "FR",
  Saturday: "SA",
};

const getNextWeekdayDate = (dayName, timeStr) => {
  const weekdays = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDay = weekdays[dayName];
  const now = new Date();
  const currentDay = now.getDay();

  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;

  const targetDate = new Date();
  targetDate.setDate(now.getDate() + daysToAdd);

  const [hours, minutes] = timeStr.split(":").map(Number);
  targetDate.setHours(hours || 9, minutes || 0, 0, 0);

  return targetDate;
};

// Use floating time format for local timezone support
const formatDateToICSFloating = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}`;
};

const formatDateToICSUTC = (date) => {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
};

// UUID v4 regex — prevents probing Firestore with arbitrary strings.
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request, { params }) {
  // FIX: In Next.js 15, route params is a Promise and must be awaited.
  // Without this await, `token` is always undefined, causing every request
  // to fall into the `if (!token)` guard and return 404.
  const { token } = await params;

  if (!token || !UUID_REGEX.test(token)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  initFirebaseAdmin();
  const db = getFirestore();

  const timetablesRef = db.collection("timetables");
  const q = timetablesRef.where("calendarToken", "==", token).limit(1);
  const snapshot = await q.get();

  if (snapshot.empty) {
    return new NextResponse("Calendar Feed Not Found", { status: 404 });
  }

  const data = snapshot.docs[0].data();
  const timetableData = data.timetableData || {};

  let icsString =
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Learnova//Timetable//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Learnova Timetable",
    ].join("\r\n") + "\r\n";

  const nowICS = formatDateToICSUTC(new Date());

  Object.keys(timetableData).forEach((day) => {
    const dayClasses = timetableData[day] || [];
    dayClasses.forEach((cls, idx) => {
      const [startStr, endStr] = cls.time.split("-");
      if (!startStr || !endStr) return;

      const startDate = getNextWeekdayDate(day, startStr.trim());
      const endDate = getNextWeekdayDate(day, endStr.trim());

      const startICS = formatDateToICSFloating(startDate);
      const endICS = formatDateToICSFloating(endDate);
      const byDay = byDayMap[day];

      icsString +=
        [
          "BEGIN:VEVENT",
          `UID:class-${day}-${idx}-${token}@learnova.app`,
          `DTSTAMP:${nowICS}`,
          `SUMMARY:${cls.subject || "Class"}`,
          `DESCRIPTION:Instructor: ${cls.teacher || "N/A"}\\nRoom: ${cls.room || "N/A"}`,
          `LOCATION:${cls.room || "N/A"}`,
          `DTSTART:${startICS}`,
          `DTEND:${endICS}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
          "STATUS:CONFIRMED",
          "END:VEVENT",
        ].join("\r\n") + "\r\n";
    });
  });

  icsString += "END:VCALENDAR";

  return new NextResponse(icsString, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="timetable_feed.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
