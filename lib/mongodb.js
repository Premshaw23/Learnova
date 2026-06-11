import { MongoClient } from "mongodb";
import { logger } from "@/lib/logger";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

// Telemetry State
if (!global._mongoMetrics) {
  global._mongoMetrics = { totalRequests: 0, retries: 0 };
}
const metrics = global._mongoMetrics;

const options = {
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client = null;
let clientPromise = null;
let indexesEnsured = false;

function getClientPromise() {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI || MONGODB_URI;
    if (!uri) {
      throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
    }
    client = new MongoClient(uri, options);
    clientPromise = client.connect().catch((err) => {
      clientPromise = null;
      client = null;
      throw err;
    });
  }
  return clientPromise;
}

async function ensureIndexes(db) {
  try {
    await Promise.all([
      db.collection("rate_limits").createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, background: true }
      ),
      db.collection("pending_operations").createIndex(
        { operationId: 1 },
        { unique: true, background: true }
      ),
      db.collection("pending_operations").createIndex(
        { status: 1, updatedAt: 1 },
        { background: true }
      ),
      db.collection("pending_operations").createIndex(
        { status: 1, createdAt: 1 },
        { background: true }
      ),
    ]);
  } catch (err) {
    if (logger?.error) {
      logger.error("[DB Manager] Index creation failed", { error: err.message });
    }
  }
}

export async function connectDb() {
  try {
    const promise = getClientPromise();
    const connectedClient = await promise;
    const db = connectedClient.db(MONGODB_DB || "learnova");

    if (!indexesEnsured) {
      indexesEnsured = true;
      // Perform index creation asynchronously to avoid blocking the request path
      ensureIndexes(db).catch(() => {
        indexesEnsured = false;
      });
    }

    return db;
  } catch (error) {
    if (logger?.error) {
      logger.error("[DB Manager] Main pool connection failed", { error: error.message });
    }
    throw new Error(`Failed to establish database connection: ${error.message}`);
  }
}

// Dedicated SSE Pool
let sseClient = null;
let sseClientPromise = null;
const sseOptions = {
  maxPoolSize: 30,
  maxIdleTimeMS: 120000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
};

function resetSseClient() {
  const clientToClose = sseClient;
  sseClientPromise = null;
  sseClient = null;
  if (clientToClose) {
    clientToClose.removeAllListeners();
    clientToClose.close().catch(() => {});
  }
}

export async function connectDbForSSE() {
  try {
    if (!sseClientPromise) {
      const uri = process.env.MONGODB_URI || MONGODB_URI;
      if (!uri) {
        throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
      }
      sseClient = new MongoClient(uri, sseOptions);
      sseClientPromise = sseClient.connect().catch((err) => {
        resetSseClient();
        throw err;
      });
    }
    const connectedClient = await sseClientPromise;
    
    // Register listeners
    if (sseClient) {
      sseClient.on("close", resetSseClient);
      sseClient.on("timeout", resetSseClient);
      sseClient.on("error", resetSseClient);
    }
    
    return connectedClient.db(MONGODB_DB || "learnova");
  } catch (error) {
    resetSseClient();
    if (logger?.error) {
      logger.error("[DB Manager] SSE pool connection failed", { error: error.message });
    }
    throw new Error(`Failed to establish SSE database connection: ${error.message}`);
  }
}

// Exponential Backoff retry wrapper
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

export async function executeWithRetry(operation, context = "DB Operation") {
  let attempt = 0;
  let delay = INITIAL_BACKOFF_MS;

  while (attempt <= MAX_RETRIES) {
    try {
      metrics.totalRequests++;
      const startTime = performance.now();
      const result = await operation();
      const latency = performance.now() - startTime;
      if (latency > 800 && logger?.warn) {
        logger.warn(`[DB Manager] ⚠️ Slow query detected in ${context}. Latency: ${latency.toFixed(2)}ms`);
      }
      return result;
    } catch (error) {
      attempt++;
      if (attempt > MAX_RETRIES) {
        if (logger?.error) {
          logger.error(`[DB Manager] 💥 Exhausted all retries for ${context}`, { error: error.message });
        }
        throw error;
      }
      metrics.retries++;
      if (logger?.warn) {
        logger.warn(`[DB Manager] 📉 Transient error in ${context}. Retrying ${attempt}/${MAX_RETRIES} in ${delay}ms...`, { error: error.message });
      }
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

export function getDbMetrics() {
  return {
    activePool: clientPromise ? "connected" : "disconnected",
    ...metrics,
  };
}

export async function disconnectDb() {
  const clientToClose = client;
  clientPromise = null;
  client = null;
  indexesEnsured = false;
  if (clientToClose) {
    await clientToClose.close().catch(() => {});
  }
}

export async function disconnectDbForSSE() {
  resetSseClient();
}

export default clientPromise;
