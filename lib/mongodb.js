import { MongoClient } from "mongodb";
import logger from "@/utils/logger";

const getMongoUri = () => process.env.MONGODB_URI;

// ============================================================================
// 📊 TELEMETRY STATE (Issue #3258)
// ============================================================================
// Track database stress metrics globally across hot-reloads
if (!global._mongoMetrics) {
  global._mongoMetrics = { totalRequests: 0, retries: 0 };
}
const metrics = global._mongoMetrics;

// ============================================================================
// 🛡️ MAIN CONNECTION POOL (Tuned for Serverless)
// ============================================================================
const options = {
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client;
let mongoClientPromise = null;

const getClientPromise = () => {
  if (!mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
    }

    if (process.env.NODE_ENV === "development") {
      if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect().catch((err) => {
          global._mongoClientPromise = null;
          mongoClientPromise = null;
          throw err;
        });
      }
      mongoClientPromise = global._mongoClientPromise;
    } else {
      client = new MongoClient(uri, options);
      mongoClientPromise = client.connect().catch((err) => {
        mongoClientPromise = null;
        throw err;
      });
    }
  }
  return mongoClientPromise;
};

let cachedPromise = null;

const getCachedClientPromise = () => {
  if (!cachedPromise) {
    cachedPromise = getClientPromise().catch((err) => {
      cachedPromise = null;
      throw err;
    });
  }
  return cachedPromise;
};

const clientPromise = {
  then(onFulfilled, onRejected) {
    return getCachedClientPromise().then(onFulfilled, onRejected);
  },
  catch(onRejected) {
    return getCachedClientPromise().catch(onRejected);
  },
  finally(onFinally) {
    return getCachedClientPromise().finally(onFinally);
  },
};

export async function connectDb() {
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(process.env.MONGODB_DB);
  } catch (error) {
    if (logger?.error)
      logger.error("[DB Manager] Main pool connection failed", {
        error: error.message,
      });
    throw new Error(
      `Failed to establish database connection: ${error.message}`
    );
  }
}

// ============================================================================
// 📡 DEDICATED SSE CONNECTION POOL
// ============================================================================
const sseOptions = {
  maxPoolSize: 30,
  maxIdleTimeMS: 120000, // Slightly longer idle time for live streams
};

let sseClient;
let sseClientPromise;

function resetSseClient() {
  const clientToClose = sseClient;
  sseClientPromise = null;
  sseClient = null;
  if (process.env.NODE_ENV === "development") {
    global._mongoSseClientPromise = null;
  }
  if (clientToClose) {
    clientToClose.removeAllListeners();
    clientToClose.close().catch(() => {});
  }
}

function getSseClientPromise(dbName) {
  if (sseClientPromise) return sseClientPromise;
  if (!getMongoUri()) {
    sseClientPromise = Promise.reject(
      new Error('Invalid/Missing environment variable: "MONGODB_URI"')
    );
    return sseClientPromise;
  }
  if (!sseClient) {
    sseClient = new MongoClient(getMongoUri(), sseOptions);
    sseClient.on("close", resetSseClient);
    sseClient.on("timeout", resetSseClient);
    sseClient.on("error", resetSseClient);
  }
  const connectPromise = sseClient
    .connect()
    .then((client) => client.db(dbName || process.env.MONGODB_DB));
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoSseClientPromise) {
      global._mongoSseClientPromise = connectPromise;
    }
    sseClientPromise = global._mongoSseClientPromise;
  } else {
    sseClientPromise = connectPromise;
  }
  return sseClientPromise;
}

/**
 * Dedicated connection pool for SSE streams - isolated from the main API pool.
 * Prevents long-lived Change Stream connections from starving other routes.
 */
export async function connectDbForSSE() {
  try {
    const connectedClient = await getSseClientPromise();
    return connectedClient;
  } catch (error) {
    resetSseClient();
    if (logger?.error)
      logger.error("[DB Manager] SSE pool connection failed", {
        error: error.message,
      });
    throw new Error(
      `Failed to establish SSE database connection: ${error.message}`
    );
  }
}

// ============================================================================
// 🔁 EXPONENTIAL BACKOFF WRAPPER (Issue #3258)
// ============================================================================
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

/**
 * Wraps database queries in an automated retry engine to mitigate transient
 * network drops and serverless cold-start timeouts.
 * @param {Function} operation - The async database function to execute.
 * @param {string} context - Optional context for telemetry logging.
 */
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
        logger.warn(
          `[DB Manager] ⚠️ Slow query detected in ${context}. Latency: ${latency.toFixed(2)}ms`
        );
      }
      return result;
    } catch (error) {
      attempt++;
      if (attempt > MAX_RETRIES) {
        if (logger?.error)
          logger.error(`[DB Manager] 💥 Exhausted all retries for ${context}`, {
            error: error.message,
          });
        throw error;
      }

      metrics.retries++;
      if (logger?.warn)
        logger.warn(
          `[DB Manager] 📉 Transient error in ${context}. Retrying ${attempt}/${MAX_RETRIES} in ${delay}ms...`,
          { error: error.message }
        );

      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

// ============================================================================
// 📊 TELEMETRY EXPORT
// ============================================================================
export function getDbMetrics() {
  return {
    activePool: clientPromise ? "connected" : "disconnected",
    ...metrics,
  };
}

export async function disconnectDb() {
  const clientToClose = client;
  mongoClientPromise = null;
  cachedPromise = null;
  indexesEnsured = false;
  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise = null;
  }
  if (clientToClose) {
    await clientToClose.close().catch(() => {});
  }
}

export async function disconnectDbForSSE() {
  resetSseClient();
}

export default clientPromise;
