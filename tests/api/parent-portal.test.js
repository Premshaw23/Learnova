import { describe, it, expect, vi, beforeEach } from "vitest";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";
import { assertApiError } from "@/testUtils/assertApiError";

// 1. Mock api-response
vi.mock("@/lib/api-response", () => ({
  jsonError: vi.fn((msg, status = 500) => ({
    status,
    json: async () => ({ error: msg, success: false }),
  })),
  jsonSuccess: vi.fn((data, status = 200) => ({
    status,
    json: async () => ({ data, success: true }),
  })),
}));

// 2. Mock error-handler
vi.mock("@/lib/error-handler", () => {
  return {
    withErrorHandler: (handler) => {
      return async (request, ...args) => {
        try {
          return await handler(request, ...args);
        } catch (error) {
          if (error && error.statusCode !== undefined) {
            const payload =
              error.originalMessage !== undefined
                ? error.originalMessage
                : error.message;
            return {
              status: error.statusCode,
              json: async () => ({ error: payload, success: false }),
            };
          }
          return {
            status: 500,
            json: async () => ({
              error: error.message || "Internal server error",
              success: false,
            }),
          };
        }
      };
    },
    authenticateRequest: vi.fn(),
    parseJSON: vi.fn(),
  };
});

// 3. Mock firebase-admin
vi.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: vi.fn(),
  getUserProfile: vi.fn(),
}));

// 4. Mock firestore
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
}));

// 5. Mock mongodb
vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

// 6. Mock rateLimit
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}));

// 7. Mock transactionCoordinator
vi.mock("@/lib/transactionCoordinator", () => ({
  executeSaga: vi.fn(async ({ steps }) => {
    const context = {};
    for (const step of steps) {
      await step.execute(context);
    }
    return { success: true, context };
  }),
  findExistingOperation: vi.fn().mockResolvedValue(null),
  markIdempotent: vi.fn(),
}));

// Import authenticators/parsers so we can mock their outputs per-test
import { authenticateRequest, parseJSON } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { connectDb } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";
import { executeSaga } from "@/lib/transactionCoordinator";

// Import route handlers
import {
  GET as adminGetLink,
  POST as adminPostLink,
  DELETE as adminDeleteLink,
} from "@/app/api/admin/parent-student-link/route";
import { GET as parentGetDashboard } from "@/app/api/parent/dashboard/route";
import { GET as parentGetAttendance } from "@/app/api/parent/student/[studentId]/attendance/route";
import {
  GET as parentGetGrades,
  POST as parentPostGrade,
} from "@/app/api/parent/student/[studentId]/grades/route";
import { GET as parentGetNotices } from "@/app/api/parent/student/[studentId]/notices/route";

function makeRequest(overrides = {}) {
  const headersMap = new Map(
    Object.entries({ "x-forwarded-for": "127.0.0.1", ...overrides.headers })
  );
  return {
    headers: {
      get: vi.fn((key) => headersMap.get(key.toLowerCase()) || null),
    },
    url: overrides.url || "http://localhost/api/test",
    ...overrides,
  };
}

