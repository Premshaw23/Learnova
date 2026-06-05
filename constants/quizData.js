/**
 * Centrally managed quiz questions dataset for Learnova activities.
 * Maps exact activity titles to curated question pools.
 */
export const quizDatabase = {
  "Quantum Physics Quiz": {
    category: "science",
    level: "college",
    timeLimit: 120, // 2 minutes
    questions: [
      {
        id: 1,
        question: "What is the fundamental particle/quantum of light?",
        options: ["Proton", "Neutron", "Photon", "Electron"],
        answer: 2, // Photon
      },
      {
        id: 2,
        question: "Which principle states that it's impossible to simultaneously measure a particle's exact position and momentum?",
        options: [
          "Pauli Exclusion Principle",
          "Heisenberg Uncertainty Principle",
          "Schrödinger Equation",
          "Planck's Quantum Theory",
        ],
        answer: 1, // Heisenberg Uncertainty Principle
      },
      {
        id: 3,
        question: "Which equation mathematically describes how the quantum state of a physical system changes over time?",
        options: [
          "Einstein Field Equation",
          "Maxwell's Equations",
          "Schrödinger Equation",
          "Newton's Second Law",
        ],
        answer: 2, // Schrödinger Equation
      },
    ],
  },
  "Java Programming Quiz": {
    category: "coding",
    level: "college",
    timeLimit: 120,
    questions: [
      {
        id: 1,
        question: "Which keyword is used to inherit a class in Java?",
        options: ["implements", "extends", "inherits", "super"],
        answer: 1,
      },
      {
        id: 2,
        question: "What is the parent class of all Java classes?",
        options: ["Object", "Base", "Main", "Root"],
        answer: 0,
      },
      {
        id: 3,
        question: "Which collection preserves insertion order and allows duplicates?",
        options: ["HashSet", "TreeSet", "ArrayList", "HashMap"],
        answer: 2,
      },
    ],
  },
  "Python Programming Quiz": {
    category: "coding",
    level: "college",
    timeLimit: 120,
    questions: [
      {
        id: 1,
        question: "What does the `len()` function return in Python?",
        options: [
          "The type of an object",
          "The number of items in an object",
          "The memory address of an object",
          "The last element in an object",
        ],
        answer: 1,
      },
      {
        id: 2,
        question: "Which data structure is mutable and ordered in Python?",
        options: ["tuple", "list", "set", "frozenset"],
        answer: 1,
      },
      {
        id: 3,
        question: "Which keyword is used to define a function in Python?",
        options: ["func", "def", "lambda", "function"],
        answer: 1,
      },
    ],
  },
  "C Programming Quiz": {
    category: "coding",
    level: "college",
    timeLimit: 120,
    questions: [
      {
        id: 1,
        question: "Which operator is used to access the value stored at an address in C?",
        options: ["&", "*", "->", "%"],
        answer: 1,
      },
      {
        id: 2,
        question: "What is the correct file extension for a C source file?",
        options: [".cpp", ".c", ".cs", ".java"],
        answer: 1,
      },
      {
        id: 3,
        question: "Which function is commonly used to allocate memory dynamically in C?",
        options: ["printf", "malloc", "scanf", "free"],
        answer: 1,
      },
    ],
  },
  "C++ Programming Quiz": {
    category: "coding",
    level: "college",
    timeLimit: 120,
    questions: [
      {
        id: 1,
        question: "Which feature is a core part of C++ but not standard C?",
        options: ["Pointers", "Classes", "Loops", "Arrays"],
        answer: 1,
      },
      {
        id: 2,
        question: "What is the standard namespace used in many beginner C++ examples?",
        options: ["std", "cpp", "main", "io"],
        answer: 0,
      },
      {
        id: 3,
        question: "Which operator is used for dynamic memory allocation in C++?",
        options: ["alloc", "new", "create", "malloc"],
        answer: 1,
      },
    ],
  },
  "Geometry Puzzle Master": {
    category: "math",
    level: "middle",
    timeLimit: 90, // 1.5 minutes
    questions: [
      {
        id: 1,
        question: "What is the sum of the interior angles of a regular hexagon?",
        options: ["360°", "540°", "720°", "900°"],
        answer: 2, // 720°
      },
      {
        id: 2,
        question: "In a right-angled triangle, if the two legs are 3 cm and 4 cm, what is the length of the hypotenuse?",
        options: ["5 cm", "6 cm", "7 cm", "8 cm"],
        answer: 0, // 5 cm
      },
      {
        id: 3,
        question: "What is the area of a circle with a radius of 7 cm? (Take pi as 22/7)",
        options: ["44 cm²", "154 cm²", "308 cm²", "616 cm²"],
        answer: 1, // 154 cm²
      },
    ],
  },
  "General Knowledge Quiz": {
    category: "general",
    level: "elementary",
    timeLimit: 60, // 1 minute
    questions: [
      {
        id: 1,
        question: "Which planet in our solar system is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        answer: 1, // Mars
      },
      {
        id: 2,
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Southern Ocean", "Pacific Ocean"],
        answer: 3, // Pacific Ocean
      },
      {
        id: 3,
        question: "How many continents are there on Earth?",
        options: ["5", "6", "7", "8"],
        answer: 2, // 7
      },
    ],
  },
};

/**
 * Gets a quiz by title, falling back to a general knowledge quiz if not matched.
 * @param {string} title - The title of the activity.
 * @returns {Object} The quiz object containing category, level, timeLimit, and questions.
 */
export const getQuizDataByTitle = (title) => {
  if (title && quizDatabase[title]) {
    return { ...quizDatabase[title], title };
  }
  return { ...quizDatabase["General Knowledge Quiz"], title: title || "General Knowledge Quiz" };
};
