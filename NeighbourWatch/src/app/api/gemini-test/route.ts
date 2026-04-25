import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';

export async function GET() {
  // Hello-world vision call with a sample image (pothole)
  const imageUrl = "https://images.unsplash.com/photo-1597405232115-468bf659f816?auto=format&fit=crop&q=80&w=1000";
  
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const imagePart = {
      inlineData: {
        data: Buffer.from(buffer).toString("base64"),
        mimeType: "image/jpeg",
      },
    };

    const prompt = `You are a visual issue classifier for a civic reporting system. 
Analyze the uploaded image and identify the type of urban/civic 
problem shown. Classify it into one of these categories: 
pothole, broken streetlight, garbage overflow, sewage leak, 
encroachment, damaged road, flooding, illegal dumping, or other. 
Return a JSON object with: { "issue_type": string, "confidence": 
float 0-1, "visual_description": string (max 30 words), 
"severity_hint": "low" | "medium" | "high" }. Only return JSON.`;

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    // Clean JSON if Gemini wraps it in code blocks
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
