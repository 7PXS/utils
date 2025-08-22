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
    <div className="relative min-h-screen overflow-hidden">
      <Topbar username="User" onSignOut={() => alert('Signed out')} />
      <Particles mousePosition={mousePosition} />
      <div className="container mx-auto px-4 py-16 text-center relative z-10">
        <AnimatePresence>
          {!isUnsealed && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-4"
            >
              <img src="/black-cat.jpg" alt="Black Cat Red Eye" className="w-32 h-32 rounded-full border-4 border-primary" />
              <h1 className="text-4xl font-bold text-primary">Black Cat Red Eye 😂🤣🤣</h1>
              <button
                onClick={handleUnseal}
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold shadow-lg hover:shadow-blue-500/30"
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
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                surge.lol by unvhook
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Tired of levels 888 annoying you? Tired of clans jumping you? Stop trying and start winning comps and big fights with surge.lol, the best legit and rage cw cheat.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <m.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold shadow-lg"
                >
                  <Link href="/get-access">Get Beta [FREE]</Link>
                </m.button>
                <m.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-transparent border-2 border-blue-500 text-blue-300 hover:bg-blue-500/10 px-6 py-3 rounded-lg text-lg font-semibold"
                >
                  <Link href="/features">View Features</Link>
                </m.button>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">Script Status</h2>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-lg text-gray-300">In-Development</span>
                  <span className="text-red-500 font-semibold">[DETECTED]</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Free | shitsploit friendly</p>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
