'use client';

export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

const Map = nextDynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-400">Loading Map Intelligence...</div>
});

export default function LandingPage() {
  const [stats, setStats] = useState({ reports: 0, clusters: 0, resolved: 0 });
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      const { count: clusterCount } = await supabase.from('clusters').select('*', { count: 'exact', head: true });
      const { count: resolvedCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved');
      
      setStats({
        reports: reportCount || 0,
        clusters: clusterCount || 0,
        resolved: resolvedCount || 0
      });
    }
    fetchStats();

    // Realtime subscription
    const channel = supabase.channel('reports-update')
      .on('postgres_changes' as any, { event: 'INSERT', table: 'reports' }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="relative h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-[1000] p-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
              <Shield className="text-blue-400" /> NeighbourWatch
            </h1>
            <p className="text-slate-400 text-sm">Civic Intelligence Platform</p>
          </div>

          <div className="flex gap-4 pointer-events-auto">
            <div className="grid grid-cols-3 gap-8 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl">
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Reports</p>
                <p className="text-xl font-bold text-blue-400">{stats.reports}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Clusters</p>
                <p className="text-xl font-bold text-amber-400">{stats.clusters}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Resolved</p>
                <p className="text-xl font-bold text-emerald-400">{stats.resolved}</p>
              </div>
            </div>
            
            <a href="/report" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-4 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
              <AlertTriangle size={20} /> Report Issue
            </a>
          </div>
        </div>
      </header>

      {/* Main Map */}
      <main className="flex-1 w-full bg-slate-900">
        <Map />
      </main>

      {/* Footer Nav Overlay */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 p-2 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-3xl">
        <a href="/" className="px-6 py-3 rounded-2xl bg-slate-800 text-white font-medium flex items-center gap-2">
          <Shield size={18} /> Live Map
        </a>
        <a href="/dashboard" className="px-6 py-3 rounded-2xl hover:bg-slate-800 text-slate-400 hover:text-white font-medium flex items-center gap-2 transition-all">
          <FileText size={18} /> Admin Dashboard
        </a>
      </footer>
    </div>
  );
}
