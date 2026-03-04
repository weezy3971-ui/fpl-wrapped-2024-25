
import React, { useState } from 'react';

interface IntroProps {
  onStart: (id: string) => void;
  loading: boolean;
}

const Intro: React.FC<IntroProps> = ({ onStart, loading }) => {
  const [teamId, setTeamId] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamId.trim()) {
      onStart(teamId.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      {/* Interactive Background */}
      <div className="absolute inset-0 grid-pattern"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#00ff85]/5 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full z-10 space-y-10 relative">
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-block px-3 py-1 rounded-sm bg-[#00ff85]/10 border border-[#00ff85]/20 text-[10px] font-black uppercase tracking-[0.5em] text-[#00ff85] mb-4">
            SEASON RECAP
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white leading-[0.85] uppercase">
            FPL<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff85] to-emerald-400">WRAP-UP</span>
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] pt-4">
            Analysis of your managerial legacy
          </p>
        </div>

        <div className="glass rounded-[32px] p-8 shadow-2xl border-white/5 bg-zinc-900/20 backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 relative overflow-hidden">
          
          {/* Loading Animation Overlay */}
          {loading && (
            <div className="absolute inset-0 z-50 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00ff85] shadow-[0_0_20px_#00ff85,0_0_10px_#fff] animate-[scan_1.5s_linear_infinite]" style={{ animationTimingFunction: 'ease-in-out' }} />
              <div className="absolute inset-0 bg-[#00ff85]/5 animate-pulse"></div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="text-center">
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6">Enter Your Team ID</label>
                <div className="relative group">
                  <input 
                    type="number"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    placeholder="000000"
                    disabled={loading}
                    className="w-full bg-transparent border-b border-zinc-800 py-4 text-[#00ff85] focus:outline-none focus:border-[#00ff85] transition-all text-center text-5xl font-['JetBrains_Mono'] font-bold placeholder:text-zinc-800 disabled:opacity-50 disabled:cursor-wait"
                    required
                  />
                  <div className={`absolute -bottom-[1px] left-0 h-[2px] bg-[#00ff85] transition-all duration-700 ${loading ? 'w-full shadow-[0_0_15px_rgba(0,255,133,0.8)]' : 'w-0 group-focus-within:w-full shadow-[0_0_15px_rgba(0,255,133,0.5)]'}`}></div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-6">
                   <div className={`w-1.5 h-1.5 bg-[#00ff85] rounded-full ${loading ? 'animate-ping' : 'animate-pulse'}`}></div>
                   <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                     {loading ? "SCANNING DATABASE..." : "Ready for scanning"}
                   </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <button 
                type="submit"
                disabled={loading}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`group relative w-full overflow-hidden rounded-xl py-5 transition-all duration-300 active:scale-[0.98] disabled:opacity-50
                  ${loading ? 'bg-zinc-800 cursor-wait' : 'bg-white hover:bg-[#00ff85]'}`}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <span className={`text-[11px] font-black uppercase tracking-[0.25em] transition-colors duration-300 ${loading ? 'text-zinc-500' : 'text-black'}`}>
                    {loading ? "INITIALIZING..." : "START RECAP"}
                  </span>
                  {!loading && <span className="text-black group-hover:translate-x-1 transition-transform">→</span>}
                </div>
                
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-[#00ff85] blur-xl opacity-0 transition-opacity duration-300 ${isHovered && !loading ? 'opacity-30' : ''}`}></div>
              </button>
              
              {/* Border Beam - Only visible on hover or loading */}
              {(isHovered || loading) && !loading && (
                <div className="border-beam pointer-events-none absolute -inset-[2px]"></div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Intro;
