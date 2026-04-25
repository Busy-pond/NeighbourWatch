'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Fix for default marker icons in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

import 'leaflet.heat';

export default function Map() {
  const [reports, setReports] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([25.5941, 85.1376]); // Default: Patna
  const supabase = createClient();

  useEffect(() => {
    async function fetchMapData() {
      const { data } = await supabase.rpc('get_map_reports');
      if (data && data.length > 0) {
        setReports(data);
        // Center on the most recent report
        setCenter([data[0].lat, data[0].lng]);
      }
    }
    fetchMapData();

    const channel = supabase.channel('map-sync')
      .on('postgres_changes' as any, { event: 'INSERT', table: 'reports' }, () => fetchMapData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <MapContainer 
      key={`${center[0]}-${center[1]}`} // Force re-render when center changes
      center={center} 
      zoom={13} 
      className="h-full w-screen"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OSM'
      />
      
      <HeatmapLayer points={reports} />
      
      {reports.map((report) => (
        <div key={report.id}>
          {report.cluster_size > 1 && (
            <CircleMarker
              center={[report.lat, report.lng]}
              pathOptions={{ 
                color: report.severity_score > 7 ? '#ef4444' : '#f59e0b',
                fillColor: report.severity_score > 7 ? '#ef4444' : '#f59e0b',
                fillOpacity: 0.2
              }}
              radius={report.cluster_size * 5}
            />
          )}

          <Marker position={[report.lat, report.lng]}>
            <Popup className="custom-popup">
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-slate-900 border-b pb-1 mb-2 capitalize">{report.issue_type}</h3>
                <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                <div className="flex gap-2 text-[10px] font-bold uppercase">
                  <span className={`px-2 py-1 rounded ${report.severity_score > 7 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    Score: {report.severity_score}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {report.department}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        </div>
      ))}
    </MapContainer>
  );
}

function HeatmapLayer({ points }: { points: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const heatPoints = points.map(p => [p.lat, p.lng, p.severity_score / 10]);
    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [points, map]);

  return null;
}
