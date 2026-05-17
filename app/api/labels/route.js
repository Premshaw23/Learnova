import { connectDb } from "@/lib/mongodb";
import { jsonError, jsonSuccess } from "@/lib/api-response";

export async function GET() {
  try {
    const db = await connectDb();
    const users = db.collection("users");

    const allUsers = await users
      .find({}, { projection: { _id: 0 } })
      .toArray();

    return jsonSuccess({ labels: allUsers });
  } catch (err) {
    console.error("Error fetching labels:", err);
    return jsonError("Failed to fetch labels", 500);
  }
}
