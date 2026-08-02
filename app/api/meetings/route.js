import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { connectDb } from '@/lib/mongodb';
import { AppError } from '@/lib/errors';
import { withErrorHandler } from '@/lib/error-handler';
import { ObjectId } from 'mongodb';

export const GET = withErrorHandler(async (request) => {
  const token = await requireAuth(request);
  const db = await connectDb();
  const url = new URL(request.url);
  
  const query = {};
  
  // Teachers fetch their own meetings
  if (token.role === 'teacher') {
    query.teacherId = token.uid;
  } else if (token.role === 'parent') {
    // Parents fetch meetings they have booked, or available slots for a specific teacher
    const teacherId = url.searchParams.get('teacherId');
    if (teacherId) {
      query.teacherId = teacherId;
      // When parent looks up a teacher, show available slots OR their own booked slots
      query.$or = [
        { status: 'available' },
        { parentId: token.uid }
      ];
    } else {
      query.parentId = token.uid;
    }
  } else {
    // Admin/Institute can see all? For now restrict.
    if (!['admin', 'institute'].includes(token.role)) {
      throw new AppError('Forbidden', 403);
    }
  }

  const meetings = await db.collection('meetings').find(query).sort({ startTime: 1 }).toArray();
  return NextResponse.json(meetings);
});

export const POST = withErrorHandler(async (request) => {
  const token = await requireAuth(request);
  if (token.role !== 'teacher') {
    throw new AppError('Only teachers can create meeting availability', 403);
  }

  const body = await request.json();
  const { startTime, endTime, meetingLink } = body;

  if (!startTime || !endTime) {
    throw new AppError('Start time and end time are required', 400);
  }

  const db = await connectDb();
  
  const meeting = {
    teacherId: token.uid,
    teacherName: token.name || token.displayName || 'Teacher',
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    meetingLink: meetingLink || null,
    status: 'available',
    parentId: null,
    studentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.collection('meetings').insertOne(meeting);
  
  return NextResponse.json({ ...meeting, _id: result.insertedId }, { status: 201 });
});
