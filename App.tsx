import React, { useState } from 'react';
import { WrappedData } from './types';
import { fetchFplData } from './services/fplService';
import { generateManagerAnalysis } from './services/geminiService';
import Intro from './components/Intro';
import WrappedView from './components/WrappedView';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null);

  const startWrapped = async (teamId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Fetch FPL Data
      // Strictly fetch real data. If this fails, we throw to catch block.
      const data = await fetchFplData(teamId);

      // 2. Generate AI Analysis
      const analysis = await generateManagerAnalysis(data);
      
      setWrappedData({
        ...data,
        aiPersona: analysis.persona,
        aiNarration: analysis.summary
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please check your Team ID and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {!wrappedData ? (
        <Intro onStart={startWrapped} loading={loading} />
      ) : (
        <WrappedView data={wrappedData} />
      )}
    </div>
  );
};

export default App;