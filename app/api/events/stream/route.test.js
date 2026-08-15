import { describe, test, expect, vi } from "vitest";
import {
  createChannelCursor,
  collectChannelEvents,
  SSE_CHANNELS,
} from "./route";

describe("events/stream per-channel cursor", () => {
  test("createChannelCursor initializes all channels to zero", () => {
    const cursor = createChannelCursor();
    expect(cursor).toEqual({ notifications: 0, attendance: 0, polls: 0 });
  });

  test("each channel tracks its own sequence independently", async () => {
    const cursor = createChannelCursor();
    const emitted = [];

    // Simulate heavy notification traffic (sequences 1..5 on notifications)
    // and low traffic on attendance (sequences 1..2) and polls (sequence 1).
    const pollEventsFn = vi.fn().mockImplementation(async (channel, since) => {
      if (channel === "notifications") {
        return [1, 2, 3, 4, 5]
          .filter((s) => s > since)
          .map((s) => ({ _sequence: s, payload: { n: s } }));
      }
      if (channel === "attendance") {
        return [1, 2]
          .filter((s) => s > since)
          .map((s) => ({ _sequence: s, payload: { a: s } }));
      }
      return [1]
        .filter((s) => s > since)
        .map((s) => ({ _sequence: s, payload: { p: s } }));
    });

    for (const channel of SSE_CHANNELS) {
      await collectChannelEvents({
        channel,
        lastSequence: cursor,
        pollEventsFn,
        onEvent: (ch, doc) => emitted.push({ channel: ch, seq: doc._sequence }),
      });
    }

    // The notifications channel advancing to 5 must NOT suppress the
    // attendance (1..2) or polls (1) events, which use separate sequences.
    expect(cursor).toEqual({ notifications: 5, attendance: 2, polls: 1 });
    expect(emitted).toEqual([
      { channel: "notifications", seq: 1 },
      { channel: "notifications", seq: 2 },
      { channel: "notifications", seq: 3 },
      { channel: "notifications", seq: 4 },
      { channel: "notifications", seq: 5 },
      { channel: "attendance", seq: 1 },
      { channel: "attendance", seq: 2 },
      { channel: "polls", seq: 1 },
    ]);
  });

  test("second poll only delivers events after the per-channel cursor", async () => {
    const cursor = createChannelCursor();
    const pollEventsFn = vi.fn().mockImplementation(async (channel, since) => {
      const seqs =
        channel === "notifications"
          ? [1, 2, 3]
          : channel === "attendance"
            ? [1]
            : [];
      return seqs
        .filter((s) => s > since)
        .map((s) => ({ _sequence: s, payload: { v: s } }));
    });

    const firstPass = [];
    for (const channel of SSE_CHANNELS) {
      await collectChannelEvents({
        channel,
        lastSequence: cursor,
        pollEventsFn,
        onEvent: (ch, doc) => firstPass.push(doc._sequence),
      });
    }
    expect(firstPass).toEqual([1, 2, 3, 1]);
    expect(cursor).toEqual({ notifications: 3, attendance: 1, polls: 0 });

    const secondPass = [];
    for (const channel of SSE_CHANNELS) {
      await collectChannelEvents({
        channel,
        lastSequence: cursor,
        pollEventsFn,
        onEvent: (ch, doc) => secondPass.push(doc._sequence),
      });
    }
    expect(secondPass).toEqual([]);
  });
});
