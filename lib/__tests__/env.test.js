import { formatEnvValidationError, getEnvValidationResult, validateEnv } from "../env";

const requiredEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-project",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "test.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456789:web:test",
  MONGODB_URI: "mongodb://localhost:27017/test",
  GROQ_API_KEY: "test-groq-key",
};

const originalEnv = process.env;

describe("environment validation", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete globalThis.__learnovaEnvValidationWarningLogged;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("reports missing required environment variables without throwing", () => {
    process.env = {};

    const result = getEnvValidationResult(process.env);

    expect(result.isValid).toBe(false);
    expect(result.missingVars).toEqual(
      expect.arrayContaining([
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        "NEXT_PUBLIC_FIREBASE_APP_ID",
        "MONGODB_URI",
        "GROQ_API_KEY",
      ])
    );
  });

  test("throws in strict mode when required variables are missing", () => {
    process.env = {};

    expect(() => validateEnv()).toThrow("Environment Variable Validation Failed");
  });

  test("warns instead of throwing in non-strict mode", () => {
    process.env = {};
    const logger = { warn: jest.fn(), log: jest.fn() };

    const result = validateEnv({ throwOnError: false, logger });

    expect(result.isValid).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Environment Variable Validation Failed")
    );
  });

  test("can suppress repeated warnings in non-strict mode", () => {
    process.env = {};
    const logger = { warn: jest.fn(), log: jest.fn() };

    validateEnv({ throwOnError: false, warnOnce: true, logger });
    validateEnv({ throwOnError: false, warnOnce: true, logger });

    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  test("accepts fully configured environment variables", () => {
    process.env = { ...requiredEnv };
    const logger = { warn: jest.fn(), log: jest.fn() };

    const result = validateEnv({ logger });

    expect(result.isValid).toBe(true);
    expect(logger.log).toHaveBeenCalledWith("✅ Environment variables validated successfully");
    expect(logger.warn).not.toHaveBeenCalled();
  });

  test("formats placeholder values as invalid variables", () => {
    const result = getEnvValidationResult({
      ...requiredEnv,
      GROQ_API_KEY: "your_groq_api_key_here",
    });

    const message = formatEnvValidationError(result);

    expect(result.isValid).toBe(false);
    expect(result.invalidVars).toContain("GROQ_API_KEY");
    expect(message).toContain("Invalid environment variables");
  });
});
