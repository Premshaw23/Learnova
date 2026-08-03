import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    const token = await requireAuth(request);
    if (token.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch assignments submitted by other students (anonymized)
    const snapshot = await db.collection('submissions')
      .where('reviewerId', '==', token.uid)
      .where('status', '==', 'pending_review')
      .limit(10)
      .get();

    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Anonymize: remove author's identity
      submittedBy: 'Anonymous Student',
    }));

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('Peer Review GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = await requireAuth(request);
    if (token.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { submissionId, rubricScores, feedback } = await request.json();

    if (!submissionId || !rubricScores || !feedback) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const totalScore = Object.values(rubricScores).reduce((a, b) => a + b, 0);

    const reviewRef = db.collection('peer_reviews').doc();
    await reviewRef.set({
      submissionId,
      reviewerId: token.uid,
      rubricScores,
      feedback,
      totalScore,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    // Mark submission as reviewed
    await db.collection('submissions').doc(submissionId).update({
      status: 'peer_reviewed',
      peerReviewId: reviewRef.id,
    });

    return NextResponse.json({ success: true, reviewId: reviewRef.id, totalScore });
  } catch (error) {
    console.error('Peer Review POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
