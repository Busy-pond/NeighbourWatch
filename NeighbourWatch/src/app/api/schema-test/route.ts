import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test connection by fetching departments
    const { data, error } = await supabase
      .from('departments')
      .select('*');

    if (error) throw error;

    return NextResponse.json({ 
      status: 'success', 
      message: 'Supabase connection working',
      departments: data 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
