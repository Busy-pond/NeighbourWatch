import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { issue_type, severity_score, city, state, cluster_detected } = await req.json();

    if (!issue_type || severity_score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are a government department routing agent for Indian civic 
bodies. Given a classified issue with severity and location, 
determine the correct government body to handle it. 

Select from: 
- PWD (roads/bridges)
- BSPHCL (electricity)
- Nagar Nigam (waste/sanitation)
- Jal Board (water/sewage)
- Traffic Police (encroachment/traffic)
- District Collector (multi-department escalation)

Input: { 
  "issue_type": "${issue_type}", 
  "severity_score": ${severity_score}, 
  "city": "${city || 'Unknown'}", 
  "state": "${state || 'Unknown'}", 
  "cluster_detected": ${!!cluster_detected} 
}. 

Return: { "primary_department": string, 
"department_code": string, "officer_designation": string, 
"escalate_to_collector": boolean, "routing_reason": string, 
"secondary_department": string | null }. 

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
