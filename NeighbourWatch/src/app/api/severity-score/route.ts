import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { issue_type, description, location } = await req.json();

    if (!issue_type || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are a civic issue severity assessment agent. Given an issue 
type, visual description, and location, score its urgency using 
these rules: life/safety risk = 9-10, infrastructure damage = 
6-8, public inconvenience = 3-5, aesthetic issue = 1-2. 
Input: { "issue_type": "${issue_type}", "description": "${description}", "location": "${location || 'Unknown'}" }. 
Return: { "severity_score": int 1-10, "severity_label": 
"critical"|"high"|"medium"|"low", "reasoning": string, 
"escalate_immediately": boolean }. Only return JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean JSON if Gemini wraps it in code blocks
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
