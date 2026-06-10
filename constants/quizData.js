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
        question:
          "Which principle states that it's impossible to simultaneously measure a particle's exact position and momentum?",
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
        question:
          "Which equation mathematically describes how the quantum state of a physical system changes over time?",
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
  "Geometry Puzzle Master": {
    category: "math",
    level: "middle",
    timeLimit: 90, // 1.5 minutes
    questions: [
      {
        id: 1,
        question:
          "What is the sum of the interior angles of a regular hexagon?",
        options: ["360°", "540°", "720°", "900°"],
        answer: 2, // 720°
      },
      {
        id: 2,
        question:
          "In a right-angled triangle, if the two legs are 3 cm and 4 cm, what is the length of the hypotenuse?",
        options: ["5 cm", "6 cm", "7 cm", "8 cm"],
        answer: 0, // 5 cm
      },
      {
        id: 3,
        question:
          "What is the area of a circle with a radius of 7 cm? (Take pi as 22/7)",
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
        question:
          "Which planet in our solar system is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        answer: 1, // Mars
      },
      {
        id: 2,
        question: "What is the largest ocean on Earth?",
        options: [
          "Atlantic Ocean",
          "Indian Ocean",
          "Southern Ocean",
          "Pacific Ocean",
        ],
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
  "Factors and Multiples": {
    category: "math",
    level: "elementary",
    timeLimit: 60, // 1 minute
    questions: [
      {
        id: 1,
        question: "What are the factors of 12?",
        options: ["1, 2, 3, 4, 6, 12", "1, 2, 4, 8", "1, 3, 9", "1, 5, 10"],
        answer: 0, // 1, 2, 3, 4, 6, 12
      },
      {
        id: 2,
        question: "Which of the following is a multiple of 5?",
        options: ["12", "15", "22", "28"],
        answer: 1, // 15
      },
      {
        id: 3,
        question: "What is the greatest common factor (GCF) of 18 and 24?",
        options: ["2", "3", "6", "12"],
        answer: 2, // 6
      },
    ],
  },
  "Grammar Galaxy": {
    category: "language",
    level: "elementary",
    timeLimit: 90, // 1.5 minutes
    questions: [
      {
        id: 1,
        question: "Which of the following is a proper noun?",
        options: ["city", "dog", "Alice", "happiness"],
        answer: 2, // Alice
      },
      {
        id: 2,
        question: "Identify the verb in the sentence: 'She runs every morning.'",
        options: ["She", "runs", "every", "morning"],
        answer: 1, // runs
      },
      {
        id: 3,
        question:
          "Which sentence is grammatically correct?",
        options: [
          "He don't like pizza.",
          "They is going to the park.",
          "She has a cat.",
          "We was late to the party.",
        ],
        answer: 2, // She has a cat.
      },
    ], 
  },
  "Junior Coding Quest": {
    category: "coding",
    level: "elementary",
    timeLimit: 90, // 1.5 minutes
    questions: [
      {
        id: 1,
        question: "What is the correct syntax for defining a variable in JavaScript?",
        options: ["var myVar = 5;", "variable myVar = 5;", "let myVar = 5;", "const myVar = 5;"],
        answer: 2, // let myVar = 5;
      },
      {
        id: 2,
        question: "Which of the following is NOT a valid data type in JavaScript?",
        options: ["string", "boolean", "integer", "undefined"],
        answer: 2, // integer
      },
      {
        id: 3,
        question: "What does the '===' operator do in JavaScript?",
        options: [
          "Assigns a value to a variable",
          "Checks for equality without type coercion",
          "Checks for equality with type coercion",
          "Checks if a variable is defined"
        ],
        answer: 1, // Checks for equality without type coercion
      }
    ]
  }
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
  return {
    ...quizDatabase["General Knowledge Quiz"],
    title: title || "General Knowledge Quiz",
  };
};
