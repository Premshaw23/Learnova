import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET(req) {
  try {
    initAdmin();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Only allow admin and institute roles to read settings
    if (!["admin", "institute"].includes(decodedToken.role)) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const db = getFirestore();
    const settingsDoc = await db.collection("settings").doc("data-retention").get();
    
    let config = {
      attendanceRetentionMonths: 24, // default 2 years
      biometricPurgeMonths: 12 // default 1 year of inactivity
    };

    if (settingsDoc.exists) {
      config = { ...config, ...settingsDoc.data() };
    }

    return NextResponse.json({ config }, { status: 200 });
  } catch (err) {
    console.error("Error fetching data retention settings:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    initAdmin();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);

    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only Super Admins can update policies" }, { status: 403 });
    }

    const body = await req.json();
    const { attendanceRetentionMonths, biometricPurgeMonths } = body;

    if (typeof attendanceRetentionMonths !== "number" || typeof biometricPurgeMonths !== "number") {
      return NextResponse.json({ error: "Invalid data types for months" }, { status: 400 });
    }

    const db = getFirestore();
    await db.collection("settings").doc("data-retention").set({
      attendanceRetentionMonths,
      biometricPurgeMonths,
      updatedAt: new Date(),
      updatedBy: decodedToken.uid
    }, { merge: true });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error updating data retention settings:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
