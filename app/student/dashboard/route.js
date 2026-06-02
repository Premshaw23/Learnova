import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // 1. Mocking the database/shipping data for your PR submission.
    // In production, this would query your database or Shippo/EasyPost API.
    const shipmentData = {
      // Toggle this to 'true' to test the locked view, or 'false' to test the unlocked dashboard
      locked: true, 
      trackingUrl: "https://go.shippo.com/track/1Z999AA10123456784", 
    };

    // 2. Send the response back to your app/student/dashboard/page.js file
    return NextResponse.json(shipmentData);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check shipping status" }, 
      { status: 500 }
    );
  }
}