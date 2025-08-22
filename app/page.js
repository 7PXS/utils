'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion as m, AnimatePresence } from 'framer-motion';
import Topbar from './components/Topbar';
import Particles from './components/Particles';

export default function Home() {
  const [isUnsealed, setIsUnsealed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleUnseal = (e) => {
    e.preventDefault();
    setIsUnsealed(true);
    alert('Unsealed! Click anywhere to continue...');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <Topbar username="User" onSignOut={() => alert('Signed out')} />
      <Particles mousePosition={mousePosition} />
      
      <div className="container mx-auto px-4 py-24 text-center relative z-10">
        <AnimatePresence>
          {!isUnsealed && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <img 
                  src="/black-cat.jpg" 
                  alt="Black Cat Red Eye" 
                  className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg animate-glow" 
                />
                <div className="absolute inset-0 w-32 h-32 rounded-full bg-blue-500/20 animate-pulse"></div>
              </div>
              
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Black Cat Red Eye 😂🤣🤣
              </h1>
              
              <button
                onClick={handleUnseal}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 transition-all duration-300"
              >
                Click to Unseal
              </button>
            </m.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isUnsealed && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                surge.lol by unvhook
              </h1>
              
              <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Tired of levels 888 annoying you? Tired of clans jumping you? Stop trying and start winning comps and big fights with surge.lol, the best legit and rage cw cheat.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link href="/get-access">
                  <m.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                  >
                    Get Beta [FREE]
                  </m.button>
                </Link>
                
                <Link href="/features">
                  <m.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-transparent border-2 border-blue-500 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300"
                  >
                    View Features
                  </m.button>
                </Link>
              </div>
              
              <div className="bg-slate-800/80 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-slate-700/50 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Script Status</h2>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-lg text-slate-300">In-Development</span>
                  <span className="text-red-400 font-semibold bg-red-400/10 px-2 py-1 rounded text-sm">
                    [DETECTED]
                  </span>
                </div>
                <p className="text-sm text-slate-400">Free | shitsploit friendly</p>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
