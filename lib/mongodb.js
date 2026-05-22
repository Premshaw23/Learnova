import { MongoClient } from "mongodb";

let client;

/**
 * Connects to MongoDB and returns the database instance.
 * Reuses an existing connection via a global client promise to avoid
 * opening multiple connections during hot-reload in development.
 * @returns {Promise<import('mongodb').Db>} A MongoDB Db instance for the configured database.
 * @throws {Error} If MONGODB_URI is missing or the connection fails.
 * @example
 * const db = await connectDb();
 * const users = await db.collection('users').find().toArray();
 */
export async function connectDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  if (!global._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    global._mongoClientPromise = client.connect();
  }

  try {
    const connectedClient = await global._mongoClientPromise;
    const db = connectedClient.db(process.env.MONGODB_DB); // explicit DB name from env
    return db;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}
