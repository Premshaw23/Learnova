import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";
import { requireAuth } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";
import { getRedis } from "@/lib/redis";

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(),
}));

describe("Course Reviews API Route Handler", () => {
  const mockDb = {
    collection: vi.fn().mockReturnThis(),
    insertOne: vi.fn().mockResolvedValue({ insertedId: "test-id" }),
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([
      { courseId: "course-123", rating: 5, comment: "Excellent course!", createdAt: new Date() },
    ]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    connectDb.mockResolvedValue(mockDb);
    getRedis.mockReturnValue(null); // Force in-memory fallback rate limiting
    requireAuth.mockResolvedValue({ uid: "user-123", email: "student@learnova.edu" });
  });

  describe("GET /api/reviews", () => {
    it("should return ValidationError if courseId query parameter is missing", async () => {
      const req = new Request("http://localhost/api/reviews");
      const res = await GET(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Missing courseId parameter");
    });

    it("should fetch and return reviews if courseId is provided", async () => {
      const req = new Request("http://localhost/api/reviews?courseId=course-123");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.reviews).toHaveLength(1);
      expect(data.data.reviews[0].comment).toBe("Excellent course!");
    });
  });

  describe("POST /api/reviews", () => {
    it("should fail validation on empty or invalid request body", async () => {
      const req = new Request("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it("should successfully save a review when payload is valid and limit is not hit", async () => {
      const uid = `user-success-${Date.now()}`;
      requireAuth.mockResolvedValue({ uid, email: "student@learnova.edu" });

      const req = new Request("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          courseId: "course-123",
          rating: 4,
          comment: "Really liked this course!",
        }),
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `192.168.1.${Math.floor(Math.random() * 1000)}`,
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.review.rating).toBe(4);
      expect(data.data.review.comment).toBe("Really liked this course!");
    });

    it("should enforce the 2 reviews per hour rate limit", async () => {
      const uid = `user-limited-${Date.now()}`;
      const uniqueIp = `192.168.2.${Math.floor(Math.random() * 1000)}`;
      requireAuth.mockResolvedValue({ uid, email: "student@learnova.edu" });

      const postReview = () =>
        new Request("http://localhost/api/reviews", {
          method: "POST",
          body: JSON.stringify({
            courseId: "course-123",
            rating: 5,
            comment: "Spam review",
          }),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": uniqueIp,
          },
        });

      // 1st request - Allowed
      const res1 = await POST(postReview());
      expect(res1.status).toBe(201);

      // 2nd request - Allowed
      const res2 = await POST(postReview());
      expect(res2.status).toBe(201);

      // 3rd request - Blocked with HTTP 429
      const res3 = await POST(postReview());
      expect(res3.status).toBe(429);
      const data3 = await res3.json();
      expect(data3.success).toBe(false);
      expect(data3.error).toContain("Too many reviews");
    });
  });
});
