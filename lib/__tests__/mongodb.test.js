import { connectDbForSSE, ensureIndexes } from "../mongodb";
import { MongoClient } from "mongodb";

let mockInstances = [];
let mockDbInstances = [];
let mockCreateIndex;

vi.mock("@/utils/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("mongodb", () => {
  class MockMongoClient {
    constructor(uri, options) {
      this.uri = uri;
      this.options = options;
      this.listeners = {};
      this.isClosed = false;
      mockInstances.push(this);
    }

    on(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    }

    emit(event, ...args) {
      if (this.listeners[event]) {
        this.listeners[event].forEach((cb) => cb(...args));
      }
    }

    removeAllListeners() {
      this.listeners = {};
    }

    async connect() {
      return this;
    }

    db(name) {
      const mockDb = {
        databaseName: name,
        client: this,
        collection: vi.fn(() => ({
          createIndex: mockCreateIndex,
        })),
      };
      mockDbInstances.push(mockDb);
      return mockDb;
    }

    async close() {
      this.isClosed = true;
    }
  }

  return {
    MongoClient: MockMongoClient,
  };
});

describe("connectDbForSSE - Connection Drop Reset Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    mockInstances = [];
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      MONGODB_URI: "mongodb://localhost:27017/test",
      MONGODB_DB: "testdb",
      NODE_ENV: "production",
    };
  });

  afterEach(() => {
    if (mockInstances.length > 0) {
      mockInstances[mockInstances.length - 1].emit("close");
    }
    process.env = originalEnv;
  });

  test("connects and returns database on first call", async () => {
    const db = await connectDbForSSE();
    expect(db.databaseName).toBe("testdb");
    expect(mockInstances.length).toBe(1);
  });

  test("reuses the same client for subsequent successful calls", async () => {
    const db1 = await connectDbForSSE();
    const db2 = await connectDbForSSE();
    expect(db1.client).toBe(db2.client);
    expect(mockInstances.length).toBe(1);
  });

  test("resets sseClient when 'close' event is emitted", async () => {
    const db1 = await connectDbForSSE();
    const client1 = mockInstances[0];

    // Emit connection drop
    client1.emit("close");

    // Next connection request should establish a new client
    const db2 = await connectDbForSSE();
    expect(mockInstances.length).toBe(2);
    expect(db2.client).not.toBe(client1);
  });

  test("resets sseClient when 'timeout' event is emitted", async () => {
    const db1 = await connectDbForSSE();
    const client1 = mockInstances[0];

    // Emit connection timeout
    client1.emit("timeout");

    // Next connection request should establish a new client
    const db2 = await connectDbForSSE();
    expect(mockInstances.length).toBe(2);
    expect(db2.client).not.toBe(client1);
  });

  test("resets sseClient when 'error' event is emitted", async () => {
    const db1 = await connectDbForSSE();
    const client1 = mockInstances[0];

    // Emit connection error
    client1.emit("error", new Error("Connection lost"));

    // Next connection request should establish a new client
    const db2 = await connectDbForSSE();
    expect(mockInstances.length).toBe(2);
    expect(db2.client).not.toBe(client1);
  });
});

describe("ensureIndexes", () => {
  beforeEach(() => {
    mockCreateIndex = vi.fn().mockResolvedValue({});
    mockDbInstances = [];
  });

  test("includes indexes for hot notification and leaderboard queries", async () => {
    const db = {
      collection: vi.fn(() => ({ createIndex: mockCreateIndex })),
    };

    await ensureIndexes(db);

    expect(db.collection).toHaveBeenCalledWith("notifications");
    expect(db.collection).toHaveBeenCalledWith("users");

    const calls = mockCreateIndex.mock.calls;
    expect(calls).toContainEqual([
      { userId: 1, createdAt: -1 },
      { background: true },
    ]);
    expect(calls).toContainEqual([{ totalXp: -1 }, { background: true }]);
    expect(calls).toContainEqual([{ firebaseUid: 1 }, { background: true }]);

    // Existing hot-collection indexes are preserved
    expect(calls).toContainEqual([
      { expiresAt: 1 },
      { expireAfterSeconds: 0, background: true },
    ]);
    expect(calls).toContainEqual([{ operationId: 1 }, { background: true }]);
    expect(calls).toContainEqual([
      { userId: 1, date: 1 },
      { unique: true, background: true },
    ]);
  });
});

describe("connectDb - index bootstrapping", () => {
  beforeEach(() => {
    vi.resetModules();
    mockInstances = [];
    mockDbInstances = [];
    mockCreateIndex = vi.fn().mockResolvedValue({});
    global._mongoClientPromise = undefined;
    global._mongoSseClientPromise = undefined;
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    process.env.MONGODB_DB = "testdb";
    process.env.NODE_ENV = "development";
  });

  test("bootstraps indexes once and caches the result", async () => {
    const { connectDb } = await import("../mongodb");

    const db1 = await connectDb();
    const db2 = await connectDb();
    expect(db1.databaseName).toBe("testdb");
    expect(db2.databaseName).toBe("testdb");

    const callsAfterFirstConnect = mockCreateIndex.mock.calls.length;
    expect(callsAfterFirstConnect).toBeGreaterThan(0);

    await connectDb();
    expect(mockCreateIndex.mock.calls.length).toBe(callsAfterFirstConnect);
  });

  test("keeps indexesEnsured false and retries when index creation fails", async () => {
    mockCreateIndex.mockRejectedValueOnce(new Error("transient index failure"));
    const { connectDb } = await import("../mongodb");

    const db1 = await connectDb();
    expect(db1.databaseName).toBe("testdb");
    const callsAfterFailure = mockCreateIndex.mock.calls.length;

    // Second call retries index creation because the flag was never set
    const db2 = await connectDb();
    expect(db2.databaseName).toBe("testdb");
    expect(mockCreateIndex.mock.calls.length).toBeGreaterThan(
      callsAfterFailure
    );

    // After a successful retry, no further index attempts occur
    const callsAfterRetry = mockCreateIndex.mock.calls.length;
    const db3 = await connectDb();
    expect(db3.databaseName).toBe("testdb");
    expect(mockCreateIndex.mock.calls.length).toBe(callsAfterRetry);
  });
});
