import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key: string) => {
  const line = env.split('\n').find(l => l.startsWith(key));
  return line ? line.split('=')[1].trim() : '';
};

const supabase = createClient(
  getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY')
);

async function check() {
  const { data, error } = await supabase
    .from('reports')
    .select('id, issue_type, primary_department, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("DB Error:", error.message);
    return;
  }

  if (data.length === 0) {
    console.log("No reports found in table 'reports'.");
    return;
  }

  console.log(`Found ${data.length} recent reports:`);
  data.forEach((r, i) => {
    console.log(`${i+1}. [${r.issue_type}] Dept: ${r.primary_department} Created: ${r.created_at}`);
  });
}

check();
