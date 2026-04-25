import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { runAgentPipeline } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { photoBase64, description, gps } = await req.json();

    if (!gps || !gps.lat || !gps.lng) {
      return NextResponse.json({ error: "GPS location required" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    console.log("Incoming request. Calling 1-Agent LLM flow...");

    // 1. Run the heavy 1-Call Master Agent
    const aiResults = await runAgentPipeline(photoBase64, description, gps);

    // 2. PostGIS Optimization 2: Run Cluster/Pattern Detection without AI
    const { data: nearbyReports } = await supabase.rpc('get_nearby_reports', {
      lat: gps.lat,
      lng: gps.lng,
      radius_meters: 500
    });

    // We filter by the AI's newly assigned issue_type to find matches
    let clusterSize = 1;
    let patternType = 'new';
    
    if (nearbyReports) {
        // Find exact issue matches in the local radius
        const matches = nearbyReports.filter((r: any) => r.issue_type === aiResults.issue_type);
        clusterSize = matches.length + 1;
        
        // Define pattern based on strict numbers (replaces Agent 5 entirely)
        if (clusterSize > 5) {
            patternType = 'recurring';
        } else if (clusterSize > 2) {
            patternType = 'seasonal';
        }
    }

    // 3. Save to Supabase
    const { data: report, error: dbError } = await supabase
      .from('reports')
      .insert({
        photo_url: null, 
        gps_location: `POINT(${gps.lng} ${gps.lat})`,
        description: aiResults.english_translation,
        issue_type: aiResults.issue_type,
        confidence: aiResults.confidence,
        severity_score: aiResults.severity_score,
        severity_label: aiResults.severity_label,
        escalate_immediately: aiResults.escalate_immediately,
        english_translation: aiResults.english_translation,
        key_complaint: aiResults.key_complaint,
        cluster_size: clusterSize,
        pattern_type: patternType,
        primary_department: aiResults.primary_department,
        officer_designation: aiResults.officer_designation,
        escalate_to_collector: aiResults.escalate_to_collector,
        rti_letter: aiResults.rti_letter,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
