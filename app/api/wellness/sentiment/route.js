import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { callGroq } from '@/lib/ai/groq';

export async function POST(request) {
  try {
    const token = await requireAuth(request);
    
    if (token.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Only students can access this feature' }, { status: 403 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid content is required' }, { status: 400 });
    }

    const aiPrompt = `You are a highly empathetic emotional intelligence analyzer for students. 
Analyze the following journal entry for sentiment and signs of stress/burnout.
Return ONLY a valid JSON object (no markdown block) with exactly these three keys:
- "sentiment": A string, exactly one of "Positive", "Neutral", "Stressed", or "Burned Out".
- "score": A number from 0 (very negative) to 100 (very positive).
- "message": A short, empathetic, supportive 1-2 sentence message for the student based on their entry.

Journal Entry:
"${content}"`;

    const aiResponse = await callGroq(aiPrompt, [], token.uid);
    
    let analysis;
    try {
      const sanitizedResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      analysis = JSON.parse(sanitizedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI sentiment response:', aiResponse);
      return NextResponse.json({ success: false, error: 'Failed to analyze sentiment' }, { status: 502 });
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
