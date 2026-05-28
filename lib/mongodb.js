import { MongoClient } from "mongodb";

const options = {
  maxPoolSize: 100,
};

const clientPromise = (async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  if (process.env.NODE_ENV === "development" && global._mongoClientPromise) {
    return global._mongoClientPromise;
  }

  const client = new MongoClient(uri, options);
  const connectedClient = await client.connect();

  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise = Promise.resolve(connectedClient);
  }

  return connectedClient;
})();

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
export async function connectDb() {
  const dbName = process.env.MONGODB_DB;

  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName);
  } catch (error) {
    throw new Error(`Failed to establish database connection: ${error.message}`);
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
    sseClientPromise = null;
    sseClient = null;
    if (process.env.NODE_ENV === "development") {
      global._mongoSseClientPromise = null;
    }
    throw new Error(`Failed to establish database connection: ${error.message}`);
  }
}

export default clientPromise;