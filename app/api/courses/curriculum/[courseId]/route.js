import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";

const MOCK_CURRICULUMS = {
  "nextjs-mastery": [
    {
      id: "mod-next-1",
      title: "Module 1: React Server Components (RSC) Deep Dive",
      order: 0,
      lessons: [
        {
          id: "les-next-1-1",
          title: "Understanding the Server/Client Boundary",
          duration: "18 mins",
          type: "video",
          completed: true,
          order: 0,
        },
        {
          id: "les-next-1-2",
          title: "Data Fetching Patterns with Suspense",
          duration: "25 mins",
          type: "video",
          completed: true,
          order: 1,
        },
        {
          id: "les-next-1-3",
          title: "Streaming and Progressive Hydration",
          duration: "20 mins",
          type: "article",
          completed: false,
          order: 2,
        },
      ],
    },
    {
      id: "mod-next-2",
      title: "Module 2: Advanced Routing & Rendering",
      order: 1,
      lessons: [
        {
          id: "les-next-2-1",
          title: "Parallel and Intercepted Routes",
          duration: "32 mins",
          type: "video",
          completed: false,
          order: 0,
        },
        {
          id: "les-next-2-2",
          title: "Dynamic Route Handlers & Middleware",
          duration: "15 mins",
          type: "code",
          completed: false,
          order: 1,
        },
        {
          id: "les-next-2-3",
          title: "On-demand Incremental Static Regeneration (ISR)",
          duration: "22 mins",
          type: "quiz",
          completed: false,
          order: 2,
        },
      ],
    },
  ],
  "python-data-science": [
    {
      id: "mod-py-1",
      title: "Module 1: Getting Started with NumPy & Pandas",
      order: 0,
      lessons: [
        {
          id: "les-py-1-1",
          title: "Introduction to Vectorized Operations",
          duration: "15 mins",
          type: "video",
          completed: true,
          order: 0,
        },
        {
          id: "les-py-1-2",
          title: "Data Wrangling & Cleaning with Pandas",
          duration: "30 mins",
          type: "video",
          completed: false,
          order: 1,
        },
      ],
    },
    {
      id: "mod-py-2",
      title: "Module 2: Exploratory Data Analysis & Visualization",
      order: 1,
      lessons: [
        {
          id: "les-py-2-1",
          title: "Creating Premium Charts with Seaborn",
          duration: "25 mins",
          type: "video",
          completed: false,
          order: 0,
        },
        {
          id: "les-py-2-2",
          title: "EDA Case Study: Global Temperature Shifts",
          duration: "45 mins",
          type: "code",
          completed: false,
          order: 1,
        },
      ],
    },
  ],
};

const COURSE_ID_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const GET = withErrorHandler(async (request, { params }) => {
  await requireAuth(request);
  const { courseId } = await params;

  if (typeof courseId !== "string" || !COURSE_ID_REGEX.test(courseId)) {
    return NextResponse.json(
      { success: false, error: "Invalid course ID format" },
      { status: 400 }
    );
  }

  let curriculum = null;

  try {
    if (process.env.MONGODB_URI) {
      const db = await connectDb();
      const record = await db
        .collection("course_curriculums")
        .findOne({ courseId: { $eq: courseId } });
      if (record) {
        curriculum = record.modules;
      }
    }
  } catch (dbError) {
    console.warn(
      "MongoDB fetch failed, falling back to static mock data:",
      dbError.message
    );
  }

  if (!curriculum) {
    curriculum = MOCK_CURRICULUMS[courseId] || [
      {
        id: `mod-generic-1`,
        title: "Module 1: Foundations & Core Concepts",
        order: 0,
        lessons: [
          {
            id: `les-generic-1-1`,
            title: "Welcome and Course Overview",
            duration: "10 mins",
            type: "video",
            completed: false,
            order: 0,
          },
          {
            id: `les-generic-1-2`,
            title: "Setup and Prerequisites",
            duration: "15 mins",
            type: "article",
            completed: false,
            order: 1,
          },
        ],
      },
      {
        id: `mod-generic-2`,
        title: "Module 2: Practice & Applications",
        order: 1,
        lessons: [
          {
            id: `les-generic-2-1`,
            title: "Hands-on Exercise",
            duration: "30 mins",
            type: "code",
            completed: false,
            order: 0,
          },
          {
            id: `les-generic-2-2`,
            title: "Knowledge Evaluation Quiz",
            duration: "12 mins",
            type: "quiz",
            completed: false,
            order: 1,
          },
        ],
      },
    ];
  }

  const sortedCurriculum = curriculum
    .map((mod) => ({
      ...mod,
      lessons: (mod.lessons || []).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      ),
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return NextResponse.json({
    success: true,
    courseId,
    modules: sortedCurriculum,
  });
});
