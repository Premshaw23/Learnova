export const DEFAULT_COMMENT_THREAD_ID = "homepage";

export const getCommentStorageKey = (noticeId) => {
  const normalizedThreadId = String(noticeId ?? "").trim();

  return `comments_${normalizedThreadId || DEFAULT_COMMENT_THREAD_ID}`;
};

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const normalizeStoredComments = (comments) => {
  if (!Array.isArray(comments)) {
    return [];
  }

  return comments
    .map((comment, index) => {
      if (!isRecord(comment)) {
        return null;
      }

      const text = typeof comment.text === "string" ? comment.text.trim() : "";
      if (!text) {
        return null;
      }

      const id = typeof comment.id === "string" ? comment.id.trim() : "";
      const userName =
        typeof comment.userName === "string" ? comment.userName.trim() : "";
      const userRole =
        typeof comment.userRole === "string" ? comment.userRole.trim() : "";

      return {
        id: id || `stored_${index}`,
        userName: userName || "Anonymous",
        userRole: userRole || "Contributor",
        text,
      };
    })
    .filter(Boolean);
};
