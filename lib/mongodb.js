import { MongoClient } from "mongodb";

let client;
let clientPromise;

const options = {
  maxPoolSize: 100,
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
export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  // Initialize connection if not already done
  if (!clientPromise) {
    client = new MongoClient(uri, options);
    
    // Handle hot-reloading in development to preserve the connection pool
    if (process.env.NODE_ENV === "development") {
      if (!global._mongoClientPromise) {
        global._mongoClientPromise = client.connect();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      clientPromise = client.connect();
    }
  }

  try {
    const connectedClient = await clientPromise;
    // Uses the database specified in the MONGODB_DB env variable, 
    // or falls back to the default database embedded inside the URI connection string.
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
    throw new Error(`Failed to establish database connection: ${error.message}`);
  }
}