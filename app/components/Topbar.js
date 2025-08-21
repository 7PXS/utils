'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Topbar({ username, onSignOut }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <nav className="bg-gray-800 p-4 shadow-lg fixed w-full z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary flex items-center">
          <img src="/black-cat.jpg" alt="Surge.lol Logo" className="w-8 h-8 mr-2 rounded-full" />
          surge.lol
        </Link>
        <div className="space-x-4">
          <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
          <Link href="/docs" className="text-gray-300 hover:text-white">Docs</Link>
          <Link href="/stats" className="text-gray-300 hover:text-white">Stats</Link>
          <Link href="/get-access" className="text-gray-300 hover:text-white">Get Access</Link>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="text-gray-300 hover:text-white"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={onSignOut}
            className="text-gray-300 hover:text-white"
          >
            🚪
          </button>
          <Link href="/profile" className="text-gray-300 hover:text-white">
            {username?.[0]?.toUpperCase() || 'U'}
          </Link>
        </div>
      </div>
    </nav>
  );
}
