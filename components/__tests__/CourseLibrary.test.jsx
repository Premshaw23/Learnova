import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import CourseLibrary from "@/components/courses/CourseLibrary";
import { COURSES, SAVED_COURSES_STORAGE_KEY } from "@/lib/courses";
import toast from "react-hot-toast";

vi.mock("next/link", async () => {
  const React = await vi.importActual("react");

  return {
    default: ({ href, children, ...props }) =>
      React.createElement("a", { href, ...props }, children),
  };
});

vi.mock("framer-motion", async () => {
  const React = await vi.importActual("react");

  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) =>
        React.createElement("div", { ref, ...props }, children)
      ),
    },
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const renderCourseLibrary = (props = {}) =>
  render(
    <CourseLibrary
      initialCourses={COURSES.slice(0, 6)}
      initialHasMore={true}
      category="all"
      q=""
      total={COURSES.length}
      limit={6}
      allCourses={COURSES}
      {...props}
    />
  );

const localStorageMock = (() => {
  let store = {};

  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

describe("CourseLibrary saved-course shortlist", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  test("saves a course to localStorage from the course card", async () => {
    const user = userEvent.setup();

    renderCourseLibrary();

    await user.click(
      screen.getByRole("button", {
        name: /save advanced next\.js.*react architecture to saved courses/i,
      })
    );

    expect(JSON.parse(window.localStorage.getItem(SAVED_COURSES_STORAGE_KEY))).toEqual([
      "nextjs-mastery",
    ]);
    expect(toast.success).toHaveBeenCalledWith("Course saved for later");
    expect(
      screen.getByRole("button", {
        name: /remove advanced next\.js.*react architecture from saved courses/i,
      })
    ).toBeInTheDocument();
  });

  test("keeps UI state unchanged when saved-course persistence fails", async () => {
    const user = userEvent.setup();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    window.localStorage.setItem.mockImplementationOnce(() => {
      throw new Error("Storage unavailable");
    });

    renderCourseLibrary();

    await user.click(
      screen.getByRole("button", {
        name: /save advanced next\.js.*react architecture to saved courses/i,
      })
    );

    expect(window.localStorage.getItem(SAVED_COURSES_STORAGE_KEY)).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(
      "Could not update saved courses on this device."
    );
    expect(
      screen.getByRole("button", {
        name: /save advanced next\.js.*react architecture to saved courses/i,
      })
    ).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test("shows saved courses that are outside the first paginated page", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      SAVED_COURSES_STORAGE_KEY,
      JSON.stringify(["figma-prototyping-advanced"])
    );

    renderCourseLibrary();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /show saved courses/i })).toHaveTextContent(
        "1"
      );
    });

    await user.click(screen.getByRole("button", { name: /show saved courses/i }));

    expect(
      screen.getByText("Advanced Figma Prototyping & Micro-interactions")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Advanced Next.js & React Architecture")
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /load more courses/i })).not.toBeInTheDocument();
  });
});
