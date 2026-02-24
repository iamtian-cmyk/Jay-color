/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Trophy, RefreshCw, Play, Info, ChevronRight } from 'lucide-react';

// --- Types ---
type GameState = 'start' | 'playing' | 'gameover';

interface ColorSet {
  base: string;
  target: string;
  targetIndex: number;
}

// --- Constants ---
const INITIAL_TIME = 45;
const INITIAL_DIFF = 35;
const MIN_DIFF = 1.5;

// --- Utils ---
const getGridSize = (score: number): number => {
  if (score < 5) return 3;
  if (score < 12) return 4;
  if (score < 22) return 5;
  if (score < 35) return 6;
  if (score < 50) return 7;
  if (score < 70) return 8;
  return 9;
};

const generateColorSet = (score: number): ColorSet => {
  const gridSize = getGridSize(score);
  
  // Generate a random base color
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 60) + 20; // 20-80%
  const l = Math.floor(Math.random() * 50) + 25; // 25-75% for better visibility of diffs

  const baseColor = `hsl(${h}, ${s}%, ${l}%)`;
  
  // Create a slight variation
  // Vary H, S, or L randomly
  const diff = Math.max(MIN_DIFF, INITIAL_DIFF - (score * 0.8));
  const variationType = Math.floor(Math.random() * 3); // 0: H, 1: S, 2: L
  
  let targetH = h;
  let targetS = s;
  let targetL = l;

  if (variationType === 0) {
    // Hue variation (harder to see at low saturation)
    const hDiff = diff * 1.5; // Hue needs a bit more numerical diff to be visible
    targetH = Math.random() > 0.5 ? (h + hDiff) % 360 : (h - hDiff + 360) % 360;
  } else if (variationType === 1) {
    // Saturation variation
    targetS = Math.random() > 0.5 ? Math.min(100, s + diff) : Math.max(0, s - diff);
  } else {
    // Lightness variation
    targetL = Math.random() > 0.5 ? Math.min(100, l + diff) : Math.max(0, l - diff);
  }

  const targetColor = `hsl(${targetH}, ${targetS}%, ${targetL}%)`;
  const targetIndex = Math.floor(Math.random() * (gridSize * gridSize));

  return {
    base: baseColor,
    target: targetColor,
    targetIndex,
  };
};

