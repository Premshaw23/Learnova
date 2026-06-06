// tests/setup.js
import React from 'react';
import { vi } from 'vitest';

// =========================================================================
// 1. Mock Global Environment Secrets (Evaluated before internal file imports)
// =========================================================================
process.env.GROQ_API_KEY = "mock-groq-api-key-for-testing";
process.env.MONGODB_URI = "mongodb://localhost:27017/mock-test-db";

process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "mock-api-key";
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "mock-auth-domain";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "mock-project-id";
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "mock-storage-bucket";
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "mock-sender-id";
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "mock-app-id";

// =========================================================================
// 2. Global Framework Engine Mocks
// =========================================================================

// Fixes Lucide icon crash ("No 'GraduationCap' export defined...")
vi.mock('lucide-react', () => {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        return (props) => React.createElement('span', { 'data-testid': `icon-${prop}`, ...props });
      },
    }
  );
});

// Fixes Groq SDK "running in a browser-like environment" guard exception
vi.mock('groq-sdk', () => {
  return {
    default: class MockGroq {
      constructor() {
        this.chat = {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'Mock response string' } }]
            })
          }
        };
      }
    }
  };
});

// Intercepts local MongoDB connector instances to bypass connection hook timeouts
vi.mock('@/lib/mongodb', () => ({
  connectDb: vi.fn().mockResolvedValue({
    collection: () => ({
      findOne: vi.fn(),
      updateOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      insertOne: vi.fn(),
    }),
  }),
}));

// =========================================================================
// 3. Third-party testing extensions
// =========================================================================
import '@testing-library/jest-dom';