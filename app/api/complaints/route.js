import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";

export async function POST(req) {
  try {
    const body = await req.json();
    const { category, subject, description, priority } = body;

    // Validation
    if (!category || !subject || !description || !priority) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const db = await connectDb();

    await db.collection("complaints").insertOne({
      category,
      subject,
      description,
      priority,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "Complaint submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}