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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
      <Topbar username="User" onSignOut={() => alert('Signed out')} />
      <Particles mousePosition={mousePosition} />
      
      {/* Main content */}
      <div className="container mx-auto px-6 py-16 text-center relative z-10 max-w-7xl">
        <AnimatePresence>
          {!isUnsealed && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                <img 
                  src="/black-cat.jpg" 
                  alt="Black Cat Red Eye" 
                  className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-2xl shadow-blue-500/25 animate-glow" 
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-blue-600/20 animate-pulse"></div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent leading-tight">
                Black Cat Red Eye 😂🤣🤣
              </h1>
              
              <button
                onClick={handleUnseal}
                className="btn animate-gradient hover:scale-105 transition-transform duration-200"
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
              className="space-y-12"
            >
              {/* Hero section */}
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 bg-clip-text text-transparent leading-none">
                  surge.lol by unvhook
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Tired of levels 888 annoying you? Tired of clans jumping you? Stop trying and start winning comps and big fights with surge.lol, the best legit and rage cw cheat.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <m.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/get-access" className="btn inline-block">
                    Get Beta [FREE]
                  </Link>
                </m.div>
                
                <m.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/features" className="btn-outline inline-block">
                    View Features
                  </Link>
                </m.div>
              </div>

              {/* Status card */}
              <div className="max-w-2xl mx-auto">
                <div className="glass-card p-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                    <h2 className="text-2xl font-bold text-yellow-400">Script Status</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-lg text-gray-300">In-Development</span>
                      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-semibold border border-red-500/30">
                        [DETECTED]
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                        Free
                      </span>
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
                        Shitsploit Friendly
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                <m.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-semibold text-blue-400 mb-2">Lightning Fast</h3>
                  <p className="text-muted-foreground">Optimized performance for competitive gameplay</p>
                </m.div>

                <m.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-400 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-green-400 mb-2">Secure & Safe</h3>
                  <p className="text-muted-foreground">Advanced protection and detection avoidance</p>
                </m.div>

                <m.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold text-red-400 mb-2">Precision Aim</h3>
                  <p className="text-muted-foreground">Dominate your opponents with perfect accuracy</p>
                </m.div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
