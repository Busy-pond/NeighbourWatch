import { GoogleGenerativeAI } from "@google/generative-ai";

const keys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callGemini(prompt: string, imageBase64: string | null = null) {
  if (keys.length === 0) throw new Error("No Gemini keys configured in .env.local");

  const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
  
  for (const key of keys) {
    for (const modelString of models) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const geminiModel = genAI.getGenerativeModel({ model: modelString });
        
        const parts: any[] = imageBase64 
          ? [{ inlineData: { data: imageBase64, mimeType: 'image/jpeg' }}, { text: prompt }]
          : [{ text: prompt }];
          
        const result = await geminiModel.generateContent(parts);
        return result.response.text();
        
      } catch (err: any) {
        if (err.message?.includes('429')) {
          console.warn(`[API] 429 Error on ${modelString} with key ending in ${key.slice(-4)}. Retrying in 5s...`);
          await sleep(5000); 
          continue;
        }
        if (err.message?.includes('404')) {
          console.warn(`[API] 404 Error on ${modelString}. Falling back to next model...`);
          continue; 
        }
        if (err.message?.includes('503')) {
          console.warn(`[API] 503 Overload on ${modelString}. Waiting 2s...`);
          await sleep(2000);
          continue;
        }
        throw err;
      }
    }
  }
  throw new Error('All Gemini keys and fallback models exhausted');
}

export interface PipelineResult {
  issue_type: string;
  confidence: number;
  visual_description: string;
  severity_score: number;
  severity_label: string;
  escalate_immediately: boolean;
  english_translation: string;
  key_complaint: string;
  pattern_type: string;
  cluster_detected: boolean;
  cluster_size: number;
  primary_department: string;
  officer_designation: string;
  escalate_to_collector: boolean;
  rti_letter: string;
}

export async function runAgentPipeline(
  photoBase64: string | null,
  descriptionInput: string,
  gps: { lat: number; lng: number }
): Promise<PipelineResult> {
  console.log("Running highly optimized 1-call Batch Agent...");

  const MASTER_PROMPT = `
    You are a civic issue AI for Indian cities.
    Analyze this image and complaint description: "${descriptionInput}".
    Return ONLY a valid JSON object, no markdown, no explanation:
    {
      "issue_type": "pothole|broken_streetlight|garbage|sewage|encroachment|flooding|other",
      "confidence": 0.95,
      "visual_description": "brief description under 20 words",
      "severity_score": 7,
      "severity_label": "high",
      "escalate_immediately": false,
      "english_translation": "translated complaint here",
      "key_complaint": "one sentence summary",
      "primary_department": "PWD|Nagar Nigam|Jal Board|BSPHCL|Traffic Police|District Collector",
      "officer_designation": "Executive Engineer",
      "escalate_to_collector": false,
      "rti_letter": "To,\\nThe Public Information Officer,\\n[Department],\\n[City]\\n\\nSub: Application under RTI Act 2005, Section 6(1)...\\n[full letter here]"
    }
  `;

  // Optimization 1/3: 7 agents -> 1 API call
  const rawResponse = await callGemini(MASTER_PROMPT, photoBase64);
  
  let data: any = {};
  try {
      data = JSON.parse(rawResponse.replace(/```json|```/gi, "").trim());
  } catch (e) {
      console.error("Failed to parse Gemini JSON", rawResponse);
      throw new Error("AI returned malformed data.");
  }

  // NOTE: Elements like pattern_type and cluster_size are injected afterwards by the route.ts database logic!
  return {
    issue_type: data.issue_type || 'other',
    confidence: data.confidence || 1.0,
    visual_description: data.visual_description || '',
    severity_score: data.severity_score || 5,
    severity_label: data.severity_label || 'medium',
    escalate_immediately: data.escalate_immediately || false,
    english_translation: data.english_translation || descriptionInput,
    key_complaint: data.key_complaint || descriptionInput,
    pattern_type: 'new', // override via SQL later
    cluster_detected: false, // override via SQL later
    cluster_size: 1, // override via SQL later
    primary_department: data.primary_department || 'Local Admin',
    officer_designation: data.officer_designation || 'Nodal Officer',
    escalate_to_collector: data.escalate_to_collector || false,
    rti_letter: data.rti_letter || 'RTI logic failed to compile.'
  };
}
