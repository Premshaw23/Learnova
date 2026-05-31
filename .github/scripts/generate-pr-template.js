/**
 * Interactive CLI PR template markdown generator.
 * Helps contributors generate a compliant PR markdown description.
 */

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const questions = [
  "What is the related issue number? (e.g. 42): ",
  "Provide a short summary of the contribution: ",
  "What type of change is this? (1: Bug Fix, 2: New Feature, 3: Documentation, 4: Performance): ",
  "List the key changes (comma-separated): ",
  "How did you test this locally? (e.g. ran npm test): ",
];

const answers = [];

function ask(index) {
  if (index === questions.length) {
    generateMarkdown();
    rl.close();
    return;
  }

  rl.question(questions[index], (answer) => {
    answers.push(answer.trim());
    ask(index + 1);
  });
}

function generateMarkdown() {
  const [issue, summary, typeChoice, changes, testing] = answers;

  let typeCheckbox = "- [ ] Bug fix\n- [ ] New feature\n- [ ] Documentation update\n- [ ] Performance improvement";
  if (typeChoice === "1") {
    typeCheckbox = "- [x] Bug fix\n- [ ] New feature\n- [ ] Documentation update\n- [ ] Performance improvement";
  } else if (typeChoice === "2") {
    typeCheckbox = "- [ ] Bug fix\n- [x] New feature\n- [ ] Documentation update\n- [ ] Performance improvement";
  } else if (typeChoice === "3") {
    typeCheckbox = "- [ ] Bug fix\n- [ ] New feature\n- [x] Documentation update\n- [ ] Performance improvement";
  } else if (typeChoice === "4") {
    typeCheckbox = "- [ ] Bug fix\n- [ ] New feature\n- [ ] Documentation update\n- [x] Performance improvement";
  }

  const changeList = changes.split(",").map(c => `- ${c.trim()}`).join("\n");

  const markdown = `## Description
${summary}

## Related Issue
Closes #${issue}

## Type of Change
${typeCheckbox}

## Changes Made
${changeList}

## Testing
${testing}
`;

  console.log("\n================ GENERATED PR DESCRIPTION ================\n");
  console.log(markdown);
  console.log("==========================================================\n");
}

console.log("Welcome to the Learnova PR Template Description Generator!\n");
ask(0);
