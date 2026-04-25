import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({ error: "Missing audio data" }, { status: 400 });
    }

    const prompt = `You are a multilingual transcription and translation agent. 
The user has submitted a spoken complaint in any language. 
Transcribe it accurately. If it is not in English, translate it. 
Return: { "original_language": string, "transcription": string, 
"english_translation": string, "key_complaint": string 
(one sentence summary) }. Only return JSON.`;

    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: mimeType || "audio/webm",
      },
    };

    const result = await model.generateContent([prompt, audioPart]);
    const text = result.response.text();
    
    // Clean JSON if Gemini wraps it in code blocks
    const cleanJson = text.replace(/```json|```/g, "").trim();

    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
