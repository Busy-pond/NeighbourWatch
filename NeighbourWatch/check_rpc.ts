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

async function checkRpc() {
  const { data, error } = await supabase.rpc('get_map_reports');

  if (error) {
    console.error("RPC Error:", error.message);
    return;
  }

  console.log(`RPC returned ${data?.length || 0} reports for the map.`);
  if (data?.length > 0) {
    console.log("Sample row:", data[0]);
  }
}

checkRpc();
