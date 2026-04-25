import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { 
      citizen_name, 
      address, 
      issue_description, 
      location, 
      department_name, 
      severity, 
      cluster_evidence 
    } = await req.json();

    if (!citizen_name || !issue_description || !department_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are a legal document drafting agent specializing in Indian 
RTI (Right to Information Act, 2005) applications. Draft a 
formal RTI letter using the following inputs: 

- Citizen Name: ${citizen_name}
- Citizen Address: ${address}
- Issue: ${issue_description}
- Location: ${location}
- Dept: ${department_name}
- Severity: ${severity}
- Cluster Evidence: ${cluster_evidence || 'N/A'}

The letter must: 
1. Cite Section 6(1) of the RTI Act 2005.
2. Request specific actionable information: inspection reports, repair timelines, 
   budget allocations, and responsible officer details.
3. Mention any cluster pattern as evidence of systemic neglect.
4. Be formal, respectful, and legally precise.

Return ONLY the complete letter as plain text, ready to submit.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
