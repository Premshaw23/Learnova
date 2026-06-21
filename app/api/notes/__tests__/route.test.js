import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getNotes, POST as postNote } from "@/app/api/notes/route";
import { PUT as putNote, DELETE as deleteNote } from "@/app/api/notes/[id]/route";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import * as NoteModel from "@/lib/models/noteModel";

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/models/noteModel", () => ({
  createNote: vi.fn(),
  getUserNotes: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));

const createMockRequest = (method, headers, body, url = "http://localhost/api/notes") => ({
  method,
  headers: {
    get: (name) => headers[name.toLowerCase()] || null,
  },
  url,
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
});

describe("Notes API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ uid: "user-123", role: "student" });
    checkRateLimit.mockResolvedValue({ allowed: true });
  });

  describe("GET /api/notes", () => {
    it("should fetch notes successfully", async () => {
      const mockNotes = [{ _id: "note-1", text: "Test Note", timestamp: 10 }];
      NoteModel.getUserNotes.mockResolvedValue(mockNotes);

      const req = createMockRequest("GET", {}, null, "http://localhost/api/notes?courseId=nextjs-mastery");
      const res = await getNotes(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.items).toEqual(mockNotes);
      expect(NoteModel.getUserNotes).toHaveBeenCalledWith("user-123", {
        courseId: "nextjs-mastery",
        videoId: undefined,
      });
    });
  });

  describe("POST /api/notes", () => {
    it("should create a note successfully", async () => {
      const mockNote = { _id: "note-1", text: "New Note", timestamp: 120, videoId: "video-123" };
      NoteModel.createNote.mockResolvedValue(mockNote);

      const req = createMockRequest("POST", {}, {
        text: "New Note",
        timestamp: 120,
        videoId: "video-123",
        courseId: "course-123"
      });

      const res = await postNote(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.note).toEqual(mockNote);
      expect(NoteModel.createNote).toHaveBeenCalledWith({
        firebaseUid: "user-123",
        text: "New Note",
        timestamp: 120,
        videoId: "video-123",
        courseId: "course-123",
      });
    });

    it("should fail validation if text is empty", async () => {
      const req = createMockRequest("POST", {}, {
        text: "",
        timestamp: 120,
        videoId: "video-123",
      });

      const res = await postNote(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("cannot be empty");
    });

    it("should fail validation if timestamp is negative", async () => {
      const req = createMockRequest("POST", {}, {
        text: "Test Note",
        timestamp: -5,
        videoId: "video-123",
      });

      const res = await postNote(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("non-negative");
    });

    it("should fail if rate limit is exceeded", async () => {
      checkRateLimit.mockResolvedValue({ allowed: false });
      const req = createMockRequest("POST", {}, {
        text: "Test Note",
        timestamp: 10,
        videoId: "video-123",
      });

      const res = await postNote(req);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Too many requests");
    });
  });

  describe("PUT /api/notes/[id]", () => {
    it("should update a note successfully", async () => {
      const mockUpdatedNote = { _id: "note-1", text: "Updated Note", timestamp: 130 };
      NoteModel.updateNote.mockResolvedValue(mockUpdatedNote);

      const req = createMockRequest("PUT", {}, { text: "Updated Note", timestamp: 130 });
      const context = { params: Promise.resolve({ id: "note-1" }) };

      const res = await putNote(req, context);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.note).toEqual(mockUpdatedNote);
      expect(NoteModel.updateNote).toHaveBeenCalledWith("note-1", "user-123", {
        text: "Updated Note",
        timestamp: 130,
      });
    });

    it("should return 404 if note does not exist or user is unauthorized", async () => {
      NoteModel.updateNote.mockResolvedValue(null);

      const req = createMockRequest("PUT", {}, { text: "Updated Note" });
      const context = { params: Promise.resolve({ id: "note-1" }) };

      const res = await putNote(req, context);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("not found");
    });
  });

  describe("DELETE /api/notes/[id]", () => {
    it("should delete a note successfully", async () => {
      NoteModel.deleteNote.mockResolvedValue(true);

      const req = createMockRequest("DELETE", {}, null);
      const context = { params: Promise.resolve({ id: "note-1" }) };

      const res = await deleteNote(req, context);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain("successfully");
      expect(NoteModel.deleteNote).toHaveBeenCalledWith("note-1", "user-123");
    });

    it("should return 404 if note deletion fails (not found/unauthorized)", async () => {
      NoteModel.deleteNote.mockResolvedValue(false);

      const req = createMockRequest("DELETE", {}, null);
      const context = { params: Promise.resolve({ id: "note-1" }) };

      const res = await deleteNote(req, context);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("not found");
    });
  });
});
