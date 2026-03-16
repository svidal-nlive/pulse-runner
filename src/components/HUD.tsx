import React, { useEffect, useState } from 'react';
import { gameState } from '../game/GameState';

export const HUD: React.FC = () => {
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [pickups, setPickups] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [pulseCooldownRatio, setPulseCooldownRatio] = useState(1);
  const [pulseReady, setPulseReady] = useState(true);
  const [shieldActive, setShieldActive] = useState(false);
  const [shieldTimer, setShieldTimer] = useState(0);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [scoreMultiplierTimer, setScoreMultiplierTimer] = useState(0);
  const [speedBoostActive, setSpeedBoostActive] = useState(false);
  const [speedBoostTimer, setSpeedBoostTimer] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [highScore, setHighScore] = useState(gameState.highScore);

  useEffect(() => {
    const unsubscribe = gameState.subscribe((state) => {
      setScore(state.score);
      setDistance(state.distance);
      setPickups(state.pickups);
      setIsGameOver(state.isGameOver);
      setPulseCooldownRatio(state.pulseCooldownRatio);
      setPulseReady(state.pulseReady);
      setShieldActive(state.shieldActive);
      setShieldTimer(state.shieldTimer);
      setScoreMultiplier(state.scoreMultiplier);
      setScoreMultiplierTimer(state.scoreMultiplierTimer);
      setSpeedBoostActive(state.speedBoostActive);
      setSpeedBoostTimer(state.speedBoostTimer);
      setIsGameStarted(state.isGameStarted);
      setCountdown(state.countdown);
      setHighScore(state.highScore);
    });
    return unsubscribe;
  }, []);

  const handleRestart = () => {
    gameState.triggerRestart();
  };

  const handleStart = () => {
    gameState.triggerStart();
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full p-6 pointer-events-none flex flex-col justify-between items-start text-white font-mono">
      {!isGameStarted && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto z-50">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] uppercase italic mb-4 text-center">
            Pulse Runner
          </h1>
          <p className="text-xl text-cyan-200 mb-12 opacity-80 uppercase tracking-widest text-center max-w-lg">
            Alter reality to survive the neon grid.
          </p>
          
          <div className="bg-black/50 border border-white/10 p-8 rounded-2xl mb-12 flex flex-col gap-6 max-w-md w-full">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <kbd className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-cyan-400 font-bold">A</kbd>
                <kbd className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-cyan-400 font-bold">D</kbd>
              </div>
              <span className="text-gray-300 uppercase tracking-widest text-sm">Switch Lanes</span>
            </div>
            <div className="flex items-center gap-4">
              <kbd className="bg-gray-800 border border-gray-600 rounded px-4 py-1 text-cyan-400 font-bold w-full text-center">SPACE</kbd>
              <span className="text-gray-300 uppercase tracking-widest text-sm whitespace-nowrap">Pulse Action</span>
            </div>
            <p className="text-gray-400 text-xs mt-2 text-center">
              Pulse alters upcoming obstacles into rewards or safe paths. Use it wisely!
            </p>
          </div>

          <button 
            onClick={handleStart}
            className="px-12 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xl uppercase tracking-widest rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:shadow-[0_0_50px_rgba(34,211,238,0.8)]"
          >
            Start Run
          </button>
        </div>
      )}

      {isGameStarted && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="text-9xl font-bold text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,1)] animate-pulse italic">
            {countdown}
          </div>
        </div>
      )}

      <div className={`w-full flex justify-between items-start transition-opacity duration-500 ${!isGameStarted || (countdown > 0) ? 'opacity-0' : 'opacity-100'}`}>
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] uppercase italic">
            Pulse Runner
          </h1>
          <p className="text-sm text-cyan-200 mt-1 opacity-80 uppercase tracking-widest">Phase 5 Prototype</p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {shieldActive && (
              <div className="inline-block bg-purple-900/50 border border-purple-500/50 px-3 py-1 rounded-full relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-purple-300 text-xs font-bold uppercase tracking-widest">Shield Active</span>
                </div>
                <div 
                  className="absolute bottom-0 left-0 h-full bg-purple-500/20 transition-all duration-100"
                  style={{ width: `${(shieldTimer / 5.0) * 100}%` }}
                />
              </div>
            )}
            {speedBoostActive && (
              <div className="inline-block bg-cyan-900/50 border border-cyan-500/50 px-3 py-1 rounded-full relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-cyan-300 text-xs font-bold uppercase tracking-widest">Speed Boost</span>
                </div>
                <div 
                  className="absolute bottom-0 left-0 h-full bg-cyan-500/20 transition-all duration-100"
                  style={{ width: `${(speedBoostTimer / 1.5) * 100}%` }}
                />
              </div>
            )}
            {scoreMultiplier > 1 && (
              <div className="inline-block bg-yellow-900/50 border border-yellow-500/50 px-3 py-1 rounded-full relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-yellow-300 text-xs font-bold uppercase tracking-widest">{scoreMultiplier}x Multiplier</span>
                </div>
                <div 
                  className="absolute bottom-0 left-0 h-full bg-yellow-500/20 transition-all duration-100"
                  style={{ width: `${(scoreMultiplierTimer / 10.0) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 flex gap-6">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-widest block">Pickups</span>
            <span className="text-xl font-medium text-green-400">{pickups}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-widest block">Distance</span>
            <span className="text-xl font-medium text-purple-400">{distance.toLocaleString()}m</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-widest block">High Score</span>
            <span className="text-xl font-medium text-cyan-400">{highScore.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-widest block">Score</span>
            <span className="text-2xl font-bold text-white">{score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {isGameStarted && !isGameOver && countdown === 0 && (
        <div className="w-full flex justify-center pb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
              <p className="text-sm text-gray-300">Use <span className="text-cyan-400 font-bold">A/D</span> or <span className="text-cyan-400 font-bold">Left/Right Arrows</span> to switch lanes</p>
            </div>
            
            <div className="w-64 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-center">
              <div className="text-xs uppercase tracking-widest mb-2">
                {pulseReady ? (
                  <span className="text-cyan-400 font-bold animate-pulse drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">SPACE to Pulse</span>
                ) : (
                  <span className="text-gray-500">Pulse Recharging</span>
                )}
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full transition-all duration-100 ${pulseReady ? 'bg-cyan-400' : 'bg-cyan-800'}`} 
                  style={{ width: `${pulseCooldownRatio * 100}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto animate-in fade-in duration-500">
          <h2 className="text-6xl md:text-8xl font-bold text-red-500 mb-2 tracking-tighter uppercase italic drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
            System Failure
          </h2>
          <p className="text-red-300 mb-8 uppercase tracking-widest">Hovercraft Destroyed</p>
          
          <div className="bg-black/60 border border-white/10 p-8 rounded-2xl text-center mb-8 min-w-[350px] shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
            {score >= highScore && score > 0 && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
            )}
            
            <div className="mb-6">
              <span className="text-gray-400 uppercase tracking-widest text-sm block mb-1">Final Score</span>
              <span className={`text-5xl font-bold ${score >= highScore && score > 0 ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'text-white'}`}>
                {score.toLocaleString()}
              </span>
              {score >= highScore && score > 0 && (
                <div className="mt-3 inline-block bg-cyan-900/50 border border-cyan-500/50 px-3 py-1 rounded-full">
                  <span className="text-cyan-300 text-xs font-bold uppercase tracking-widest animate-pulse">New High Score!</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between gap-8 mt-6 pt-6 border-t border-white/10">
              <div>
                <span className="text-gray-400 uppercase tracking-widest text-xs block mb-1">Distance</span>
                <span className="text-2xl font-medium text-purple-400">{distance.toLocaleString()}m</span>
              </div>
              <div>
                <span className="text-gray-400 uppercase tracking-widest text-xs block mb-1">Pickups</span>
                <span className="text-2xl font-medium text-green-400">{pickups}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleRestart}
            className="px-10 py-4 bg-red-500 hover:bg-red-400 text-black font-bold text-lg uppercase tracking-widest rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]"
          >
            Reboot System
          </button>
        </div>
      )}
    </div>
  );
};
