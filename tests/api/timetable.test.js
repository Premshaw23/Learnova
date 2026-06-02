import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so the shared state is available inside vi.mock factories
const { getMock, setMockData } = vi.hoisted(() => {
  let _mockData = null;

  const getMock = vi.fn(() => {
    if (!_mockData) {
      return Promise.resolve({ empty: true, docs: [] });
    }
    return Promise.resolve({
      empty: false,
      docs: [{ data: () => _mockData }],
    });
  });

  const setMockData = (data) => {
    _mockData = data;
    // Re-configure getMock with current data
    getMock.mockImplementation(() => {
      if (!data) {
        return Promise.resolve({ empty: true, docs: [] });
      }
      return Promise.resolve({
        empty: false,
        docs: [{ data: () => data }],
      });
    });
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
        limit: vi.fn(() => ({
          get: getMock,
        })),
      })),
    })),
  })),
}));

// next/server is not available in jsdom - mock NextResponse
vi.mock("next/server", () => {
  class MockHeaders {
    constructor(init = {}) {
      this._map = new Map();
      Object.entries(init).forEach(([k, v]) => this._map.set(k.toLowerCase(), v));
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


const { GET: getICalFeed } = await import(
  "@/app/api/timetable/ical/[token]/feed.ics/route"
);

describe("Timetable iCal Feed API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockData(null);
  });

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
          { time: "09:00-10:30", subject: "Math", teacher: "Mr. Smith", room: "101" },
        ],
      },
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
