import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const token = await requireAuth(request);
    const db = getAdminDb();
    
    if (token.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only students can earn Pomodoro XP' }, { status: 403 });
    }

    const { minutesFocused } = await request.json();

    if (!minutesFocused || typeof minutesFocused !== 'number') {
      return NextResponse.json({ success: false, error: 'Valid focus minutes required' }, { status: 400 });
    }

    const xpEarned = Math.floor(minutesFocused * 2); // 2 XP per minute of focus

    const userRef = db.collection('users').doc(token.uid);
    
    await db.runTransaction(async (t) => {
      const doc = await t.get(userRef);
      if (!doc.exists) throw new Error('User not found');
      
      const currentXP = doc.data().xp || 0;
      t.update(userRef, { xp: currentXP + xpEarned });
    });

    return NextResponse.json({ success: true, xpEarned, message: `Earned ${xpEarned} XP for focusing!` });
  } catch (error) {
    console.error('Pomodoro XP Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
