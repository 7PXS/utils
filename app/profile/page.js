'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Topbar from '../components/Topbar';
import Particles from '../components/Particles';

export default function Profile() {
  const [username, setUsername] = useState('User');
  const [discordId, setDiscordId] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hwid, setHwid] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    
    // Mock user data fetch
    setTimeout(() => {
      setUsername('TestUser');
      setDiscordId('123456789012345678');
      setJoinDate(new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
      setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
      setHwid('HWID-ABC123XYZ789');
      setKey('KEY-DEF456UVW012');
      setLoading(false);
    }, 1000);
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleResetHwid = () => {
    setHwid('Resetting...');
    setTimeout(() => {
      setHwid('HWID-NEW789ABC123');
      alert('HWID reset successfully');
    }, 1000);
  };

  const handleSignOut = () => {
    alert('Signed out');
    // Implement sign-out logic
  };

  const InfoCard = ({ icon, label, value, color = "blue" }) => (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h3 className={`font-semibold text-${color}-400`}>{label}</h3>
      </div>
      <p className="text-gray-300 font-mono text-sm break-all">{value}</p>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
      <Topbar username={username} onSignOut={handleSignOut} />
      <Particles mousePosition={mousePosition} />
      
      <div className="container mx-auto px-6 py-24 relative z-10 max-w-6xl">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {/* Profile Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-blue-500/25">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                {username}
              </h1>
              <p className="text-muted-foreground">Surge.lol Beta User</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-muted-foreground mt-4">Loading profile...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* User Information Grid */}
            <div>
              <h2 className="text-2xl font-bold text-blue-400 mb-6 flex items-center gap-2">
                <span>👤</span> User Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoCard icon="🎮" label="Discord ID" value={discordId} />
                <InfoCard icon="📅" label="Join Date" value={joinDate} color="green" />
                <InfoCard icon="⏰" label="Subscription Ends" value={endDate} color="yellow" />
                <InfoCard icon="💻" label="Hardware ID" value={hwid} color="purple" />
                <InfoCard icon="🔑" label="API Key" value={key} color="red" />
                <InfoCard icon="⚡" label="Status" value="Active Beta User" color="green" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="glass-card p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-blue-400 mb-6 flex items-center gap-2">
                <span>🛠️</span> Account Actions
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={handleResetHwid}
                  className="btn flex items-center gap-2 hover:scale-105 transition-transform"
                  disabled={hwid === 'Resetting...'}
                >
                  <span>🔄</span>
                  {hwid === 'Resetting...' ? 'Resetting...' : 'Reset HWID'}
                </button>
                
                <button
                  onClick={() => alert('Feature coming soon!')}
                  className="btn-outline flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <span>⏱️</span>
                  Extend Subscription
                </button>
                
                <button
                  onClick={() => alert('Feature coming soon!')}
                  className="btn-outline flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <span>📊</span>
                  Usage Statistics
                </button>
              </div>
            </div>

            {/* Helpful Information */}
            <div className="glass-card p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-blue-400 mb-6 flex items-center gap-2">
                <span>💡</span> Helpful Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✅</span>
                    <div>
                      <h4 className="font-semibold text-gray-300">Subscription Status</h4>
                      <p className="text-sm text-muted-foreground">Check your subscription end date to ensure uninterrupted access.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">🔄</span>
                    <div>
                      <h4 className="font-semibold text-gray-300">HWID Management</h4>
                      <p className="text-sm text-muted-foreground">Use the "Reset HWID" button if you need to change your hardware ID.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 mt-1">💬</span>
                    <div>
                      <h4 className="font-semibold text-gray-300">Support</h4>
                      <p className="text-sm text-muted-foreground">Contact support via Discord for assistance with your key.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 mt-1">📚</span>
                    <div>
                      <h4 className="font-semibold text-gray-300">Documentation</h4>
                      <p className="text-sm text-muted-foreground">
                        Visit our <Link href="/docs" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">documentation</Link> for detailed guides.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center rounded-xl">
                <div className="text-2xl font-bold text-blue-400">30</div>
                <div className="text-sm text-muted-foreground">Days Remaining</div>
              </div>
              <div className="glass-card p-4 text-center rounded-xl">
                <div className="text-2xl font-bold text-green-400">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
              <div className="glass-card p-4 text-center rounded-xl">
                <div className="text-2xl font-bold text-yellow-400">Beta</div>
                <div className="text-sm text-muted-foreground">Access Level</div>
              </div>
              <div className="glass-card p-4 text-center rounded-xl">
                <div className="text-2xl font-bold text-purple-400">Free</div>
                <div className="text-sm text-muted-foreground">Current Plan</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
