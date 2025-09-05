import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const labelsPath = path.join(process.cwd(), "public", "labels.json");

export async function POST(req) {
  try {
    const formData = await req.formData();
    const name = formData.get("name");
    const rollNo = formData.get("rollNo");
    const email = formData.get("email");
    const file = formData.get("photo");

    if (!name || !rollNo || !email || !file) {
      return NextResponse.json(
        { success: false, error: "Name, rollNo, email, and photo are required" },
        { status: 400 }
      );
    }

    // Prepare directory
    const dir = path.join(process.cwd(), "public", "labels", name);
    await fs.mkdir(dir, { recursive: true });

    // Save file as 1.jpg
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = path.join(dir, "1.jpg");
    await fs.writeFile(filePath, buffer);

    // Read existing JSON
    let labels = [];
    try {
      const json = await fs.readFile(labelsPath, "utf8");
      labels = JSON.parse(json).filter((u) => u && u.name);
    } catch {}

    // Check if already exists
    const exists = labels.find((u) => u.name === name);
    if (!exists) {
      labels.push({ name, rollNo, email });
      await fs.writeFile(labelsPath, JSON.stringify(labels, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      fileUrl: `/labels/${name}/1.jpg`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
