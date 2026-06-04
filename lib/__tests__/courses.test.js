import {
  filterCourses,
  getPaginatedCourses,
  getSavedCourses,
  sanitizeSavedCourseIds,
  COURSES,
} from "../courses";

describe("getPaginatedCourses pagination and filtering helper", () => {
  test("should load the first page with correct defaults", () => {
    const { courses, total, hasMore } = getPaginatedCourses({ limit: 6, page: 1 });
    expect(courses.length).toBe(6);
    expect(total).toBe(COURSES.length);
    expect(hasMore).toBe(true);
  });

  test("should load next page of courses correctly", () => {
    const { courses, total, hasMore } = getPaginatedCourses({ limit: 6, page: 2 });
    expect(courses.length).toBe(6);
    expect(total).toBe(COURSES.length);
    expect(hasMore).toBe(true);
  });

  test("should load the final page of courses correctly", () => {
    const { courses, total, hasMore } = getPaginatedCourses({ limit: 6, page: 3 });
    // Total courses is 15. Page 1 (6), Page 2 (6), Page 3 should have remaining 3 courses
    expect(courses.length).toBe(3);
    expect(total).toBe(COURSES.length);
    expect(hasMore).toBe(false);
  });

  test("should filter courses by search query accurately", () => {
    const { courses, total } = getPaginatedCourses({ q: "Next.js", limit: 6, page: 1 });
    expect(total).toBe(1);
    expect(courses[0].id).toBe("nextjs-mastery");
  });

  test("should filter courses by category accurately", () => {
    const { courses, total } = getPaginatedCourses({ category: "design", limit: 6, page: 1 });
    // Curated design courses: UI/UX (id: ui-ux-design-fundamentals), Prototyping (id: figma-prototyping-advanced), Vector (id: illustrator-vector-graphics), A11y (id: web-accessibility-wcag)
    expect(total).toBe(4);
    courses.forEach(course => {
      expect(course.category).toBe("design");
    });
  });

  test("should match categories with multiple hyphens using normalized ids", () => {
    const courses = [
      {
        id: "career-ready-web-dev",
        title: "Career Ready Web Development",
        description: "A practical web development track.",
        instructor: "Learnova Team",
        category: "career-ready-web-dev",
      },
    ];

    const { id } = filterCourses({
      courses,
      category: "careerreadywebdev",
    })[0];

    expect(id).toBe("career-ready-web-dev");
  });

  test("should return empty results gracefully for mismatched query", () => {
    const { courses, total, hasMore } = getPaginatedCourses({ q: "NonexistentCourseName", limit: 6, page: 1 });
    expect(courses.length).toBe(0);
    expect(total).toBe(0);
    expect(hasMore).toBe(false);
  });

  test("should sanitize saved course ids and remove duplicates", () => {
    const savedIds = sanitizeSavedCourseIds([
      "nextjs-mastery",
      "missing-course",
      "nextjs-mastery",
      "python-data-science",
    ]);

    expect(savedIds).toEqual(["nextjs-mastery", "python-data-science"]);
  });

  test("should return saved courses after applying active filters", () => {
    const savedCourses = getSavedCourses(
      ["nextjs-mastery", "python-data-science", "ui-ux-design-fundamentals"],
      { q: "python", category: "data-science" }
    );

    expect(savedCourses).toHaveLength(1);
    expect(savedCourses[0].id).toBe("python-data-science");
  });
});
