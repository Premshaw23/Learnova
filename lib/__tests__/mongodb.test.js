import { connectDbForSSE } from "../mongodb";
import { MongoClient } from "mongodb";

let mockInstances = [];

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
      return { databaseName: name, client: this };
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
