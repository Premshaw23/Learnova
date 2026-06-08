import { parseUserIntent } from "../ai-agent/intentparser.js";

describe("AI Agent Intent Parser & Tool Registry Tests", () => {
  test("should successfully parse and execute attendance threshold", async () => {
    const prompt = "Find low attendance under 75 percent";
    const responseStr = await parseUserIntent(prompt);
    const response = JSON.parse(responseStr);

    expect(response.status).toBe("success");
    expect(response.data).toBeDefined();
  });

  test("should successfully extract room ID and date details", async () => {
    const prompt = "Check room Room-302 on 2026-06-15";
    const responseStr = await parseUserIntent(prompt);
    const response = JSON.parse(responseStr);

    expect(response.status).toBe("success");
    expect(response.roomId).toBe("ROOM-302");
    expect(response.date).toBe("2026-06-15");
  });

  test("should parse list of student IDs and pass an alert message", async () => {
    const prompt =
      "Alert students STU1, STU2 with message 'Your class has moved'";
    const responseStr = await parseUserIntent(prompt);
    const response = JSON.parse(responseStr);

    expect(response.status).toBe("success");
    expect(response.notifiedCount).toBe(2);
  });
});
