import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { db } from '@/lib/firebaseAdmin';
import { callGroq } from '@/lib/ai/groq';

export async function GET(request) {
  try {
    const token = await requireAuth(request);
    
    if (token.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only students can access career recommendations' }, { status: 403 });
    }

    // Fetch the current student's data
    const currentUserDoc = await db.collection('users').doc(token.uid).get();
    if (!currentUserDoc.exists) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }
    const currentUser = currentUserDoc.data();

    // Use Groq AI to generate career paths based on their profile
    const aiPrompt = `You are an AI career counselor. Based on the student's profile, recommend exactly 3 dynamic and modern career paths.
Return ONLY a valid JSON array of objects. Do not use markdown blocks (e.g. \`\`\`json).
Each object MUST have:
- "title": Career title (e.g., "Data Scientist", "UI/UX Designer")
- "description": 1-2 sentence description.
- "matchReason": Why it fits this student's profile.
- "skillsRequired": An array of 3-4 strings representing key skills.

Student Profile:
Name: ${currentUser.displayName || currentUser.email}
Bio: ${currentUser.bio || 'Hardworking student'}
Merit Points: ${currentUser.meritPoints || 0}
XP: ${currentUser.xp || 0}`;

    const aiResponse = await callGroq(aiPrompt, [], token.uid);
    
    let careers = [];
    try {
      const sanitizedResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      careers = JSON.parse(sanitizedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI career response:', aiResponse);
      return NextResponse.json({ success: false, error: 'Failed to generate recommendations' }, { status: 502 });
    }

    return NextResponse.json({ success: true, careers });
  } catch (error) {
    console.error('Career Recommendation Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
