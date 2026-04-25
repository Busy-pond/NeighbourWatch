import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, issue_type, recent_reports } = await req.json();

    if (lat === undefined || lng === undefined || !issue_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are a geospatial clustering agent. Given a GPS coordinate 
and issue type, determine if this report clusters with recent 
reports in a 500m radius. 

Input: { 
  "lat": ${lat}, 
  "lng": ${lng}, 
  "issue_type": "${issue_type}", 
  "recent_reports": ${JSON.stringify(recent_reports || [])} 
}. 

Determine if a cluster exists (3+ similar issues within 500m in 30 days). 
Return: { "cluster_detected": boolean, "cluster_size": int, 
"cluster_center": { "lat": float, "lng": float }, 
"cluster_age_days": int, "recommendation": string }. 
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
