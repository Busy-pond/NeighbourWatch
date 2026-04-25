'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileDown, MapPin, AlertCircle, Calendar, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setReports(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const downloadRTI = (report: any) => {
    if (!report.rti_letter) return;
    const blob = new Blob([report.rti_letter], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RTI_${report.issue_type}_${report.id.slice(0, 8)}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Intelligence Dashboard</h1>
            <p className="text-slate-400">Monitoring systemic civic neglect across all sectors.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-xs block uppercase mb-1">Active Cases</span>
              <span className="text-2xl font-bold">{reports.length}</span>
            </div>
            <div className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-xs block uppercase mb-1">Escalated</span>
              <span className="text-2xl font-bold text-amber-500">
                {reports.filter(r => r.severity_score > 8).length}
              </span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-900 rounded-3xl" />)}
          </div>
        ) : (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4">Issue / Severity</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-6">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 h-3 w-3 rounded-full ${
                          report.severity_score > 7 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 
                          report.severity_score > 4 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <div>
                          <p className="font-bold text-lg capitalize mb-1">{report.issue_type}</p>
                          <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <AlertCircle size={12} />
                            <span className="uppercase tracking-widest">{report.severity_label}</span>
                            <span>•</span>
                            <span>Cluster Size: {report.cluster_size}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="bg-slate-800 px-3 py-1 rounded-full text-sm font-medium text-blue-400">
                        {report.department}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="h-2 w-2 rounded-full bg-slate-500" />
                        <span className="capitalize">{report.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-slate-400 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => downloadRTI(report)}
                          className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-colors tooltip"
                          title="Download Legal RTI Draft"
                        >
                          <FileDown size={20} />
                        </button>
                        <button className="p-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl transition-colors">
                          <ArrowUpRight size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
