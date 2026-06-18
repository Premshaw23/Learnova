import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "dist/**/*",
      "out/**/*",
      "public/**/*",
      "__tests__/**/*",
      "tests/**/*",
      "*.config.js",
      "*.config.mjs",
      "jest.setup.js",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "no-console": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/preserve-manual-memoization": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
