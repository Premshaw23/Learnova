import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/rbac';

export async function GET(request) {
  try {
    const token = await requireAuth(request);
    
    const db = await connectDb();
    const collection = db.collection('assignments');

    let assignments = [];
    
    // Teachers/Admins can see all assignments
    if (token.role === 'teacher' || token.role === 'admin') {
      assignments = await collection.find({}).sort({ submittedAt: -1 }).toArray();
    } else {
      // Students can only see their own assignments (without originality scores)
      assignments = await collection.find({ studentId: token.uid }).sort({ submittedAt: -1 }).toArray();
      // Mask originality data for students
      assignments = assignments.map(a => ({
        _id: a._id,
        assignmentId: a.assignmentId,
        title: a.title,
        content: a.content,
        submittedAt: a.submittedAt,
        status: 'Submitted'
      }));
    }

    return NextResponse.json({ success: true, assignments });

  } catch (error) {
    console.error('Fetch Assignments Error:', error);
    const status = error.statusCode || 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status }
    );
  }
}
