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

    const aiPrompt = `You are a visual learning AI that converts text/notes into structured mind map data.
Analyze the following text and extract key concepts, creating a graph of nodes and edges.
Return ONLY a valid JSON object (no markdown block) with exactly these two keys:
- "nodes": An array of objects, each containing:
  - "id": a unique string ID (e.g., "1", "2").
  - "data": an object with a "label" key containing the concept text.
  - "position": an object with "x" and "y" coordinates (arrange them hierarchically, e.g., root at x: 250, y: 0, children branching out).
  - "type": "default", "input" (for root), or "output" (for leaves).
- "edges": An array of objects, each containing:
  - "id": a unique string ID (e.g., "e1-2").
  - "source": the ID of the parent node.
  - "target": the ID of the child node.
  - "animated": boolean (set true for dynamic feel).

Content:
"${content}"`;

    const aiResponse = await callGroq(aiPrompt, [], token.uid);
    
    let mindmapData;
    try {
      const sanitizedResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      mindmapData = JSON.parse(sanitizedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI mindmap response:', aiResponse);
      return NextResponse.json({ success: false, error: 'Failed to generate mind map data' }, { status: 502 });
    }

    return NextResponse.json({ success: true, mindmapData });
  } catch (error) {
    console.error('Mind Map Generation Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
