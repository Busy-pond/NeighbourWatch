'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Camera, Mic, Send, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Get Location with fallback for Desktop PCs without GPS
      let gpsLocation = { lat: 25.5941, lng: 85.1376 }; // Default: Patna
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        gpsLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (geoErr) {
        console.warn("Geolocation blocked or unavailable. Using default coordinates.", geoErr);
      }

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64: photo?.split(',')[1],
          description,
          gps: gpsLocation
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 2000);
      } else {
        const errorData = await res.json();
        alert(`AI Processing Failed: ${errorData.error}`);
      }
    } catch (err: any) {
      alert("Submission failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 size={80} className="text-emerald-500 mb-4 animate-bounce" />
        <h2 className="text-3xl font-bold text-white mb-2">Report Submitted</h2>
        <p className="text-slate-400">Our AI agents are routing your issue to the correct department.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-32">
      <div className="max-w-xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">New Report</h1>
          <p className="text-slate-400 font-medium">Capture civic issues and our AI will do the rest.</p>
        </header>

        <section className="space-y-6">
          {/* Photo Capture */}
          <div className="relative aspect-square rounded-3xl bg-slate-900 border-2 border-dashed border-slate-700 overflow-hidden group">
            {photo ? (
              <img src={photo} className="w-full h-full object-cover" alt="Capture" />
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition-colors">
                <Camera size={48} className="text-slate-500 mb-2" />
                <span className="text-slate-400 font-bold">Take or Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleCapture} />
              </label>
            )}
            {photo && (
              <button onClick={() => setPhoto(null)} className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-full hover:bg-red-600">
                <Loader2 size={20} className="rotate-45" />
              </button>
            )}
          </div>

          {/* Description / Voice */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">Issue Description</label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What seems to be the problem? (e.g. Broken pipe in sector 5)"
                className="w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 text-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[150px]"
              />
              <button className="absolute bottom-4 right-4 bg-slate-800 p-3 rounded-full text-blue-400 hover:bg-slate-700 transition-colors">
                <Mic size={24} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 text-sm">
            <MapPin size={18} />
            <span>GPS location will be captured automatically.</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || (!photo && !description)}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 rounded-3xl text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
            {loading ? "Processing Intelligence..." : "Submit Report"}
          </button>
        </section>
      </div>
    </div>
  );
}
