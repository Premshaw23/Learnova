import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NEXT_PUBLIC_FIREBASE_API_KEY:
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
      NEXT_PUBLIC_FIREBASE_APP_ID:
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
        "1:123456789:web:abcdefghijklmnop",
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
        process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-DUMMY",
      MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost/dummy",
      MONGODB_DB: process.env.MONGODB_DB || "dummy",
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "dummy",
      FIREBASE_PRIVATE_KEY:
        process.env.FIREBASE_PRIVATE_KEY ||
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1\n-----END PRIVATE KEY-----",
      FIREBASE_CLIENT_EMAIL:
        process.env.FIREBASE_CLIENT_EMAIL ||
        "dummy@dummy.iam.gserviceaccount.com",
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || "dummy_token",
      NEXT_PUBLIC_EMAILJS_SERVICE_ID:
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "dummy",
      NEXT_PUBLIC_EMAILJS_TEMPLATE_ID:
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "dummy",
      NEXT_PUBLIC_EMAILJS_USER_ID:
        process.env.NEXT_PUBLIC_EMAILJS_USER_ID || "dummy",
      GROQ_API_KEY: process.env.GROQ_API_KEY || "dummy",
    },
  },
});
