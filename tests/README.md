# Learnova Test Suite

## Setup

Tests use [Vitest](https://vitest.dev/) with jsdom environment.

## Running Tests

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run test:ui       # Interactive browser UI
```

## Structure

```
tests/
├── setup.js                         # Global test setup (@testing-library/jest-dom)
├── utils/
│   └── attendanceUtils.test.js      # Pure utility function tests
└── api/
    └── attendance.test.js           # Route handler tests (POST /api/attendance/record)
```

## Writing Tests

- **Unit tests** go in `tests/utils/` — import functions directly from `lib/`
- **API route tests** go in `tests/api/` — mock all external dependencies (Firebase, rate limiting, etc.)
- Use `@/` alias to import from the project root (e.g., `@/lib/attendanceUtils`)
- All mocks are reset in `beforeEach` via `vi.clearAllMocks()`

## Coverage

Coverage reports are written to `coverage/` (gitignored). Thresholds: **70% functions, 70% lines**.
