import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { db } from '@/lib/firebaseAdmin';

// GET /api/tutors
// Fetch online peer tutors and active tutoring help requests
export async function GET(request) {
  try {
    const token = await requireAuth(request);
    if (token.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch student tutors (students who opted in to tutor)
    const tutorsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .where('isTutor', '==', true)
      .limit(10)
      .get();

    const tutors = tutorsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.displayName || data.name || "Peer Tutor",
        rating: data.tutorRating || 5.0,
        subjects: data.tutorSubjects || ["General STEM"],
        xp: data.xp || 0
      };
    });

    // Fetch active help requests
    const requestsSnapshot = await db.collection('tutoring_requests')
      .where('status', '==', 'pending')
      .limit(10)
      .get();

    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, tutors, requests });
  } catch (error) {
    console.error('Tutoring GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/tutors
// Submit a new tutor help request or accept a request
export async function POST(request) {
  try {
    const token = await requireAuth(request);
    if (token.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action, requestId, subject, question } = body;

    if (action === 'create') {
      if (!subject || !question) {
        return NextResponse.json({ error: 'Missing subject or question.' }, { status: 400 });
      }

      const newRequestRef = db.collection('tutoring_requests').doc();
      const newRequest = {
        studentId: token.uid,
        studentName: token.name || 'Anonymous Student',
        subject,
        question,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await newRequestRef.set(newRequest);
      return NextResponse.json({ success: true, request: { id: newRequestRef.id, ...newRequest } });
    }

    if (action === 'accept') {
      if (!requestId) {
        return NextResponse.json({ error: 'Missing requestId.' }, { status: 400 });
      }

      const requestRef = db.collection('tutoring_requests').doc(requestId);
      const doc = await requestRef.get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
      }

      if (doc.data().status !== 'pending') {
        return NextResponse.json({ error: 'Request already accepted or resolved.' }, { status: 400 });
      }

      await requestRef.update({
        status: 'active',
        tutorId: token.uid,
        tutorName: token.name || 'Peer Tutor',
        acceptedAt: new Date().toISOString()
      });

      return NextResponse.json({ success: true, message: 'Request accepted. Live whiteboard session initialized.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Tutoring POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
