import {
  DEFAULT_COMMENT_THREAD_ID,
  getCommentStorageKey,
  normalizeStoredComments,
} from "@/lib/commentStorage";

describe("commentStorage", () => {
  describe("getCommentStorageKey", () => {
    it("uses the homepage thread when notice id is missing", () => {
      expect(getCommentStorageKey()).toBe(
        `comments_${DEFAULT_COMMENT_THREAD_ID}`
      );
      expect(getCommentStorageKey("")).toBe(
        `comments_${DEFAULT_COMMENT_THREAD_ID}`
      );
      expect(getCommentStorageKey("   ")).toBe(
        `comments_${DEFAULT_COMMENT_THREAD_ID}`
      );
    });

    it("uses a stable notice-specific key when notice id is provided", () => {
      expect(getCommentStorageKey("notice-42")).toBe("comments_notice-42");
      expect(getCommentStorageKey(42)).toBe("comments_42");
    });
  });

  describe("normalizeStoredComments", () => {
    it("returns an empty list for wrong-shaped stored comments", () => {
      expect(normalizeStoredComments({ bad: true })).toEqual([]);
      expect(normalizeStoredComments("not-an-array")).toEqual([]);
      expect(normalizeStoredComments(null)).toEqual([]);
    });

    it("keeps valid comments and removes blank entries", () => {
      expect(
        normalizeStoredComments([
          {
            id: " comment-1 ",
            userName: " Ananya Rao ",
            userRole: " Teacher ",
            text: " Review the notice ",
          },
          { id: "comment-2", text: "Fallback author" },
          { id: "comment-3", text: "" },
          "bad",
        ])
      ).toEqual([
        {
          id: "comment-1",
          userName: "Ananya Rao",
          userRole: "Teacher",
          text: "Review the notice",
        },
        {
          id: "comment-2",
          userName: "Anonymous",
          userRole: "Contributor",
          text: "Fallback author",
        },
      ]);
    });

    it("creates deterministic ids for stored comments missing an id", () => {
      expect(normalizeStoredComments([{ text: "Saved comment" }])).toEqual([
        {
          id: "stored_0",
          userName: "Anonymous",
          userRole: "Contributor",
          text: "Saved comment",
        },
      ]);
    });
  });
});
