import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    const token = await requireAuth(request);
    
    if (token.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only students can access mentors' }, { status: 403 });
    }

    // Fetch all students who have opted into mentorship (for demo, we'll fetch top students by XP)
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .orderBy('xp', 'desc')
      .limit(10)
      .get();
      
    const mentors = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || data.email,
        bio: data.bio || "Enthusiastic Learnova Senior",
        xp: data.xp || 0,
        skills: data.skills || ["React", "Data Science", "UI/UX", "Python"].sort(() => 0.5 - Math.random()).slice(0, 2)
      };
    }).filter(m => m.id !== token.uid); // Exclude self

    return NextResponse.json({ success: true, mentors });
  } catch (error) {
    console.error('Fetch Mentors Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
