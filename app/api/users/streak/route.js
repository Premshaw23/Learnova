import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { db } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const token = await requireAuth(request);
    const userRef = db.collection('users').doc(token.uid);
    
    let streakUpdated = false;
    let currentStreak = 0;

    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) return;
      
      const data = doc.data();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const lastActive = data.lastActiveDate || null;
      currentStreak = data.streak || 0;

      if (lastActive !== today) {
        if (lastActive) {
          const lastDate = new Date(lastActive);
          const currentDate = new Date(today);
          const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak += 1; // Kept streak alive
          } else if (diffDays > 1) {
            currentStreak = 1; // Streak broken, restart
          }
        } else {
          currentStreak = 1; // First time
        }
        
        t.update(userRef, { streak: currentStreak, lastActiveDate: today });
        streakUpdated = true;
      }
    });

    return NextResponse.json({ success: true, streak: currentStreak, streakUpdated });
  } catch (error) {
    console.error('Streak Update Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