describe("Parent Portal Feature Tests", () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true });

    store = {
      users: {
        "parent-1": {
          uid: "parent-1",
          email: "parent1@learnova.edu",
          role: "parent",
          fullName: "Parent One",
        },
        "student-1": {
          uid: "student-1",
          email: "student1@learnova.edu",
          role: "student",
          fullName: "Student One",
          instituteId: "inst-1",
          studentId: "S001",
        },
        "student-2": {
          uid: "student-2",
          email: "student2@learnova.edu",
          role: "student",
          fullName: "Student Two",
          instituteId: "inst-1",
          studentId: "S002",
        },
        "teacher-1": {
          uid: "teacher-1",
          email: "teacher1@learnova.edu",
          role: "teacher",
          fullName: "Teacher One",
          instituteId: "inst-1",
        },
      },
      parent_student_links: {
        "parent-1_student-1": {
          parentId: "parent-1",
          studentId: "student-1",
          createdAt: new Date().toISOString(),
        },
      },
      grades: {},
      notices: {
        "notice-1": {
          instituteId: "inst-1",
          targetAudience: ["student", "parent"],
          title: "Important Notice",
          createdAt: new Date(),
        },
      },
      userStats: {
        "student-1": { "Attendance Rate": "85%" },
        "student-2": { "Attendance Rate": "60%" }, // Low attendance
      },
      notifications: {},
      attendance_records: {
        "att-1": {
          userId: "student-1",
          date: "2026-05-28",
          status: "present",
          confidenceScore: 0.95,
        },
        "att-2": {
          userId: "student-1",
          date: "2026-05-27",
          status: "absent",
          confidenceScore: 0.9,
        },
      },
    };

    getFirestore.mockReturnValue({
      getAll: vi.fn((...refs) => {
        const colData = store["users"] || {};
        return refs.map((ref) => {
          const docVal = colData[ref.id || ref._docId];
          return {
            exists: docVal !== undefined,
            id: ref.id || ref._docId,
            data: () => docVal || {},
          };
        });
      }),
      collection: vi.fn((colName) => {
        const colData = store[colName] || {};
        return {
          get: vi.fn(async () => {
            const docs = Object.entries(colData).map(([id, val]) => ({
              id,
              exists: true,
              data: () => val,
            }));
            return {
              empty: docs.length === 0,
              docs,
            };
          }),
          doc: vi.fn((docId) => {
            const docVal = colData[docId];
            return {
              id: docId,
              get: vi.fn(async () => ({
                id: docId,
                exists: docVal !== undefined,
                data: () => docVal,
              })),
              set: vi.fn(async (newVal) => {
                colData[docId] = newVal;
                store[colName] = colData;
              }),
              delete: vi.fn(async () => {
                delete colData[docId];
                store[colName] = colData;
              }),
            };
          }),
          where: vi.fn((field, op, val) => {
            let filtered = Object.entries(colData).filter(([_, item]) => {
              if (op === "==") {
                return item[field] === val;
              }
              if (op === "array-contains-any") {
                const itemArr = item[field] || [];
                return (
                  Array.isArray(itemArr) && val.some((v) => itemArr.includes(v))
                );
              }
              if (op === ">=") {
                return item[field] >= val;
              }
              return false;
            });

            const query = {
              get: vi.fn(async () => {
                const docs = filtered.map(([id, data]) => ({
                  id,
                  exists: true,
                  data: () => {
                    const rawData = { ...data };
                    if (rawData.createdAt instanceof Date) {
                      rawData.createdAt = {
                        toDate: () => rawData.createdAt,
                      };
                    }
                    return rawData;
                  },
                }));
                return {
                  empty: docs.length === 0,
                  docs,
                };
              }),
              limit: vi.fn(() => query),
              orderBy: vi.fn(() => query),
              where: vi.fn((f2, o2, v2) => {
                filtered = filtered.filter(([_, item]) => {
                  if (o2 === "==") {
                    return item[f2] === v2;
                  }
                  if (o2 === "array-contains-any") {
                    const itemArr = item[f2] || [];
                    return (
                      Array.isArray(itemArr) &&
                      v2.some((v) => itemArr.includes(v))
                    );
                  }
                  if (o2 === ">=") {
                    return item[f2] >= v2;
                  }
                  return false;
                });
                return query;
              }),
            };
            return query;
          }),
          add: vi.fn(async (newVal) => {
            const newId = `rand_${Math.random().toString(36).substring(7)}`;
            colData[newId] = newVal;
            store[colName] = colData;
            return { id: newId };
          }),
        };
      }),
      getAll: vi.fn(async (...refs) => {
        const results = [];
        for (const ref of refs) {
          const snapshot = await ref.get();
          results.push(snapshot);
        }
        return results;
      }),
    });

    const mockMongoCollection = {
      updateOne: vi.fn(),
      deleteOne: vi.fn(),
    };
    connectDb.mockResolvedValue({
      collection: vi.fn(() => mockMongoCollection),
    });
  });

  describe("Security & Authorization Checks", () => {
    it("should reject non-admin users from accessing parent-student link routes", async () => {
      authenticateRequest.mockResolvedValue({
        uid: "parent-1",
        email_verified: true,
        role: "parent",
      });
      getUserProfile.mockResolvedValue(store.users["parent-1"]);

      const response = await adminGetLink(makeRequest());
      await assertApiError(response, 403, "Forbidden: Requires one of admin");
    });

    it("should reject non-parent users from accessing parent dashboard", async () => {
      authenticateRequest.mockResolvedValue({
        uid: "student-1",
        email_verified: true,
        role: "student",
      });
      getUserProfile.mockResolvedValue(store.users["student-1"]);

      const response = await parentGetDashboard(makeRequest());
      await assertApiError(response, 403, "Forbidden: Requires one of parent");
    });

    it("should reject non-parent users from accessing child details routes", async () => {
      authenticateRequest.mockResolvedValue({
        uid: "student-1",
        email_verified: true,
        role: "student",
      });
      getUserProfile.mockResolvedValue(store.users["student-1"]);

      const response = await parentGetAttendance(makeRequest(), {
        params: { studentId: "student-1" },
      });
      await assertApiError(response, 403, "Forbidden: Requires one of parent");
    });
  });

  describe("Admin parent-student link endpoints", () => {
    beforeEach(() => {
      authenticateRequest.mockResolvedValue({
        uid: "admin-1",
        email_verified: true,
        role: "admin",
      });
      getUserProfile.mockResolvedValue({ uid: "admin-1", role: "admin" });
    });

    it("GET /api/admin/parent-student-link: should return all links resolved with user info", async () => {
      const response = await adminGetLink(makeRequest());
      const body = await assertApiSuccess(response, 200);

      expect(body.data.links).toHaveLength(1);
      expect(body.data.links[0]).toEqual(
        expect.objectContaining({
          id: "parent-1_student-1",
          parentId: "parent-1",
          studentId: "student-1",
          parentName: "Parent One",
          parentEmail: "parent1@learnova.edu",
          studentName: "Student One",
          studentEmail: "student1@learnova.edu",
        })
      );
    });

    it("POST /api/admin/parent-student-link: should successfully create a link when both emails exist and roles are valid", async () => {
      parseJSON.mockResolvedValue({
        parentEmail: "parent1@learnova.edu",
        studentEmail: "student2@learnova.edu",
      });

      const response = await adminPostLink(makeRequest());
      const body = await assertApiSuccess(response, 201);

      expect(body.data.success).toBe(true);
      expect(body.data.link.id).toBe("parent-1_student-2");
      expect(store.parent_student_links["parent-1_student-2"]).toBeDefined();
    });

    it("POST /api/admin/parent-student-link: should return 400 if required parameters are missing", async () => {
      parseJSON.mockResolvedValue({
        parentEmail: "parent1@learnova.edu",
      });

      const response = await adminPostLink(makeRequest());
      await assertApiError(
        response,
        400,
        "Validation failed"
      );
    });

    it("POST /api/admin/parent-student-link: should return 404 if parent user email does not exist", async () => {
      parseJSON.mockResolvedValue({
        parentEmail: "nonexistent_parent@learnova.edu",
        studentEmail: "student2@learnova.edu",
      });

      const response = await adminPostLink(makeRequest());
      await assertApiError(
        response,
        404,
        'Parent with email "nonexistent_parent@learnova.edu" not found'
      );
    });

    it("POST /api/admin/parent-student-link: should return 400 if the emails resolve to the wrong roles", async () => {
      // Swapping parent and student roles
      parseJSON.mockResolvedValue({
        parentEmail: "student1@learnova.edu", // actually a student role
        studentEmail: "parent1@learnova.edu", // actually a parent role
      });

      const response = await adminPostLink(makeRequest());
      await assertApiError(
        response,
        400,
        'User "student1@learnova.edu" is registered as "student", not "parent"'
      );
    });

    it("POST /api/admin/parent-student-link: should return 400 if link already exists", async () => {
      parseJSON.mockResolvedValue({
        parentEmail: "parent1@learnova.edu",
        studentEmail: "student1@learnova.edu",
      });

      const response = await adminPostLink(makeRequest());
      await assertApiError(
        response,
        400,
        "This relationship is already linked"
      );
    });

    it("DELETE /api/admin/parent-student-link: should delete successfully", async () => {
      const request = makeRequest({
        url: "http://localhost/api/admin/parent-student-link?parentId=parent-1&studentId=student-1",
      });

      const response = await adminDeleteLink(request);
      const body = await assertApiSuccess(response, 200);

      expect(body.data.success).toBe(true);
      expect(store.parent_student_links["parent-1_student-1"]).toBeUndefined();
    });

    it("DELETE /api/admin/parent-student-link: should return 400 if query params are missing", async () => {
      const request = makeRequest({
        url: "http://localhost/api/admin/parent-student-link?parentId=parent-1",
      });

      const response = await adminDeleteLink(request);
      await assertApiError(
        response,
        400,
        "Validation failed"
      );
    });

    it("POST /api/admin/parent-student-link: should return 500 if the saga coordinator fails to sync the link", async () => {
      parseJSON.mockResolvedValue({
        parentEmail: "parent1@learnova.edu",
        studentEmail: "student2@learnova.edu",
      });
      executeSaga.mockResolvedValueOnce({
        success: false,
        error: "MongoDB database connection timed out",
      });

      const response = await adminPostLink(makeRequest());
      await assertApiError(
        response,
        500,
        "Failed to sync parent-student link: MongoDB database connection timed out"
      );
    });

    it("DELETE /api/admin/parent-student-link: should return 500 if the saga coordinator fails to delete the link", async () => {
      executeSaga.mockResolvedValueOnce({
        success: false,
        error: "Failed to connect to MongoDB instance",
      });

      const request = makeRequest({
        url: "http://localhost/api/admin/parent-student-link?parentId=parent-1&studentId=student-1",
      });

      const response = await adminDeleteLink(request);
      await assertApiError(
        response,
        500,
        "Failed to delete parent-student link: Failed to connect to MongoDB instance"
      );
    });
  });

  describe("Parent dashboard and self-healing low attendance alert check", () => {
    beforeEach(() => {
      authenticateRequest.mockResolvedValue({
        uid: "parent-1",
        email_verified: true,
        role: "parent",
      });
      getUserProfile.mockResolvedValue(store.users["parent-1"]);
    });

    it("GET /api/parent/dashboard: should return linked students profiles and their summaries", async () => {
      const response = await parentGetDashboard(makeRequest());
      const body = await assertApiSuccess(response, 200);

      expect(body.data.students).toHaveLength(1);
      expect(body.data.students[0].uid).toBe("student-1");
      expect(body.data.students[0].attendanceRate).toBe("85%");
    });

    it("GET /api/parent/dashboard: should trigger low-attendance notification if a child has < 75% attendance", async () => {
      // Link student-2 (who has 60% attendance) to parent-1
      store.parent_student_links["parent-1_student-2"] = {
        parentId: "parent-1",
        studentId: "student-2",
        createdAt: new Date().toISOString(),
      };

      const response = await parentGetDashboard(makeRequest());
      const body = await assertApiSuccess(response, 200);

      expect(body.data.students).toHaveLength(2);

      // Verify that notification was created in the mock store
      const notifications = Object.values(store.notifications);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].recipientId).toBe("parent-1");
      expect(notifications[0].studentId).toBe("student-2");
      expect(notifications[0].type).toBe("low_attendance");
      expect(notifications[0].message).toContain("dropped to 60%");
    });

    it("GET /api/parent/dashboard: should not duplicate low-attendance notification if one already exists in last 24h", async () => {
      store.parent_student_links["parent-1_student-2"] = {
        parentId: "parent-1",
        studentId: "student-2",
        createdAt: new Date().toISOString(),
      };

      // Seed a recent alert in notifications store
      store.notifications["exist-alert-id"] = {
        recipientId: "parent-1",
        studentId: "student-2",
        type: "low_attendance",
        createdAt: new Date().toISOString(),
        message: "Alert: Student Two's attendance is low.",
        read: false,
      };

      const response = await parentGetDashboard(makeRequest());
      await assertApiSuccess(response, 200);

      // Verify that no new notification was added
      const notifications = Object.values(store.notifications);
      expect(notifications).toHaveLength(1); // Still just the one we seeded
    });
  });

  describe("Security & boundaries: parent cannot fetch unlinked student details", () => {
    beforeEach(() => {
      authenticateRequest.mockResolvedValue({
        uid: "parent-1",
        email_verified: true,
        role: "parent",
      });
      getUserProfile.mockResolvedValue(store.users["parent-1"]);
    });

    it("GET /api/parent/student/[studentId]/attendance: should block unauthorized student access", async () => {
      // student-2 is not linked to parent-1
      const response = await parentGetAttendance(makeRequest(), {
        params: { studentId: "student-2" },
      });
      await assertApiError(
        response,
        403,
        "Access Denied: You are not authorized to view this student's records."
      );
    });

    it("GET /api/parent/student/[studentId]/grades: should block unauthorized student access", async () => {
      const response = await parentGetGrades(makeRequest(), {
        params: { studentId: "student-2" },
      });
      await assertApiError(
        response,
        403,
        "Access Denied: You are not authorized to view this student's records."
      );
    });

    it("GET /api/parent/student/[studentId]/notices: should block unauthorized student access", async () => {
      const response = await parentGetNotices(makeRequest(), {
        params: { studentId: "student-2" },
      });
      await assertApiError(
        response,
        403,
        "Access Denied: You are not authorized to view this student's records."
      );
    });
  });

  describe("Student detail routes for authorized parents", () => {
    beforeEach(() => {
      authenticateRequest.mockResolvedValue({
        uid: "parent-1",
        email_verified: true,
        role: "parent",
      });
      getUserProfile.mockResolvedValue(store.users["parent-1"]);
    });

    it("GET /api/parent/student/[studentId]/attendance: should return correct attendance stats and records", async () => {
      const response = await parentGetAttendance(makeRequest(), {
        params: { studentId: "student-1" },
      });
      const body = await assertApiSuccess(response, 200);

      expect(body.data.stats.total).toBe(2);
      expect(body.data.stats.present).toBe(1);
      expect(body.data.stats.absent).toBe(1);
      expect(body.data.stats.attendancePercentage).toBe(50);
      expect(body.data.records).toHaveLength(2);
    });

    it("GET /api/parent/student/[studentId]/grades: should self-seed sample grades if student grades are empty", async () => {
      expect(Object.keys(store.grades)).toHaveLength(0);

      const response = await parentGetGrades(makeRequest(), {
        params: { studentId: "student-1" },
      });
      const body = await assertApiSuccess(response, 200);

      // Verify that sample grades are returned without persisting to the database
      expect(body.data.grades).toHaveLength(5);
      expect(Object.keys(store.grades)).toHaveLength(0);
      expect(body.data.grades[0].subject).toBe("Chemistry");
    });

    it("GET /api/parent/student/[studentId]/grades: should return existing grades and not self-seed if present", async () => {
      store.grades["grade-math"] = {
        studentId: "student-1",
        subject: "Maths",
        score: 95,
        maxScore: 100,
        grade: "A+",
        term: "Finals",
        date: "2026-05-15",
      };

      const response = await parentGetGrades(makeRequest(), {
        params: { studentId: "student-1" },
      });
      const body = await assertApiSuccess(response, 200);

      expect(body.data.grades).toHaveLength(1);
      expect(body.data.grades[0].subject).toBe("Maths");
    });

    it("GET /api/parent/student/[studentId]/notices: should return notices for the student's institute", async () => {
      const response = await parentGetNotices(makeRequest(), {
        params: { studentId: "student-1" },
      });
      const body = await assertApiSuccess(response, 200);

      expect(body.data.notices).toHaveLength(1);
      expect(body.data.notices[0].title).toBe("Important Notice");
    });
  });

  describe("Grade posting and parent notification", () => {
    it("POST /api/parent/student/[studentId]/grades: should allow teachers/admins to add grades and send notifications to linked parents", async () => {
      authenticateRequest.mockResolvedValue({
        uid: "teacher-1",
        email_verified: true,
        role: "teacher",
      });
      getUserProfile.mockImplementation(async (uid) => store.users[uid]);

      parseJSON.mockResolvedValue({
        studentId: "student-1",
        subject: "History",
        grade: "A",
        score: 91,
        maxScore: 100,
        term: "Midterm",
      });

      const response = await parentPostGrade(makeRequest());
      const body = await assertApiSuccess(response, 201);

      expect(body.data.success).toBe(true);
      expect(body.data.grade.subject).toBe("History");

      // Verify that notification was created for parent-1 (linked to student-1)
      const notifications = Object.values(store.notifications);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].recipientId).toBe("parent-1");
      expect(notifications[0].type).toBe("grade_update");
      expect(notifications[0].message).toContain(
        "A new grade (A in History) has been posted"
      );
    });
  });
});
