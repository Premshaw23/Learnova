import { MongoClient, Db } from "mongodb";
import logger from "@/utils/logger";

const getMongoUri = () => process.env.MONGODB_URI;

if (!MONGODB_DB) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_DB"');
}

// ============================================================================
// 📊 TELEMETRY STATE (Issue #3258)
// ============================================================================
// Track database stress metrics globally across hot-reloads

if (!global._mongoMetrics) {
  global._mongoMetrics = { totalRequests: 0, retries: 0 };
}

const metrics = global._mongoMetrics;

// ============================================================================
// 🛡️ CONNECTION POOL CONFIGURATION (Tuned for Serverless)
// ============================================================================

const mainPoolOptions = {
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

const getMainClientPromise = (): Promise<MongoClient> => {
  if (!mainClientPromise) {
    if (process.env.NODE_ENV === "development") {
      if (!global._mongoClientPromise) {
        global._mongoClientPromise = new MongoClient(
          MONGODB_URI,
          mainPoolOptions
        ).connect();
      }
      mainClientPromise = global._mongoClientPromise;
    } else {
      mainClientPromise = new MongoClient(
        MONGODB_URI,
        mainPoolOptions
      ).connect();
    }
  }
  return mainClientPromise;
};

let cachedPromise = null;

let sseClientPromise: Promise<MongoClient> | null = null;
let sseClient: MongoClient | null = null;

const getSseClientPromise = (): Promise<MongoClient> => {
  if (!sseClientPromise) {
    if (process.env.NODE_ENV === "development") {
      if (!global._mongoSseClientPromise) {
        global._mongoSseClientPromise = new MongoClient(
          MONGODB_URI,
          ssePoolOptions
        ).connect();
      }
      sseClientPromise = global._mongoSseClientPromise;
    } else {
      sseClientPromise = new MongoClient(MONGODB_URI, ssePoolOptions).connect();
    }
  }
  return sseClientPromise;
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
      `Failed to establish SSE database connection: ${errorMessage}`
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
 * Disconnects the SSE database client.
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
// 🔁 EXPONENTIAL BACKOFF RETRY ENGINE (Issue #3258)
// ============================================================================

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

/**
 * Wraps database queries in an automated retry engine to mitigate transient
 * network drops and serverless cold-start timeouts.
 * @param {Function} operation - The async database function to execute.
 * @param {string} context - Optional context for telemetry logging.
 * @returns {Promise<T>} The result of the operation.
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  context: string = "DB Operation"
): Promise<T> {
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

  throw new Error(
    `[DB Manager] Operation failed after ${MAX_RETRIES} retries`
  );
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

// ============================================================================
// 🔌 DEFAULT EXPORT
// ============================================================================

export const clientPromise = getMainClientPromise();

export default clientPromise;