import { ValidationError } from "@/lib/errors";
import { parseSessionDateRange } from "./route";

describe("parseSessionDateRange", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");

  test("defaults to the previous seven days when query params are missing", () => {
    const result = parseSessionDateRange(new URLSearchParams(), now);

    expect(result).toEqual({
      startDate: "2026-05-25T00:00:00.000Z",
      endDate: "2026-06-01T00:00:00.000Z",
      daySpan: 7,
    });
  });

  test("uses a valid explicit date range", () => {
    const result = parseSessionDateRange(
      new URLSearchParams({
        startDate: "2026-05-01T00:00:00.000Z",
        endDate: "2026-05-04T12:00:00.000Z",
      }),
      now
    );

    expect(result).toEqual({
      startDate: "2026-05-01T00:00:00.000Z",
      endDate: "2026-05-04T12:00:00.000Z",
      daySpan: 4,
    });
  });

  test("rejects invalid startDate values before querying sessions", () => {
    expect(() =>
      parseSessionDateRange(
        new URLSearchParams({
          startDate: "not-a-date",
          endDate: "2026-05-04T00:00:00.000Z",
        }),
        now
      )
    ).toThrow(ValidationError);
  });

  test("rejects invalid endDate values before querying sessions", () => {
    expect(() =>
      parseSessionDateRange(
        new URLSearchParams({
          startDate: "2026-05-01T00:00:00.000Z",
          endDate: "also-bad",
        }),
        now
      )
    ).toThrow("endDate must be a valid date string");
  });

  test("rejects reversed date ranges", () => {
    expect(() =>
      parseSessionDateRange(
        new URLSearchParams({
          startDate: "2026-05-05T00:00:00.000Z",
          endDate: "2026-05-01T00:00:00.000Z",
        }),
        now
      )
    ).toThrow("startDate must be before or equal to endDate");
  });
});
