
import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { WrappedData, ChipInfo, PlayerLoyalty, PlayerPerformance } from '../types';

interface WrappedViewProps {
  data: WrappedData;
}

// --- Sound Synth Utility ---
const playSynthSound = (type: 'swoosh' | 'pop' | 'click') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        if (type === 'pop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'swoosh') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.linearRampToValueAtTime(300, now + 0.2);
            gain.gain.setValueAtTime(0.02, now); 
            gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'click') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    } catch (e) {}
};

const TradingCard = ({ player, size = 'large', variant = 'gold' }: { player: PlayerPerformance, size?: 'large' | 'small', variant?: 'gold' | 'silver' }) => {
  const isLarge = size === 'large';
  const isGold = variant === 'gold';
  
  const borderColor = isGold ? 'border-yellow-400/60 shadow-yellow-500/20' : 'border-slate-300/60 shadow-slate-400/20';
  const accentColor = isGold ? 'from-yellow-400/20' : 'from-slate-300/20';
  const labelColor = isGold ? 'text-yellow-400' : 'text-slate-300';

  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const clickTimeoutRef = useRef<number | null>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      setIsHovering(true);
      const card = e.currentTarget.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const x = clientX - card.left;
      const y = clientY - card.top;
      
      const centerX = card.width / 2;
      const centerY = card.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -25; 
      const rotateY = ((x - centerX) / centerX) * 25;

      setRotate({ x: rotateX, y: rotateY });
  };

  const handleEnd = () => {
      setIsHovering(false);
      setRotate({ x: 0, y: 0 });
  };

  const handleClick = () => {
      playSynthSound('pop');
      setIsHovering(true);
      // Give a random "bump" rotation for tactile feedback on click
      setRotate({ x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 });
      
      if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = window.setTimeout(() => {
          setIsHovering(false);
          setRotate({ x: 0, y: 0 });
      }, 800);
  };

  return (
    <div className={`${isLarge ? 'w-64 h-96' : 'w-52 h-80'} float-animation perspective-[1200px] animate-in zoom-in fade-in duration-700`}>
        <div 
            className={`relative w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-[2rem] p-1 shadow-2xl flex flex-col items-center justify-center overflow-hidden border-4 ${borderColor} transition-all duration-300 ease-out cursor-pointer active:scale-95`}
            style={{
                transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isHovering ? 1.1 : 1})`,
                transformStyle: 'preserve-3d',
                boxShadow: isHovering 
                    ? `0 30px 60px -12px rgba(0,0,0,0.5), 0 18px 36px -18px rgba(0,0,0,0.5), ${isGold ? '0 0 40px rgba(250,204,21,0.2)' : '0 0 40px rgba(203,213,225,0.2)'}`
                    : '0 20px 40px -12px rgba(0,0,0,0.3)'
            }}
            onMouseMove={handleMove}
            onMouseLeave={handleEnd}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onClick={handleClick}
        >
            {/* Glossy Sheen Overlay */}
            <div 
                className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
                style={{
                    background: `linear-gradient(${115 + rotate.y}deg, transparent 20%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.0) 60%)`,
                    opacity: isHovering ? 1 : 0.2
                }}
            ></div>

            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
            <div className={`absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b ${accentColor} to-transparent`}></div>
            
            <div className="relative z-10 flex flex-col items-center text-white w-full" style={{ transform: 'translateZ(30px)' }}>
                <div className={`${isLarge ? 'text-xl' : 'text-sm'} font-black italic opacity-50 ${labelColor}`}>{player.position}</div>
                <div className={`${isLarge ? 'text-7xl' : 'text-6xl'} font-black leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500`}>{player.points}</div>
                
                <div className={`${isLarge ? 'w-36 h-36' : 'w-28 h-28'} bg-white/5 rounded-full my-4 flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-inner`}>
                <img 
                    src={`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`} 
                    alt={player.name}
                    className="w-full h-full object-cover scale-110"
                    onError={(e) => { (e.target as any).src = `https://ui-avatars.com/api/?name=${player.name}&background=333&color=fff`; }}
                />
                </div>
                
                <div className={`${isLarge ? 'text-2xl' : 'text-xl'} font-black uppercase tracking-tighter text-center px-4 leading-tight`}>{player.name}</div>
                <div className="flex items-center gap-2 mt-1">
                <div className="h-px w-4 bg-white/20"></div>
                <div className={`${isLarge ? 'text-[10px]' : 'text-[8px]'} font-bold opacity-60 uppercase tracking-widest`}>{player.team}</div>
                <div className="h-px w-4 bg-white/20"></div>
                </div>
            </div>
            
            <div className={`absolute bottom-2 right-4 text-[40px] font-black opacity-10 select-none tracking-tighter italic ${labelColor}`} style={{ transform: 'translateZ(15px)' }}>
                {isGold ? 'MVP' : 'NO.2'}
            </div>
        </div>
    </div>
  );
};

