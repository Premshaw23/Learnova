import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getICalFeed } from "@/app/api/timetable/ical/[token]/feed.ics/route";

vi.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: vi.fn(),
}));

let mockData = null;

vi.mock("firebase-admin/firestore", () => {
  const getMock = vi.fn(() => {
    if (!mockData) {
      return Promise.resolve({ empty: true, docs: [] });
    } else {
      return Promise.resolve({ 
        empty: false, 
        docs: [{ data: () => mockData }] 
      });
    }
  });
  
  return {
    getFirestore: vi.fn(() => ({
      collection: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: getMock
          }))
        }))
      }))
    }))
  };
});

describe("Timetable iCal Feed API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = null;
  });

  const setMockData = (data) => {
    mockData = data;
  };

  it("should return 404 for missing token", async () => {
    const response = await getICalFeed({}, { params: {} });
    expect(response.status).toBe(404);
  });

  it("should return 404 for invalid token", async () => {
    setMockData(null);
    const response = await getICalFeed({}, { params: { token: "invalid" } });
    expect(response.status).toBe(404);
  });

  it("should return valid ics feed when token is valid", async () => {
    setMockData({
      calendarToken: "valid-token",
      timetableData: {
        Monday: [
          { time: "09:00-10:30", subject: "Math", teacher: "Mr. Smith", room: "101" }
        ]
      }
    });

    const response = await getICalFeed({}, { params: { token: "valid-token" } });
    
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/calendar");
    
    const text = await response.text();
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(text).toContain("VERSION:2.0");
    expect(text).toContain("BEGIN:VEVENT");
    expect(text).toContain("SUMMARY:Math");
    expect(text).toContain("LOCATION:101");
    expect(text).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO");
    expect(text).toContain("END:VCALENDAR");
  });
});
