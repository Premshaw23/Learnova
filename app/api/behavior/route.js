import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/rbac';
import { db } from '@/lib/firebaseAdmin'; // We will use firebaseAdmin since users are in Firestore

export async function GET(request) {
  try {
    const token = await requireAuth(request);
    
    if (token.role !== 'teacher' && token.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch students from Firestore 'users' collection
    const usersSnapshot = await db.collection('users').where('role', '==', 'student').get();
    
    const students = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || data.email?.split('@')[0] || 'Unknown Student',
        email: data.email,
        meritPoints: data.meritPoints || 0,
        demeritPoints: data.demeritPoints || 0,
        photoURL: data.photoURL || null
      };
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error('Fetch Students Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = await requireAuth(request);
    
    if (token.role !== 'teacher' && token.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { studentId, type, points, reason } = await request.json();

    if (!studentId || !type || !points) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (type !== 'merit' && type !== 'demerit') {
      return NextResponse.json({ success: false, error: 'Invalid point type' }, { status: 400 });
    }

    const userRef = db.collection('users').doc(studentId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('Student not found');
      }
      
      const userData = userDoc.data();
      const currentMerits = userData.meritPoints || 0;
      const currentDemerits = userData.demeritPoints || 0;
      
      if (type === 'merit') {
        transaction.update(userRef, { meritPoints: currentMerits + points });
      } else {
        transaction.update(userRef, { demeritPoints: currentDemerits + points });
      }

      // Log the behavior action in MongoDB for easier querying/analytics
      const mongoDb = await connectDb();
      await mongoDb.collection('behaviorLogs').insertOne({
        studentId,
        teacherId: token.uid,
        type,
        points,
        reason: reason || '',
        createdAt: new Date()
      });
    });

    return NextResponse.json({ success: true, message: 'Points updated successfully' });
  } catch (error) {
    console.error('Update Points Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
