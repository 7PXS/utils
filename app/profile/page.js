'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from './components/Topbar';
import Particles from './components/Particles';

export default function Profile() {
  const [username, setUsername] = useState('User');
  const [discordId, setDiscordId] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hwid, setHwid] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    // Mock user data fetch
    setTimeout(() => {
      setUsername('TestUser');
      setDiscordId('123456789');
      setJoinDate(new Date().toLocaleString());
      setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleString());
      setHwid('HWID-123');
      setKey('KEY-456');
    }, 1000);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleResetHwid = () => {
    setHwid('Resetting...');
    setTimeout(() => {
      setHwid('HWID-789');
      alert('HWID reset successfully');
    }, 1000);
  };

  const handleSignOut = () => {
    alert('Signed out');
    // Implement sign-out logic
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Topbar username={username} onSignOut={handleSignOut} />
      <Particles mousePosition={mousePosition} />
      <div className="container mx-auto px-4 py-16 relative z-10">
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <h1 className="text-4xl font-bold text-center text-primary mb-6">{username}</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-blue-300 mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-3 rounded-md">Discord ID: {discordId}</div>
            <div className="bg-gray-700 p-3 rounded-md">Joined: {joinDate}</div>
            <div className="bg-gray-700 p-3 rounded-md">Subscription Ends: {endDate}</div>
            <div className="bg-gray-700 p-3 rounded-md">HWID: {hwid}</div>
            <div className="bg-gray-700 p-3 rounded-md">Key: {key}</div>
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handleResetHwid}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Reset HWID
            </button>
            <button
              onClick={() => alert('Feature coming soon!')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Add Time to Key
            </button>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-2xl font-bold text-blue-300 mb-4">Helpful Information</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Check your subscription end date to ensure uninterrupted access.</li>
            <li>Use the "Reset HWID" button if you need to change your hardware ID.</li>
            <li>Contact support via Discord for assistance with your key.</li>
            <li>Visit our <Link href="/docs" className="text-primary hover:underline">docs</Link> for detailed guides.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
