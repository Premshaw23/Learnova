import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { callGroq } from "@/lib/ai/groq";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const token = await requireAuth(request);
    const { code, language } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { success: false, error: "Code and language are required" },
        { status: 400 }
      );
    }

    if (language === "python") {
      // In a real production environment, you would use a secure Docker sandbox or a specialized API like Piston.
      // For this implementation, we will use the AI to simulate execution for basic Python snippets.
      const prompt = `
You are a Python execution engine simulator. 
Execute the following Python code and return ONLY the standard output (stdout) that would be printed to the console.
If there is a syntax error or exception, return the error traceback.
Do not provide any markdown formatting, explanation, or conversational text. Return raw text only.

Code:
${code}
      `;

      let output = await callGroq(prompt, [], token.uid);
      output = output
        .replace(/```python/g, "")
        .replace(/```/g, "")
        .trim();

      return NextResponse.json({ success: true, output });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unsupported language for server-side execution",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Run Code Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
