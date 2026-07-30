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

    const { text } = await request.json();

    if (!text || text.length < 10) {
      return NextResponse.json({ error: 'Please provide at least 10 characters of text.' }, { status: 400 });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert tutor. Create a JSON array of 3 to 10 highly effective study flashcards based on the user's notes. Each flashcard should have a 'front' and a 'back'. The response must be valid JSON ONLY without any markdown blocks or additional text."
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const completionText = chatCompletion.choices[0]?.message?.content || "";
    
    // Fallback parsing just in case
    let cards = [];
    try {
        const parsed = JSON.parse(completionText);
        if (Array.isArray(parsed)) cards = parsed;
        else if (parsed.flashcards) cards = parsed.flashcards;
        else if (parsed.cards) cards = parsed.cards;
        else cards = Object.values(parsed)[0];
    } catch (e) {
        const cleaned = completionText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) cards = parsed;
        else if (parsed.flashcards) cards = parsed.flashcards;
        else if (parsed.cards) cards = parsed.cards;
        else cards = Object.values(parsed)[0];
    }

    if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error("Failed to parse flashcards.");
    }

    // Standardize output to 'front' and 'back'
    cards = cards.map(c => ({
      front: c.front || c.question || "Empty Question",
      back: c.back || c.answer || "Empty Answer",
    }));

    return NextResponse.json({ success: true, flashcards: cards });
  } catch (error) {
    console.error('Flashcard Generation Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
