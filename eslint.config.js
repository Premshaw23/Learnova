import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

const nextConfig = nextPlugin.configs["core-web-vitals"];

const eslintConfig = [
  {
    name: "next-core-web-vitals",
    plugins: nextConfig.plugins,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...nextConfig.rules,
      "no-console": "warn",
    },
  },
  {
    name: "react-hooks",
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
