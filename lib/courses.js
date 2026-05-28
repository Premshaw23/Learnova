// Master database of curated courses
export const COURSES = [
  {
    id: "nextjs-mastery",
    title: "Advanced Next.js & React Architecture",
    description: "Master server components, advanced rendering patterns, state management, and optimized deployment pipelines for modern web applications.",
    instructor: "Dr. Elena Rostova",
    duration: "12 hours • 24 lessons",
    difficulty: "Advanced",
    rating: "4.9",
    category: "web-dev",
    categoryLabel: "Web Dev",
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: "python-data-science",
    title: "Python for Data Science & AI",
    description: "Dive deep into NumPy, Pandas, Scikit-Learn, and build robust machine learning models from scratch.",
    instructor: "Prof. Sarah Jenkins",
    duration: "18 hours • 36 lessons",
    difficulty: "Intermediate",
    rating: "4.8",
    category: "data-science",
    categoryLabel: "Data Science",
    color: "from-teal-600 to-emerald-600",
  },
  {
    id: "ui-ux-design-fundamentals",
    title: "UI/UX Design Systems & Figma",
    description: "Learn to design premium user interfaces, establish styling tokens, and build complex component libraries in Figma.",
    instructor: "Marcus Aurelius",
    duration: "10 hours • 20 lessons",
    difficulty: "Beginner",
    rating: "4.7",
    category: "design",
    categoryLabel: "Design",
    color: "from-pink-600 to-purple-600",
  },
  {
    id: "fullstack-web-dev",
    title: "Modern Full-Stack Web Development",
    description: "Build scalable web applications using React, Node.js, Express, and MongoDB with modern authentication.",
    instructor: "Prem Shaw",
    duration: "25 hours • 50 lessons",
    difficulty: "Intermediate",
    rating: "5.0",
    category: "web-dev",
    categoryLabel: "Web Dev",
    color: "from-violet-600 to-purple-600",
  },
  {
    id: "intro-machine-learning",
    title: "Introduction to Machine Learning",
    description: "Learn the foundational concepts of supervised and unsupervised learning, linear regression, and neural networks.",
    instructor: "Abir Ghosh",
    duration: "15 hours • 30 lessons",
    difficulty: "Intermediate",
    rating: "4.9",
    category: "data-science",
    categoryLabel: "Data Science",
    color: "from-cyan-600 to-blue-600",
  },
  {
    id: "mobile-app-dev-flutter",
    title: "Mobile App Development with Flutter",
    description: "Build high-performance, cross-platform mobile apps for iOS and Android using Flutter and Dart.",
    instructor: "Prashant Bhati",
    duration: "14 hours • 28 lessons",
    difficulty: "Intermediate",
    rating: "4.8",
    category: "web-dev",
    categoryLabel: "Web Dev",
    color: "from-amber-600 to-orange-600",
  },
  {
    id: "deep-learning-pytorch",
    title: "Deep Learning & Neural Networks with PyTorch",
    description: "Implement convolutional and recurrent neural networks, transformers, and transfer learning pipelines using PyTorch.",
    instructor: "Dr. Elena Rostova",
    duration: "16 hours • 32 lessons",
    difficulty: "Advanced",
    rating: "4.9",
    category: "data-science",
    categoryLabel: "Data Science",
    color: "from-red-650 to-orange-650",
  },
  {
    id: "figma-prototyping-advanced",
    title: "Advanced Figma Prototyping & Micro-interactions",
    description: "Create high-fidelity interactive prototypes, smart animate components, and handle variable-driven dynamic layouts.",
    instructor: "Marcus Aurelius",
    duration: "8 hours • 16 lessons",
    difficulty: "Advanced",
    rating: "4.9",
    category: "design",
    categoryLabel: "Design",
    color: "from-rose-500 to-pink-600",
  },
  {
    id: "typescript-production",
    title: "Production-grade TypeScript & Design Patterns",
    description: "Master advanced types, utility generics, decorators, and system architecture design patterns for scalable enterprise apps.",
    instructor: "Alex Johnson",
    duration: "9 hours • 18 lessons",
    difficulty: "Advanced",
    rating: "4.8",
    category: "web-dev",
    categoryLabel: "Web Dev",
    color: "from-blue-700 to-sky-600",
  },
  {
    id: "docker-kubernetes-devops",
    title: "Docker, Kubernetes & Production DevOps",
    description: "Containerize web apps, configure multi-node Kubernetes orchestration, and deploy highly resilient CI/CD pipelines.",
    instructor: "Prof. Sarah Jenkins",
    duration: "20 hours • 40 lessons",
    difficulty: "Intermediate",
    rating: "4.9",
    category: "web-dev",
    categoryLabel: "Web Dev",
    color: "from-cyan-600 to-teal-600",
  },
  {
    id: "data-structures-algorithms",
    title: "Mastering Data Structures & Algorithms",
    description: "Implement advanced structures like trees, graphs, heaps, and optimize algorithms for complexity and speed.",
    instructor: "Prem Shaw",
    duration: "30 hours • 60 lessons",
    difficulty: "Intermediate",
    rating: "5.0",
    category: "data-science",
    categoryLabel: "Data Science",
    color: "from-purple-700 to-indigo-700",
  },
  {
    id: "illustrator-vector-graphics",
    title: "Vector Art & Asset Creation in Adobe Illustrator",
    description: "Master anchor points, pathfinding operations, and vector design principles for product UI and brand design assets.",
    instructor: "Marcus Aurelius",
    duration: "11 hours • 22 lessons",
    difficulty: "Beginner",
    rating: "4.6",
    category: "design",
    categoryLabel: "Design",
    color: "from-orange-500 to-yellow-600",
  },
  {
    id: "graphql-apollo-federation",
    title: "Enterprise GraphQL & Apollo Supergraph",
    description: "Design type-safe subgraphs, implement federated routers, and optimize backend query loading pathways.",
    instructor: "Alex Johnson",
    duration: "13 hours • 26 lessons",
    difficulty: "Advanced",
    rating: "4.8",
    category: "web-dev",
    categoryLabel: "Web Dev",
    color: "from-indigo-600 to-pink-500",
  },
  {
    id: "reinforcement-learning-ai",
    title: "Reinforcement Learning & Game Theory",
    description: "Explore Markov decision processes, Q-learning, deep Q-networks, and policy gradients for adaptive AI models.",
    instructor: "Abir Ghosh",
    duration: "22 hours • 44 lessons",
    difficulty: "Advanced",
    rating: "4.9",
    category: "data-science",
    categoryLabel: "Data Science",
    color: "from-emerald-600 to-blue-700",
  },
  {
    id: "web-accessibility-wcag",
    title: "Web Accessibility (A11y) & WCAG Deep Dive",
    description: "Ensure complete compliance with WCAG guidelines by implementing screen-reader aria properties and keyboard operations.",
    instructor: "Prashant Bhati",
    duration: "7 hours • 14 lessons",
    difficulty: "Intermediate",
    rating: "4.9",
    category: "design",
    categoryLabel: "Design",
    color: "from-indigo-700 to-violet-800",
  }
];

/**
 * Filter and Paginate Courses
 */
export function getPaginatedCourses({ q = "", category = "all", page = 1, limit = 12 }) {
  const filtered = COURSES.filter((course) => {
    const matchesSearch = q
      ? course.title.toLowerCase().includes(q.toLowerCase()) ||
        course.description.toLowerCase().includes(q.toLowerCase()) ||
        course.instructor.toLowerCase().includes(q.toLowerCase())
      : true;

    const matchesCategory =
      category === "all"
        ? true
        : course.category === category ||
          course.category.replace("-", "") === category ||
          category.includes(course.category);

    return matchesSearch && matchesCategory;
  });

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginated = filtered.slice(startIndex, endIndex);

  return {
    courses: paginated,
    total: filtered.length,
    hasMore: endIndex < filtered.length
  };
}
