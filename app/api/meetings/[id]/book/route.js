import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { connectDb } from '@/lib/mongodb';
import { AppError } from '@/lib/errors';
import { withErrorHandler } from '@/lib/error-handler';
import { ObjectId } from 'mongodb';

export const POST = withErrorHandler(async (request, { params }) => {
  const token = await requireAuth(request);
  if (token.role !== 'parent') {
    throw new AppError('Only parents can book meetings', 403);
  }

  const meetingId = params.id;
  const body = await request.json();
  const { studentId } = body;

  const db = await connectDb();
  
  // Find the meeting
  const meeting = await db.collection('meetings').findOne({ _id: new ObjectId(meetingId) });
  if (!meeting) {
    throw new AppError('Meeting slot not found', 404);
  }

  if (meeting.status !== 'available') {
    throw new AppError('This meeting slot is no longer available', 400);
  }

  // Update meeting
  const result = await db.collection('meetings').updateOne(
    { _id: new ObjectId(meetingId), status: 'available' },
    {
      $set: {
        status: 'booked',
        parentId: token.uid,
        parentName: token.name || token.displayName || 'Parent',
        studentId: studentId || null,
        updatedAt: new Date()
      }
    }
  );

  if (result.modifiedCount === 0) {
    throw new AppError('Failed to book meeting. It may have just been booked by someone else.', 409);
  }

  // Send email confirmation (Best effort)
  try {
    const { sendEmail } = await import('@/lib/email/provider');
    const { getUserProfile } = await import('@/lib/firebase-admin');
    const teacherProfile = await getUserProfile(meeting.teacherId);
    const teacherEmail = teacherProfile?.email || null;
    const parentEmail = token.email || token.uid; 
    const dateStr = new Date(meeting.startTime).toLocaleString();
    
    await sendEmail({
      to: [teacherEmail, parentEmail].filter(Boolean).join(','),
      subject: `Meeting Confirmation: Learnova`,
      html: `
        <h3>Meeting Booked Successfully</h3>
        <p>A parent-teacher meeting has been scheduled.</p>
        <p><strong>Time:</strong> ${dateStr}</p>
        <p><strong>Teacher:</strong> ${meeting.teacherName}</p>
        <p><strong>Parent:</strong> ${token.name || 'Parent'}</p>
      `
    });
  } catch (err) {
    console.warn("Failed to send meeting confirmation email:", err);
  }

  return NextResponse.json({ success: true, message: 'Meeting booked successfully' });
});
