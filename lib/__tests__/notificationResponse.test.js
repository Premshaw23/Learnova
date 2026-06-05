import { extractNotificationsFromResponse } from "@/lib/notificationResponse";

describe("extractNotificationsFromResponse", () => {
  test("reads notifications from the standardized API envelope", () => {
    const notifications = [
      { _id: "notice-1", message: "Attendance updated", read: false },
    ];

    expect(
      extractNotificationsFromResponse({
        success: true,
        data: { notifications },
      })
    ).toEqual(notifications);
  });

  test("keeps the legacy direct notifications fallback", () => {
    const notifications = [
      { _id: "notice-2", message: "New notice", read: true },
    ];

    expect(extractNotificationsFromResponse({ notifications })).toEqual(
      notifications
    );
  });

  test("falls back when the standardized envelope is malformed", () => {
    const notifications = [
      { _id: "notice-3", message: "Fallback notice", read: false },
    ];

    expect(
      extractNotificationsFromResponse({
        success: true,
        data: { notifications: {} },
        notifications,
      })
    ).toEqual(notifications);
  });

  test("returns an empty array for malformed responses", () => {
    expect(extractNotificationsFromResponse(null)).toEqual([]);
    expect(extractNotificationsFromResponse({ success: true })).toEqual([]);
    expect(
      extractNotificationsFromResponse({
        success: true,
        data: { notifications: null },
      })
    ).toEqual([]);
  });
});
