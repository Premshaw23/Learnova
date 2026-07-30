import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export async function POST(request) {
  try {
    const token = await requireAuth(request);
    if (token.role !== 'student') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subjects, examDates } = await request.json();

    if (!subjects || subjects.length === 0) {
      return NextResponse.json({ error: 'Please provide at least one subject.' }, { status: 400 });
    }

    const prompt = `Subjects list: ${subjects.join(', ')}. Exam dates/deadlines: ${JSON.stringify(examDates)}. Generate a structured weekly study plan matching. Generate a JSON object only. The root object must have a "schedule" field which is an array of daily study blocks. Each daily block must have: "day" (e.g. "Monday"), "tasks" (array of strings, each showing study topic and length). Do not include markdown blocks or extra text. Output valid JSON only.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an AI study scheduler. You create optimal, balanced study plans for students to prevent cramming. Always respond in valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const completionText = chatCompletion.choices[0]?.message?.content || "";
    
    let plan = [];
    try {
        const parsed = JSON.parse(completionText);
        plan = parsed.schedule || parsed.plan || parsed;
    } catch (e) {
        const cleaned = completionText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        plan = parsed.schedule || parsed.plan || parsed;
    }

    return NextResponse.json({ success: true, schedule: plan });
  } catch (error) {
    console.error('Study Planner API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
