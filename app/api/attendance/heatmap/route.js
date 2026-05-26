import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const month = searchParams.get("month");

  if (!userId || !month) {
    return Response.json({ attendance: [] });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0, 23, 59, 59);

  try {
    const client = await clientPromise;
    const db = client.db();
    const records = await db
      .collection("attendance")
      .find({
        userId,
        date: { $gte: firstDay, $lte: lastDay },
      })
      .sort({ date: 1 })
      .toArray();

    const attendance = records.map((r) => ({
      date: new Date(r.date).toISOString().split("T")[0],
      status: r.status,
      subject: r.subject || "",
      markedAt: r.markedAt ? new Date(r.markedAt).toISOString() : null,
      _id: r._id.toString(),
    }));

    return Response.json({ attendance });
  } catch {
    return Response.json({ attendance: [] });
  }
}
