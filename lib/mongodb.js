import { MongoClient } from "mongodb";

const options = {
  maxPoolSize: 100,
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
let indexesEnsured = false;

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

let sseClient;
let sseClientPromise;
const sseOptions = {
  maxPoolSize: 30,
};

/**
 * Connects to MongoDB and returns the database instance.
 * Reuses an existing connection pool to minimize handshake overhead.
 * @returns {Promise<import('mongodb').Db>} A MongoDB Db instance for the configured database.
 * @throws {Error} If MONGODB_URI/MONGODB_DB is missing or the connection fails.
 * @example
 * const db = await connectDb();
 * const activities = await db.collection('activities').find().toArray();
 */
async function ensureIndexes(db) {
  try {
    await Promise.all([
      db.collection("rate_limits").createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, background: true }
      ),
      db.collection("pending_operations").createIndex(
        { operationId: 1 },
        { background: true }
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
  } catch {
    // Index creation is best-effort
  }
}

export async function connectDb() {
  const dbName = process.env.MONGODB_DB;

  try {
    const connectedClient = await getClientPromise();
    const db = connectedClient.db(dbName);

    if (!indexesEnsured) {
      indexesEnsured = true;
      ensureIndexes(db);
    }

    return db;
  } catch (error) {
    throw new Error(
      `Failed to establish database connection: ${error.message}`
    );
  }
}

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

/**
 * Dedicated connection pool for SSE streams - isolated from the main API pool.
 * Prevents long-lived Change Stream connections from starving other routes.
 */
export async function connectDbForSSE() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  if (!sseClientPromise) {
    sseClient = new MongoClient(uri, sseOptions);

    // Register event listeners to reset client caching on connection drops
    sseClient.on("close", resetSseClient);
    sseClient.on("timeout", resetSseClient);
    sseClient.on("error", resetSseClient);

    if (process.env.NODE_ENV === "development") {
      if (!global._mongoSseClientPromise) {
        global._mongoSseClientPromise = sseClient.connect();
      }
      sseClientPromise = global._mongoSseClientPromise;
    } else {
      sseClientPromise = sseClient.connect();
    }
  }

  try {
    const connectedClient = await sseClientPromise;
    return connectedClient.db(dbName);
  } catch (error) {
    resetSseClient();
    throw new Error(
      `Failed to establish database connection: ${error.message}`
    );
  }
}

export default clientPromise;
