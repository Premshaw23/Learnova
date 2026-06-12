const globals = require("globals");
const reactHooks = require("eslint-plugin-react-hooks");

const rules = {
  "no-console": ["warn", { allow: ["warn", "error", "info", "debug"] }],
  indent: ["warn", 2],
  "linebreak-style": ["warn", "unix"],
  quotes: ["warn", "double"],
  semi: ["warn", "always"],
  "no-unused-vars": [
    "warn",
    { varsIgnorePattern: "^React$", argsIgnorePattern: "^_" },
  ],
  "no-empty": "warn",
  "no-useless-assignment": "off",
  "no-dupe-keys": "warn",
  "no-undef": "warn",
};

module.exports = [
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        _: "readonly",
        isDev: "readonly",
      },
    },
    rules,
  },
  {
    files: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/__tests__/**",
      "**/tests/**",
      "**/testUtils/**",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        vi: "readonly",
      },
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "out/**",
      "coverage/**",
      ".github/scripts/**",
      "public/*.js",
    ],
  },
];
