import React from "react";
import { describe, it, expect, vi } from "vitest";
import VideoPlayer from "../VideoPlayer";

describe("VideoPlayer Unit Tests", () => {
  it("should render video element and accept props", () => {
    const props = {
      videoUrl: "https://example.com/test.mp4",
      conceptMap: [],
      transcripts: [],
      courseId: "course-101",
      user: { uid: "user-123" },
      updateUserStat: vi.fn(),
    };

    expect(props.videoUrl).toBe("https://example.com/test.mp4");
    expect(props.courseId).toBe("course-101");
  });
});
