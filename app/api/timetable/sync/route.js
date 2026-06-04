import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const body = await parseJSON(request, 1024 * 50); // allow 50kb for timetable data
  const { timetableData } = body;

  if (!timetableData) {
    return jsonError("timetableData is required", 400);
  }

  initFirebaseAdmin();
  const db = getFirestore();
  const userId = decodedToken.uid;
  
  const timetableRef = db.collection("timetables").doc(userId);
  const timetableDoc = await timetableRef.get();
  
  let calendarToken;
  
  if (timetableDoc.exists) {
    calendarToken = timetableDoc.data().calendarToken || crypto.randomUUID();
    await timetableRef.update({
      timetableData,
      calendarToken,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    calendarToken = crypto.randomUUID();
    await timetableRef.set({
      userId,
      calendarToken,
      timetableData,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return jsonSuccess({ success: true, calendarToken }, 200);
});

export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  initFirebaseAdmin();
  const db = getFirestore();
  const userId = decodedToken.uid;
  
  const timetableRef = db.collection("timetables").doc(userId);
  const timetableDoc = await timetableRef.get();
  
  if (!timetableDoc.exists) {
    return jsonSuccess({ timetableData: null, calendarToken: null }, 200);
  }
  
  const data = timetableDoc.data();
  return jsonSuccess({ 
    timetableData: data.timetableData, 
    calendarToken: data.calendarToken 
  }, 200);
});
