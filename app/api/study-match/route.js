import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/mongodb';
import { requireAuth } from '@/lib/rbac';
import { db } from '@/lib/firebaseAdmin';
import { callGroq } from '@/lib/ai/groq';

export async function GET(request) {
  try {
    const token = await requireAuth(request);
    
    if (token.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only students can access study matchmaking' }, { status: 403 });
    }

    // Fetch the current student's data
    const currentUserDoc = await db.collection('users').doc(token.uid).get();
    if (!currentUserDoc.exists) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }
    const currentUser = currentUserDoc.data();

    // Fetch other students
    const usersSnapshot = await db.collection('users').where('role', '==', 'student').get();
    
    const otherStudents = usersSnapshot.docs
      .filter(doc => doc.id !== token.uid)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.displayName || data.email?.split('@')[0] || 'Unknown Student',
          bio: data.bio || 'Passionate learner',
          meritPoints: data.meritPoints || 0,
          location: data.location || 'Remote',
          photoURL: data.photoURL || null
        };
      });

    // Use Groq AI to find the best matches
    const aiPrompt = `You are an AI study group matchmaker. Find the 3 best study partners for the current student out of the available candidates.
Return the result STRICTLY as a JSON array of objects, with each object containing "id" (the candidate's id) and "matchReason" (a short 1-sentence reason why they are a good match).
Do not include markdown blocks like \`\`\`json. Return ONLY valid JSON.

Current Student:
Name: ${currentUser.displayName || currentUser.email}
Bio: ${currentUser.bio || 'Passionate learner'}
Merit Points: ${currentUser.meritPoints || 0}
Location: ${currentUser.location || 'Remote'}

Candidates:
${JSON.stringify(otherStudents.map(s => ({ id: s.id, name: s.name, bio: s.bio, merits: s.meritPoints })), null, 2)}`;

    const aiResponse = await callGroq(aiPrompt, [], token.uid);
    let matchedIds = [];
    try {
      const sanitizedResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      matchedIds = JSON.parse(sanitizedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json({ success: false, error: 'AI matchmaking failed to return valid data' }, { status: 502 });
    }

    // Map back the full student details for the matched IDs
    const matchedStudents = matchedIds.map(match => {
      const studentData = otherStudents.find(s => s.id === match.id);
      return {
        ...studentData,
        matchReason: match.matchReason
      };
    }).filter(s => s.name); // Filter out any undefined matches

    return NextResponse.json({ success: true, matches: matchedStudents });
  } catch (error) {
    console.error('Study Matchmaking Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