const getRank = (score: number) => {
  if (score < 15) return { title: "色彩新手", color: "text-slate-400" };
  if (score < 30) return { title: "艺术学徒", color: "text-emerald-500" };
  if (score < 50) return { title: "色彩专家", color: "text-blue-500" };
  if (score < 75) return { title: "视觉大师", color: "text-purple-500" };
  return { title: "超凡感知", color: "text-orange-500" };
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [colorSet, setColorSet] = useState<ColorSet | null>(null);
  const [highScore, setHighScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentGridSize = getGridSize(score);

  // Initialize game
  const startGame = () => {
    setScore(0);
    setTimeLeft(INITIAL_TIME);
    setGameState('playing');
    setColorSet(generateColorSet(0));
  };

  const nextLevel = useCallback((currentScore: number) => {
    const newScore = currentScore + 1;
    setScore(newScore);
    setTimeLeft(prev => Math.min(INITIAL_TIME, prev + 1.5)); // Small time bonus
    setColorSet(generateColorSet(newScore));
  }, []);

  const handleBlockClick = (index: number) => {
    if (gameState !== 'playing' || !colorSet) return;

    if (index === colorSet.targetIndex) {
      nextLevel(score);
    } else {
      // Penalty for wrong click
      setTimeLeft(prev => Math.max(0, prev - 4));
    }
  };

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('gameover');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  // Update high score
  useEffect(() => {
    if (gameState === 'gameover' && score > highScore) {
      setHighScore(score);
    }
  }, [gameState, score, highScore]);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#F5F5F0]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-[#F5F5F0]/80 backdrop-blur-md border-b border-[#141414]/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#141414] rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-[#F5F5F0] rotate-45" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter uppercase italic">Color Vision</h1>
        </div>
        
        {gameState === 'playing' && (
          <div className="flex gap-8 items-center">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Score</span>
              <span className="text-2xl font-mono leading-none">{score}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Time</span>
              <span className={`text-2xl font-mono leading-none ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="pt-32 pb-12 px-6 max-w-2xl mx-auto min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {gameState === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none">
                  色彩<br />敏感度<br />挑战
                </h2>
                <p className="text-lg opacity-70 max-w-md mx-auto">
                  面向艺术生的视觉训练。在极其相似的色块中找出差异的那一个。难度随得分递增。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="p-4 border border-[#141414]/10 rounded-2xl bg-white/50">
                  <Info className="w-5 h-5 mb-2 opacity-50" />
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-1">规则</h3>
                  <p className="text-xs opacity-60">点击颜色不同的色块。点错扣除4秒时间。</p>
                </div>
                <div className="p-4 border border-[#141414]/10 rounded-2xl bg-white/50">
                  <Trophy className="w-5 h-5 mb-2 opacity-50" />
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-1">最高分</h3>
                  <p className="text-xs opacity-60">{highScore} 分</p>
                </div>
              </div>

              <button
                onClick={startGame}
                className="group relative inline-flex items-center gap-3 px-12 py-6 bg-[#141414] text-[#F5F5F0] rounded-full text-xl font-bold overflow-hidden transition-transform active:scale-95"
              >
                <div className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10">开始挑战</span>
                <Play className="relative z-10 w-6 h-6 fill-current" />
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && colorSet && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="space-y-8"
            >
              <div 
                className="grid gap-2 aspect-square w-full max-w-[500px] mx-auto p-2 bg-white rounded-3xl shadow-2xl shadow-black/5"
                style={{ gridTemplateColumns: `repeat(${currentGridSize}, 1fr)` }}
              >
                {Array.from({ length: currentGridSize * currentGridSize }).map((_, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBlockClick(i)}
                    className="w-full h-full rounded-xl transition-colors duration-200 cursor-pointer"
                    style={{ 
                      backgroundColor: i === colorSet.targetIndex ? colorSet.target : colorSet.base 
                    }}
                  />
                ))}
              </div>
              
              <div className="flex justify-center gap-4">
                <div className="px-4 py-2 rounded-full border border-[#141414]/10 text-[10px] uppercase tracking-widest font-bold opacity-50">
                  Grid: {currentGridSize}x{currentGridSize}
                </div>
                <div className="px-4 py-2 rounded-full border border-[#141414]/10 text-[10px] uppercase tracking-widest font-bold opacity-50">
                  Diff: {Math.max(MIN_DIFF, INITIAL_DIFF - (score * 0.8)).toFixed(1)}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tighter uppercase">挑战结束</h2>
                <div className="flex justify-center items-baseline gap-2">
                  <span className="text-8xl font-black tracking-tighter">{score}</span>
                  <span className="text-2xl font-bold opacity-50 uppercase">Points</span>
                </div>
                <div className={`text-2xl font-bold ${getRank(score).color}`}>
                  等级：{getRank(score).title}
                </div>
              </div>

              <div className="max-w-md mx-auto p-8 bg-white rounded-[40px] border border-[#141414]/5 space-y-6">
                <div className="flex justify-between items-center pb-4 border-bottom border-[#141414]/5">
                  <span className="text-xs uppercase tracking-widest font-bold opacity-50">最高纪录</span>
                  <span className="text-xl font-mono">{highScore}</span>
                </div>
                
                <div className="space-y-4 text-left">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">色彩差异分析</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-12 rounded-xl" style={{ backgroundColor: colorSet?.base }} />
                    <ChevronRight className="w-4 h-4 opacity-30" />
                    <div className="flex-1 h-12 rounded-xl" style={{ backgroundColor: colorSet?.target }} />
                  </div>
                  <p className="text-xs opacity-60 leading-relaxed">
                    在最后一关，色块之间的色彩差异仅为 <span className="font-bold text-[#141414]">{Math.max(MIN_DIFF, INITIAL_DIFF - (score * 0.8)).toFixed(1)}%</span>。
                    这需要极高的视杆细胞活跃度和大脑色彩处理能力。
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={startGame}
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#141414] text-[#F5F5F0] rounded-full text-lg font-bold transition-transform active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  再试一次
                </button>
                <button
                  onClick={() => setGameState('start')}
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 border border-[#141414] text-[#141414] rounded-full text-lg font-bold transition-transform active:scale-95"
                >
                  返回主页
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Decoration */}
      <footer className="fixed bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
        <div className="text-[10px] font-mono opacity-20 uppercase tracking-[0.2em] [writing-mode:vertical-rl] rotate-180">
          Visual Perception Training v1.0
        </div>
        <div className="text-[10px] font-mono opacity-20 uppercase tracking-[0.2em] [writing-mode:vertical-rl]">
          Art Student Edition
        </div>
      </footer>
    </div>
  );
}
