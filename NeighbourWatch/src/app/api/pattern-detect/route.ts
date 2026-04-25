import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { issue_type, location_zone, cluster_history } = await req.json();

    if (!issue_type || !cluster_history) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are a civic issue pattern detection agent. Analyze historical 
cluster data for the given area and issue type. Identify if this 
is a recurring problem, seasonal pattern, or new hotspot. 

Input: { 
  "issue_type": "${issue_type}", 
  "location_zone": "${location_zone || 'Unknown'}", 
  "cluster_history": ${JSON.stringify(cluster_history)} 
}. 

Return: { "pattern_type": "recurring"|"seasonal"|"new"|"isolated", 
"frequency": string, "previous_resolutions": array of strings, 
"predicted_recurrence": boolean, "pattern_summary": string }. 
Only return JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean JSON
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
