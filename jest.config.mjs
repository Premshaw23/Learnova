import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
  },
};

const jestConfig = async () => {
  const config = await createJestConfig(customJestConfig)();
  // Override transformIgnorePatterns to whitelist bson and mongodb from being ignored
  config.transformIgnorePatterns = ["node_modules/(?!(bson|mongodb|undici)/)"];
  return config;
};

export default jestConfig;
