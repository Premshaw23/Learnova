import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Shared Firestore mock state — must be hoisted so vi.mock factories can see it
// ---------------------------------------------------------------------------
const { getMock, setMockData } = vi.hoisted(() => {
  let _mockData = null;

  const getMock = vi.fn(() =>
    _mockData
      ? Promise.resolve({ empty: false, docs: [{ data: () => _mockData }] })
      : Promise.resolve({ empty: true, docs: [] })
  );

  const setMockData = (data) => {
    _mockData = data;
    getMock.mockImplementation(() =>
      data
        ? Promise.resolve({ empty: false, docs: [{ data: () => data }] })
        : Promise.resolve({ empty: true, docs: [] })
    );
  };

  return { getMock, setMockData };
});

vi.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({ get: getMock })),
      })),
    })),
  })),
}));

// next/server is not available in jsdom — mock NextResponse
vi.mock("next/server", () => {
  class MockHeaders {
    constructor(init = {}) {
      this._map = new Map();
      Object.entries(init).forEach(([k, v]) =>
        this._map.set(k.toLowerCase(), v)
      );
    }
    get(name) {
      return this._map.get(name.toLowerCase()) ?? null;
    }
    set(name, value) {
      this._map.set(name.toLowerCase(), value);
    }
  }

  return {
    NextResponse: class NextResponse {
      constructor(body, init = {}) {
        this._body = body;
        this.status = init.status || 200;
        this.headers = new MockHeaders(init.headers || {});
      }
      async text() {
        return this._body;
      }
      async json() {
        return JSON.parse(this._body);
      }
    },
  };
});

const { GET: getICalFeed } =
  await import("@/app/api/timetable/ical/[token]/feed.ics/route");

// Helper: wraps token in a resolved Promise to match Next.js 15 async params
const makeParams = (token) => ({ params: Promise.resolve({ token }) });

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Timetable iCal Feed API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockData(null);
  });

  // ── Auth / guard cases ────────────────────────────────────────────────────

  it("returns 404 when token param is absent", async () => {
    const response = await getICalFeed({}, { params: Promise.resolve({}) });
    expect(response.status).toBe(404);
  });

  it("returns 404 for a non-UUID token (prevents Firestore enumeration)", async () => {
    // Firestore should NOT be called for invalid token shapes
    const response = await getICalFeed({}, makeParams("not-a-uuid"));
    expect(response.status).toBe(404);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a UUID v1 token (only v4 is accepted)", async () => {
    const uuidV1 = "a3c5e7b0-1c2d-11ee-be56-0242ac120002";
    const response = await getICalFeed({}, makeParams(uuidV1));
    expect(response.status).toBe(404);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("returns 404 when a valid UUID token has no matching timetable in Firestore", async () => {
    setMockData(null); // empty snapshot
    const response = await getICalFeed({}, makeParams(VALID_UUID));
    expect(response.status).toBe(404);
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it("returns 200 with valid .ics content for a known token", async () => {
    setMockData({
      calendarToken: VALID_UUID,
      timetableData: {
        Monday: [
          {
            time: "09:00-10:30",
            subject: "Math",
            teacher: "Mr. Smith",
            room: "101",
          },
        ],
      },
    });

    const response = await getICalFeed({}, makeParams(VALID_UUID));

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

  it("returns Cache-Control: no-cache so calendar apps always get a fresh feed", async () => {
    setMockData({ calendarToken: VALID_UUID, timetableData: {} });
    const response = await getICalFeed({}, makeParams(VALID_UUID));
    expect(response.headers.get("cache-control")).toContain("no-cache");
  });

  it("handles timetableData with multiple days correctly", async () => {
    setMockData({
      calendarToken: VALID_UUID,
      timetableData: {
        Monday: [
          { time: "09:00-10:00", subject: "Maths", teacher: "T1", room: "A1" },
        ],
        Wednesday: [
          {
            time: "11:00-12:00",
            subject: "Physics",
            teacher: "T2",
            room: "B2",
          },
        ],
      },
    });

    const response = await getICalFeed({}, makeParams(VALID_UUID));
    const text = await response.text();

    expect(text).toContain("BYDAY=MO");
    expect(text).toContain("BYDAY=WE");
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
});