const WrappedView: React.FC<WrappedViewProps> = ({ data }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Determine tactical punchline
  let tacticalPunchline = "Safe, sensible, and slightly boring. You probably own three Arsenal defenders.";
  if (data.metrics.templateScore < 30) tacticalPunchline = "You don't follow the meta. The meta follows you (usually into a red arrow).";
  else if (data.metrics.templateScore > 70) tacticalPunchline = "Do you even have your own thoughts? You're just a Twitter thread in human form.";

  // Theme Determination based on Rank
  const getRankTheme = (rank: number) => {
    if (rank <= 10000) return { main: 'text-yellow-400', border: 'border-yellow-400', bg: 'from-yellow-400', label: 'ELITE' };
    if (rank <= 100000) return { main: 'text-slate-300', border: 'border-slate-300', bg: 'from-slate-300', label: 'WORLD CLASS' };
    if (rank <= 500000) return { main: 'text-orange-400', border: 'border-orange-400', bg: 'from-orange-400', label: 'PRO' };
    return { main: 'text-green-400', border: 'border-green-400', bg: 'from-green-400', label: 'MANAGER' };
  };
  const theme = getRankTheme(data.overallRank);

  const handleDownload = async () => {
    playSynthSound('click');
    if (summaryRef.current) {
      try {
        const canvas = await html2canvas(summaryRef.current, { 
          backgroundColor: '#000000', 
          scale: 5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: summaryRef.current.offsetWidth,
          height: summaryRef.current.offsetHeight,
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('[data-capture-container]') as HTMLElement;
            if (el) {
                el.style.transform = 'none';
                el.style.transition = 'none';
                el.style.animation = 'none';
            }
          }
        });
        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement("a");
        link.href = image;
        link.download = `FPL_Wrapped_${data.teamName.replace(/\s+/g, '_')}.png`;
        link.click();
      } catch (err) {
        console.error("Download failed:", err);
      }
    }
  };

  const slides = [
    // Slide 0: Intro
    <div key="0" className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
      <div className="text-sm uppercase tracking-[0.4em] font-bold opacity-60 animate-pulse">SEASON RECAP</div>
      <h2 className="text-6xl font-black leading-tight tracking-tighter uppercase px-4 break-words text-green-400 drop-shadow-lg">
        {data.teamName}
      </h2>
      <div className="h-1 w-12 bg-white/20 rounded-full"></div>
      <p className="text-xl opacity-80 font-medium">{data.managerName}</p>
    </div>,

    // Slide 1: Points & Rank Comment
    <div key="1" className="flex flex-col items-center justify-center h-full text-center p-8 space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold opacity-60 uppercase tracking-widest">You Scored</h2>
        <div className="text-9xl font-black text-white tracking-tighter leading-none">{data.totalPoints}</div>
      </div>
      <div className="glass p-8 rounded-[40px] border-2 border-white/10 space-y-2 relative overflow-hidden bg-white/5">
        <p className="text-xs font-bold opacity-40 uppercase tracking-[0.2em]">Overall Rank</p>
        <p className={`text-5xl font-black ${theme.main}`}>#{data.overallRank.toLocaleString()}</p>
        <div className="h-px w-full bg-white/10 my-4"></div>
        <p className="text-lg font-black uppercase tracking-widest italic text-white/90">{data.rankComment}</p>
      </div>
    </div>,

    // Slide 2: THE PEAK
    <div key="2" className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
      <h2 className="text-4xl font-black tracking-tighter uppercase">THE <span className="text-green-400">PEAK</span></h2>
      <div className="glass p-10 rounded-[60px] w-full max-w-sm space-y-4 border-4 border-green-400/20 shadow-2xl relative overflow-hidden bg-green-950/20">
        <div className="absolute top-0 right-0 p-4 text-green-400/10 text-9xl font-black select-none pointer-events-none">WIN</div>
        <div className="text-sm font-bold opacity-60 uppercase">Gameweek {data.bestGameweek.gw}</div>
        <div className="text-8xl font-black tracking-tighter leading-none">{data.bestGameweek.points}</div>
        <div className="text-sm font-bold opacity-60 uppercase tracking-widest">POINTS</div>
      </div>
    </div>,

    // Slide 3: THE PIT
    <div key="pit" className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
      <h2 className="text-4xl font-black tracking-tighter uppercase">THE <span className="text-red-600">PIT</span></h2>
      <div className="glass p-10 rounded-[60px] w-full max-w-sm space-y-4 border-4 border-red-900/40 shadow-2xl relative overflow-hidden bg-red-950/20">
        <div className="absolute top-0 right-0 p-4 text-red-500/10 text-9xl font-black select-none pointer-events-none">LOW</div>
        <div className="text-sm font-bold opacity-60 uppercase">Gameweek {data.worstGameweek.gw}</div>
        <div className="text-8xl font-black tracking-tighter leading-none text-red-500">{data.worstGameweek.points}</div>
        <div className="text-sm font-bold opacity-60 uppercase tracking-widest">POINTS</div>
      </div>
      <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">We don't talk about this week.</p>
    </div>,

    // Slide 4: ARROWS
    <div key="arrows" className="flex flex-col items-center justify-center h-full text-center p-8 space-y-8">
       <div className="text-center space-y-2">
         <h2 className="text-4xl font-black tracking-tighter uppercase">THE <span className="text-emerald-400">CLIMB</span></h2>
         <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Rank Movement History</p>
       </div>
       <div className="flex flex-row gap-6 items-center justify-center w-full max-w-md">
           {/* Green Arrows */}
           <div className="flex-1 glass p-6 rounded-[30px] border border-green-500/20 bg-green-950/20 flex flex-col items-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               {/* SVG Arrow Up */}
               <div className="mb-4 p-4 bg-green-500/10 rounded-full border border-green-500/20">
                 <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 19L19 5M19 5H9M19 5V15" />
                 </svg>
               </div>
               <p className="text-6xl font-black text-green-400">{data.arrows.green}</p>
               <p className="text-[9px] font-bold opacity-60 uppercase mt-2">Green Arrows</p>
           </div>
           {/* Red Arrows */}
           <div className="flex-1 glass p-6 rounded-[30px] border border-red-500/20 bg-red-950/20 flex flex-col items-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {/* SVG Arrow Down */}
               <div className="mb-4 p-4 bg-red-500/10 rounded-full border border-red-500/20">
                 <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5l14 14m0 0V9m0 10H9" />
                 </svg>
               </div>
               <p className="text-6xl font-black text-red-500">{data.arrows.red}</p>
               <p className="text-[9px] font-bold opacity-60 uppercase mt-2">Red Arrows</p>
           </div>
       </div>
       <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest max-w-xs leading-relaxed">
           {data.arrows.green > data.arrows.red ? "You spent more time rising than falling. A successful campaign." : "Gravity was not your friend this season."}
       </p>
    </div>,

    // Slide 5: GLOBAL PEAK
    <div key="global-peak" className="flex flex-col items-center justify-center h-full p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter uppercase leading-tight">GLOBAL <span className="text-cyan-400">PEAK</span></h2>
        <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Your Highest Career Reach</p>
      </div>
      
      <div className="w-full max-w-sm">
        <div className="glass p-12 rounded-[50px] text-center border-4 border-cyan-400/20 bg-cyan-950/20 relative overflow-hidden group shadow-[0_20px_60px_-15px_rgba(34,211,238,0.3)]">
          <div className="absolute top-0 right-0 p-6 text-cyan-400/10 text-[120px] font-black italic select-none pointer-events-none">TOP</div>
          <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.4em] mb-4">Highest Overall Rank (GW{data.bestOverallRank.gw})</p>
          <p className="text-7xl font-black tracking-tighter text-white drop-shadow-2xl">#{data.bestOverallRank.rank.toLocaleString()}</p>
          <div className="h-1 w-12 bg-cyan-400/40 mx-auto mt-6 rounded-full"></div>
          <p className="text-xs font-bold opacity-60 mt-4 uppercase tracking-widest text-cyan-200">World Class Territory</p>
        </div>
      </div>
    </div>,

    // Slide 6: BENCH REGRETS
    <div key="bench" className="flex flex-col items-center justify-center h-full p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter uppercase">THE <span className="text-orange-500">BENCH</span></h2>
        <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Points you left behind</p>
      </div>
      
      <div className="w-full max-w-sm space-y-6">
        <div className="glass p-8 rounded-[40px] text-center border-orange-500/20 bg-orange-950/5 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 text-orange-500/10 text-8xl font-black italic select-none pointer-events-none">WARM</div>
          <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-2">Total Benched Points</p>
          <p className="text-9xl font-black tracking-tighter text-white drop-shadow-2xl">{data.totalBenchPoints}</p>
          <div className="h-px w-12 bg-orange-500/30 mx-auto mt-4"></div>
        </div>

        <div className="glass p-8 rounded-[40px] border border-white/10 bg-white/5 relative overflow-hidden">
          <p className="text-center text-[10px] font-black opacity-40 uppercase tracking-widest mb-6">Highest Scoring Bench</p>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-[9px] font-bold opacity-40 uppercase mb-1">Gameweek</p>
              <p className="text-5xl font-black">{data.worstBenchRegret.gw}</p>
            </div>
            <div className="h-12 w-px bg-white/10"></div>
            <div className="text-center">
              <p className="text-[9px] font-bold opacity-40 uppercase mb-1">Points Lost</p>
              <p className="text-5xl font-black text-orange-500">{data.worstBenchRegret.points}</p>
            </div>
          </div>
          <p className="text-center text-[9px] font-bold opacity-30 mt-6 uppercase tracking-widest">A tactical disaster class.</p>
        </div>
      </div>
    </div>,

    // Slide 7: Season MVP
    <div key="6" className="flex flex-col items-center justify-center h-full p-6 space-y-8 relative overflow-hidden">
       <div className="absolute top-10 text-center space-y-1 z-30">
          <h2 className="text-4xl font-black tracking-tighter uppercase">ELITE <span className="text-yellow-500">PERFORMERS</span></h2>
          <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Your highest scoring players</p>
       </div>
       
       <div className="flex flex-row items-center justify-center relative w-full pt-16 gap-[-20px]">
          <div className="z-20 rotate-[-5deg] transition-all duration-500 hover:rotate-0 translate-x-4">
             <TradingCard player={data.mvp} size="large" variant="gold" />
          </div>
          <div className="z-10 rotate-[5deg] transition-all duration-500 hover:rotate-0 -translate-x-4">
             <div className="opacity-95 shadow-2xl">
                <TradingCard player={data.runnerUp} size="small" variant="silver" />
             </div>
          </div>
       </div>
    </div>,

    // Slide 8: DIAMOND HANDS
    <div key="diamond" className="flex flex-col items-center justify-center h-full p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter uppercase">DIAMOND <span className="text-cyan-400">HANDS</span></h2>
        <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Players owned for 15+ Gameweeks</p>
      </div>

      <div className="w-full max-w-xl glass rounded-[2rem] p-6 border border-cyan-500/20 bg-cyan-950/5 relative">
         {data.diamondHands.length > 0 ? (
             <div className="flex flex-wrap justify-center gap-2 max-h-[500px] overflow-hidden content-center">
                 {data.diamondHands.slice(0, 16).map((p, i) => (
                     <div key={i} className="flex flex-col items-center justify-center bg-white/5 p-2 rounded-xl border border-white/5 w-[80px] h-[90px] animate-in zoom-in duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                         <div className="w-6 h-6 rounded-full bg-cyan-900 flex items-center justify-center text-[9px] font-black text-cyan-400 mb-1 border border-cyan-500/30">{p.weeks}</div>
                         <p className="text-[9px] font-bold text-center leading-tight line-clamp-2">{p.name}</p>
                         <p className="text-[7px] opacity-40 mt-1">{p.points}</p>
                     </div>
                 ))}
                 {data.diamondHands.length > 16 && (
                     <div className="flex items-center justify-center bg-cyan-900/20 p-2 rounded-xl border border-cyan-500/20 w-[80px] h-[90px]">
                        <p className="text-xs font-black text-cyan-400">+{data.diamondHands.length - 16}</p>
                     </div>
                 )}
             </div>
         ) : (
             <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                <div className="text-4xl mb-2">📄🙌</div>
                <p className="font-bold uppercase tracking-widest text-xs">Paper Hands Detected</p>
                <p className="text-[9px] mt-1">No players survived 15 weeks.</p>
             </div>
         )}
      </div>
    </div>,

    // Slide 9: CAPTAINCY
    <div key="captain" className="flex flex-col items-center justify-center h-full p-8 space-y-6">
      <h2 className="text-4xl font-black tracking-tighter uppercase text-center">ARMBAND <span className="text-purple-400">MAGIC</span></h2>
      
      {/* Efficiency - Compact Version */}
      <div className="glass px-10 py-6 rounded-[40px] text-center border-purple-500/20 bg-purple-950/10">
          <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.4em] mb-2">Efficiency</p>
          <div className="relative inline-block">
             <span className="text-6xl font-black text-white tracking-tighter">{data.metrics.captaincyEfficiency}%</span>
             <span className="absolute -top-2 -right-6 bg-purple-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Rate</span>
          </div>
      </div>

      {/* Stats List */}
      <div className="w-full max-w-sm glass p-6 rounded-[30px] border border-white/10 bg-white/5 relative overflow-hidden flex flex-col max-h-[40vh]">
         <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-4 text-center">Captaincy Breakdown</p>
         <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {data.captaincyStats.map((stat, idx) => (
                <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-xs font-bold uppercase tracking-wider">{stat.name}</span>
                        <span className="text-xs font-black text-purple-400">{stat.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" 
                           style={{ width: `${stat.percentage}%` }}
                        ></div>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>,

    // Slide 10: CHIP USAGE
    <div key="chips" className="flex flex-col items-center justify-center h-full p-8 space-y-8">
       <h2 className="text-4xl font-black tracking-tighter uppercase text-center">THE <span className="text-blue-400">ARMORY</span></h2>
       <div className="grid grid-cols-2 gap-4 w-full max-w-md">
         {data.chips.length > 0 ? data.chips.map((chip, idx) => (
             <div key={idx} className="glass p-4 rounded-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">{chip.displayName}</p>
                <p className="text-3xl font-black text-white">{chip.points} <span className="text-sm opacity-50">pts</span></p>
                <p className="text-[9px] font-bold opacity-60 uppercase mt-2">Gameweek {chip.gw}</p>
             </div>
         )) : (
             <div className="col-span-2 text-center opacity-50 font-bold uppercase tracking-widest text-xs py-10">No chips used yet</div>
         )}
       </div>
    </div>,
    
    // Slide 11: TACTICAL DNA
    <div key="dna" className="flex flex-col items-center justify-center h-full p-8 space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter uppercase">TACTICAL <span className="text-purple-400">DNA</span></h2>
        <p className="text-sm font-bold opacity-50 uppercase tracking-widest">How you play the game</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
         <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden">
             <div className="flex justify-between items-end mb-4">
                 <div className="text-left">
                     <p className="text-[10px] font-black opacity-60 uppercase tracking-widest text-cyan-400">THE MAVERICK</p>
                     <p className="text-2xl font-black text-cyan-400 leading-none mt-1">{Math.round(100 - data.metrics.templateScore)}%</p>
                 </div>
                 <div className="text-right">
                     <p className="text-[10px] font-black opacity-60 uppercase tracking-widest text-pink-500">TEMPLATE MANAGER</p>
                     <p className="text-2xl font-black text-pink-500 leading-none mt-1">{Math.round(data.metrics.templateScore)}%</p>
                 </div>
             </div>
             
             <div className="relative h-6 bg-white/5 rounded-full overflow-hidden border border-white/10">
                 <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 transition-all duration-1000 ease-out"
                    style={{ width: `${data.metrics.templateScore}%` }}
                 ></div>
                 <div className="absolute inset-y-0 w-1 bg-white shadow-[0_0_10px_white] z-10" style={{ left: `${data.metrics.templateScore}%`, transform: 'translateX(-50%)' }}></div>
             </div>
             
             <div className="mt-6 text-center border-t border-white/10 pt-4">
                 <p className="text-sm font-bold italic opacity-80 leading-relaxed text-purple-200">
                     "{tacticalPunchline}"
                 </p>
             </div>
         </div>
      </div>

      <div className="w-full max-w-sm">
         <div className="glass p-6 rounded-3xl border border-red-500/20 bg-red-500/5 relative">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest text-red-400">KNEEJERK SCORE</p>
                </div>
                <div className="text-5xl font-black text-red-500 tracking-tighter">
                    {data.transferStats.kneeJerkScore}%
                </div>
            </div>
            <div className="w-full bg-red-950/30 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                    className="h-full bg-red-500 shadow-[0_0_15px_red]" 
                    style={{ width: `${data.transferStats.kneeJerkScore}%` }}
                ></div>
            </div>
            <p className="text-center text-[9px] font-bold opacity-40 mt-3 uppercase tracking-widest">
                {data.transferStats.kneeJerkScore > 50 ? "NO PATIENCE FOUND" : "ICE IN THE VEINS"}
            </p>
            <p className="text-center text-[7px] font-medium opacity-30 mt-1 uppercase tracking-widest">
                Transfers made within 72h of previous deadline
            </p>
         </div>
      </div>
    </div>,

    // Slide 12: THE TRANSFER REPORT
    <div key="5" className="flex flex-col items-center justify-center h-full p-8 space-y-4">
      <h2 className="text-4xl font-black tracking-tighter uppercase leading-none text-center">THE <span className="text-green-400">TRANSFER</span><br/>REPORT</h2>
      <div className="w-full space-y-3 max-w-sm">
        <div className="glass p-5 rounded-3xl border-l-4 border-green-500 bg-green-500/5">
          <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">BEST MOVE: THE MASTERSTROKE</p>
          <p className="text-lg font-black">In: {data.transferStats.bestTransfer?.playerIn} <span className="text-green-400">+{data.transferStats.bestTransfer?.impact} pts</span></p>
          <p className="text-[9px] opacity-40 uppercase font-bold mt-1 leading-tight">Gained most points relative to the player sold.</p>
        </div>

        {data.transferStats.immediateRegret && (
          <div className="glass p-5 rounded-3xl border-l-4 border-red-500 bg-red-500/5">
            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1 text-red-400">IMMEDIATE REGRET</p>
            <div className="flex justify-between items-end">
              <div className="flex-1">
                <p className="text-sm font-black text-white">Sold: {data.transferStats.immediateRegret.playerSold}</p>
                <p className="text-[10px] font-bold opacity-60">5-GW Score: {data.transferStats.immediateRegret.soldScore}</p>
              </div>
               <div className="flex items-center justify-center px-2">
                  <span className="text-xs">vs</span>
               </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-black text-white">Bought: {data.transferStats.immediateRegret.playerBought}</p>
                <p className="text-[10px] font-bold opacity-60">5-GW Score: {data.transferStats.immediateRegret.boughtScore}</p>
              </div>
            </div>
             <p className="text-center text-red-500 font-black text-lg mt-2">-{data.transferStats.immediateRegret.pointsDiff} pts lost</p>
             <p className="text-center text-[8px] opacity-40 uppercase mt-1">Measured over next 5 gameweeks</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
           <div className="glass p-3 rounded-2xl text-center bg-white/5">
              <p className="text-[8px] font-bold opacity-40 uppercase">Total Moves</p>
              <p className="text-xl font-black">{data.transferStats.totalTransfers}</p>
           </div>
           <div className="glass p-3 rounded-2xl text-center border border-red-500/20 bg-white/5">
              <p className="text-[8px] font-bold opacity-40 uppercase text-red-400">Total Hits</p>
              <p className="text-xl font-black text-red-500">-{data.transferStats.totalHits}</p>
           </div>
        </div>
      </div>
    </div>,

    // Slide 13: TEAM VALUE REPORT
    <div key="value" className="flex flex-col items-center justify-center h-full p-8 space-y-6">
        <div className="text-center space-y-2">
            <h2 className="text-4xl font-black tracking-tighter uppercase">PORTFOLIO <span className="text-yellow-400">REPORT</span></h2>
            <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Financial Summary</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
            <div className="glass p-6 rounded-3xl border border-yellow-400/20 bg-yellow-950/10 text-center">
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest text-yellow-400 mb-2">CURRENT TEAM VALUE</p>
                <p className="text-6xl font-black text-white tracking-tighter">£{(data.teamValue.current / 10).toFixed(1)}m</p>
                
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                   <div className="text-left">
                       <p className="text-[8px] font-bold opacity-40 uppercase">Lowest Point</p>
                       <p className="text-lg font-bold text-red-400">£{(data.teamValue.lowest / 10).toFixed(1)}m</p>
                       <p className="text-[7px] opacity-30">GW{data.teamValue.lowestGW}</p>
                   </div>
                   <div className="text-right">
                       <p className="text-[8px] font-bold opacity-40 uppercase">Growth</p>
                       <p className={`text-lg font-bold ${data.teamValue.current >= 1000 ? 'text-green-400' : 'text-red-400'}`}>
                           {data.teamValue.current >= 1000 ? '+' : ''}{((data.teamValue.current - 1000)/10).toFixed(1)}m
                       </p>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="glass p-4 rounded-2xl text-center border border-white/5">
                    <p className="text-[8px] font-bold opacity-40 uppercase mb-1">Most Expensive Owned</p>
                    <p className="text-xs font-black truncate text-yellow-200">{data.squadValuation.mostExpensive.name}</p>
                    <p className="text-xl font-black text-white">£{(data.squadValuation.mostExpensive.value / 10).toFixed(1)}m</p>
                </div>
                <div className="glass p-4 rounded-2xl text-center border border-white/5">
                    <p className="text-[8px] font-bold opacity-40 uppercase mb-1">Bargain Bin</p>
                    <p className="text-xs font-black truncate text-zinc-400">{data.squadValuation.cheapest.name}</p>
                    <p className="text-xl font-black text-white">£{(data.squadValuation.cheapest.value / 10).toFixed(1)}m</p>
                </div>
            </div>
        </div>
    </div>,

    // Slide 14: AI Persona
    <div key="9" className="flex flex-col items-center justify-center h-full text-center p-8 space-y-8 bg-black">
      <div className="text-xs font-black text-green-400 animate-pulse tracking-[0.4em]">SCOUT REPORT</div>
      <h2 className="text-6xl font-black italic text-white uppercase leading-none tracking-tighter">{data.aiPersona}</h2>
      <div className="glass p-10 rounded-[50px] italic font-medium opacity-90 text-xl leading-relaxed border-2 border-white/5 mx-4 relative bg-zinc-900/40">
        <span className="absolute -top-4 -left-2 text-6xl text-green-400 opacity-20">"</span>
        {data.aiNarration}
      </div>
    </div>,

    // Slide 15: FINAL SUMMARY CARD
    <div key="10" className="flex flex-col items-center justify-center h-full p-6 wrapped-gradient relative">
      <div className="w-full max-w-[360px] relative">
          <div 
            ref={summaryRef} 
            data-capture-container
            className={`w-full bg-black rounded-[32px] p-8 shadow-2xl border border-white/10 relative overflow-hidden text-center group transition-all duration-500 hover:scale-[1.02] hover:border-[#00ff85]/30 hover:shadow-[0_10px_40px_-10px_rgba(0,255,133,0.3)] shimmer-sweep animate-glow-green`}
          >
             {/* Decorative Background */}
             <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${theme.bg} to-transparent opacity-20 blur-2xl`}></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
             
             {/* Animated Border Beam */}
             <div className="border-beam pointer-events-none absolute -inset-[2px]"></div>

             <div className="relative z-10 flex flex-col items-center gap-5">
                <div className="space-y-1">
                    <p className="text-[9px] font-black tracking-[0.4em] uppercase opacity-40">SEASON RECAP 24/25</p>
                    <h1 className={`text-4xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-lg`}>
                        {data.teamName}
                    </h1>
                    <div className={`inline-block px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest ${theme.main}`}>
                        {data.managerName}
                    </div>
                </div>

                <div className="w-full p-4 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm relative overflow-hidden">
                     <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${theme.bg} to-transparent opacity-50`}></div>
                     <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest mb-1">Overall Rank</p>
                     <p className={`text-5xl font-black tracking-tighter text-white`}>#{data.overallRank.toLocaleString()}</p>
                     <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-2 ${theme.main}`}>{theme.label}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                    {/* 1. Best GW */}
                    <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 text-left">
                        <p className="text-[8px] font-bold opacity-40 uppercase mb-0.5">Best Gameweek</p>
                        <p className="text-lg font-black text-green-400">{data.bestGameweek.points} <span className="text-[8px] opacity-50 text-white">pts</span></p>
                    </div>
                    {/* 2. Worst GW */}
                    <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 text-left">
                        <p className="text-[8px] font-bold opacity-40 uppercase mb-0.5">Worst Gameweek</p>
                        <p className="text-lg font-black text-red-500">{data.worstGameweek.points} <span className="text-[8px] opacity-50 text-white">pts</span></p>
                    </div>
                    {/* 3. Peak Rank */}
                    <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 text-left">
                        <p className="text-[8px] font-bold opacity-40 uppercase mb-0.5">Peak Rank</p>
                        <p className="text-xs font-black text-cyan-400">#{data.bestOverallRank.rank.toLocaleString()}</p>
                    </div>
                    {/* 4. Bench Points */}
                    <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 text-left">
                        <p className="text-[8px] font-bold opacity-40 uppercase mb-0.5">Bench Points</p>
                        <p className="text-lg font-black text-orange-400">{data.totalBenchPoints}</p>
                    </div>
                    {/* 5. Total Transfers */}
                    <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 text-left">
                        <p className="text-[8px] font-bold opacity-40 uppercase mb-0.5">Total Transfers</p>
                        <p className="text-lg font-black text-white">{data.transferStats.totalTransfers}</p>
                    </div>
                    {/* 6. Hits Taken */}
                    <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 text-left">
                        <p className="text-[8px] font-bold opacity-40 uppercase mb-0.5">Hits Taken</p>
                        <p className="text-lg font-black text-white">-{data.transferStats.totalHits}</p>
                    </div>
                     {/* 7. MVP */}
                     <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 text-left">
                        <p className="text-[8px] font-bold opacity-40 uppercase mb-0.5">MVP</p>
                        <p className="text-xs font-black text-yellow-400 truncate">{data.mvp.name}</p>
                    </div>
                    {/* 8. Squad Value (New) */}
                    <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 text-left">
                        <p className="text-[8px] font-bold opacity-40 uppercase mb-0.5">Squad Value</p>
                        <p className="text-lg font-black text-emerald-400">£{(data.teamValue.current / 10).toFixed(1)}m</p>
                    </div>
                     {/* 9. Arrows (New) */}
                     <div className="col-span-2 bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 flex justify-between items-center px-4">
                         <div className="text-center">
                             <p className="text-[8px] font-bold opacity-40 uppercase">Green Arrows</p>
                             <p className="text-lg font-black text-green-400">↗ {data.arrows.green}</p>
                         </div>
                         <div className="h-full w-px bg-white/10 mx-2"></div>
                         <div className="text-center">
                             <p className="text-[8px] font-bold opacity-40 uppercase">Red Arrows</p>
                             <p className="text-lg font-black text-red-500">↘ {data.arrows.red}</p>
                         </div>
                    </div>
                </div>

                <div className="w-full pt-3 mt-1 border-t border-white/5 flex gap-2 items-center justify-center opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    <p className="text-[8px] font-bold uppercase tracking-widest">FPL WRAPPED</p>
                </div>
             </div>
          </div>
      </div>
      
      <div className="mt-8 flex gap-4 pointer-events-auto relative z-50">
         <button onClick={(e) => { e.stopPropagation(); playSynthSound('click'); setCurrentSlide(0); }} className="px-8 py-4 bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95 border border-white/10 shadow-lg cursor-pointer">
            Rewatch
         </button>
         <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className={`px-8 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-lg flex items-center gap-2 cursor-pointer`}>
            <span>Download</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
         </button>
      </div>
      
      {/* Disclaimer on the page bottom */}
      <div className="absolute bottom-4 left-0 right-0 text-center opacity-30 pointer-events-none">
        <p className="text-[9px] font-medium uppercase tracking-widest">
            This app is not officially affiliated with Premier League or Fantasy Premier League.
        </p>
      </div>
    </div>
  ];

  const nextSlide = () => {
      if (currentSlide < slides.length - 1) {
          setCurrentSlide(s => s + 1);
          playSynthSound('swoosh');
      }
  };
  
  const prevSlide = () => {
      if (currentSlide > 0) {
          setCurrentSlide(s => s - 1);
          playSynthSound('swoosh');
      }
  };

  useEffect(() => {
    // Play a pop sound when a key statistic slide is shown
    // Updated indices based on new slide count
    if ([2, 4, 5, 7, 8, 13, 15].includes(currentSlide)) {
        setTimeout(() => playSynthSound('pop'), 500);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentSlide]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none touch-none">
      {currentSlide < slides.length - 1 && (
        <div className="absolute inset-x-6 top-6 flex gap-1 z-[60]">
          {slides.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-white transition-all duration-300 ${i <= currentSlide ? 'opacity-100' : 'opacity-0'}`} 
                style={{ width: i === currentSlide ? '100%' : i < currentSlide ? '100%' : '0%' }} 
              />
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-0 flex z-40">
        <div className="w-1/3 h-full cursor-w-resize" onClick={prevSlide} />
        <div className="w-2/3 h-full cursor-e-resize" onClick={nextSlide} />
      </div>

      <div className="h-full relative z-50 pointer-events-none">
        {slides.map((slide, i) => (
          <div 
            key={i} 
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              i === currentSlide ? 'opacity-100 scale-100 translate-y-0 rotate-0' : 
              i < currentSlide ? 'opacity-0 scale-90 -translate-y-20 -rotate-2' : 
              'opacity-0 scale-105 translate-y-20 rotate-2'
            }`}
          >
            {slide}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WrappedView;
