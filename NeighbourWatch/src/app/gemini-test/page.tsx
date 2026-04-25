'use client';

import { useState } from 'react';

export default function GeminiTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testVision = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini-test');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to fetch' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gemini Vision Classifier Test</h1>
      
      <div className="mb-6 aspect-video relative rounded-lg overflow-hidden border border-gray-200">
        <img 
          src="https://images.unsplash.com/photo-1597405232115-468bf659f816?auto=format&fit=crop&q=80&w=1000" 
          alt="Test Pothole"
          className="object-cover w-full h-full"
        />
        <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 text-xs rounded">
          Test Image: Pothole
        </div>
      </div>

      <button 
        onClick={testVision}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Run Vision Classifier'}
      </button>

      {result && (
        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Gemini Response:</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
