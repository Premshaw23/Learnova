import { MongoClient } from "mongodb";

const options = {
  maxPoolSize: 100,
};

let clientPromise;

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }
  return uri;
};

const getClientPromise = () => {
  if (clientPromise) return clientPromise;

  if (process.env.NODE_ENV === "development" && global._mongoClientPromise) {
    clientPromise = global._mongoClientPromise;
    return clientPromise;
  }

  const client = new MongoClient(getMongoUri(), options);
  clientPromise = client.connect().then((connectedClient) => {
    if (process.env.NODE_ENV === "development") {
      global._mongoClientPromise = Promise.resolve(connectedClient);
    }
    return connectedClient;
  });

  return clientPromise;
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
  const dbName = process.env.MONGODB_DB;

  try {
    const connectedClient = await getClientPromise();
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
  const uri = getMongoUri();
  const dbName = process.env.MONGODB_DB;

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

const defaultClientPromise = process.env.MONGODB_URI
  ? getClientPromise()
  : Promise.resolve(null);

export default defaultClientPromise;