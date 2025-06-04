'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UserProfile() {
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hwid, setHwid] = useState('');
  const [error, setError] = useState('');

  // Fetch user data from localStorage and API
  const fetchUserData = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('No user found. Please log in.');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setUsername(user.username);
      setDiscordId(user.discordId);

      // Fetch additional data from /dAuth/v1
      const response = await fetch(`/dAuth/v1?ID=${encodeURIComponent(user.discordId)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to fetch user data');
        return;
      }

      setHwid(data.hwid || 'Not set');
      setJoinDate(new Date(data.createTime * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }));
      setEndDate(new Date(data.endTime * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }));
    } catch (error) {
      setError('Error fetching user data');
    }
  };

  // Handle HWID reset
  const handleResetHwid = async () => {
    if (!discordId) {
      setError('No Discord ID found');
      return;
    }

    try {
      const response = await fetch('/reset-hwid/v1', {
        headers: {
          Authorization: `Bearer ${discordId}`,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to reset HWID');
        return;
      }

      setHwid('');
      setError('');
      alert('HWID reset successfully');
    } catch (error) {
      setError('Error resetting HWID');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <div
      className="min-h-screen text-gray-200 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
        animation: 'gradientShift 15s ease infinite',
        backgroundSize: '400% 400%',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
      }}
    >
      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 5px rgba(161, 0, 255, 0.5); }
          50% { box-shadow: 0 0 15px rgba(161, 0, 255, 0.8); }
          100% { box-shadow: 0 0 5px rgba(161, 0, 255, 0.5); }
        }
        .ripple-button {
          position: relative;
          overflow: hidden;
        }
        .ripple {
          position: absolute;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: rippleEffect 0.6s linear;
          pointer-events: none;
        }
        @keyframes rippleEffect {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>

      {/* Topbar */}
      <nav
        className="fixed top-0 left-0 w-full z-50"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(161, 0, 255, 0.3)',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="container mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <button
                className="ripple-button p-2 rounded-lg text-white font-semibold transition-all duration-300"
                style={{
                  background: 'rgba(50, 50, 50, 0.8)',
                  border: '1px solid rgba(161, 0, 255, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(70, 70, 70, 0.8)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(161, 0, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(50, 50, 50, 0.8)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={(e) => {
                  const button = e.currentTarget;
                  const rect = button.getBoundingClientRect();
                  const ripple = document.createElement('span');
                  ripple.className = 'ripple';
                  ripple.style.left = `${e.clientX - rect.left}px`;
                  ripple.style.top = `${e.clientY - rect.top}px`;
                  button.appendChild(ripple);
                  setTimeout(() => ripple.remove(), 600);
                }}
              >
                Back to Home
              </button>
            </Link>
            <h1
              className="text-xl font-bold tracking-wide text-white"
              style={{ textShadow: '0 0 10px rgba(161, 0, 255, 0.5)' }}
            >
              <span style={{ color: '#a100ff' }}>7Px</span> Profile
            </h1>
          </div>
          <Link href="/">
            <div
              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all duration-300"
              style={{
                background: 'rgba(50, 50, 50, 0.8)',
                border: '1px solid rgba(161, 0, 255, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(70, 70, 70, 0.8)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(161, 0, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(50, 50, 50, 0.8)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5.121 17.804A7 7 0 1112 5a7 7 0 016.879 5.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm-3 7a3 3 0 00-3 3h6a3 3 0 00-3-3z"
                />
              </svg>
              <span className="text-sm text-white">{username || 'User'}</span>
            </div>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto p-8 pt-24 flex justify-center">
        {error ? (
          <p className="text-red-400 animate-pulse">{error}</p>
        ) : (
          <div
            className="flex items-center p-4 rounded-lg max-w-md w-full"
            style={{
              background: 'rgba(50, 50, 50, 0.8)',
              border: '1px solid rgba(161, 0, 255, 0.3)',
              boxShadow: '0 0 20px rgba(161, 0, 255, 0.3)',
              animation: 'glowPulse 2s infinite ease-in-out',
            }}
          >
            <span
              className="text-4xl font-bold text-white mr-4"
              style={{ textShadow: '0 0 5px rgba(161, 0, 255, 0.5)' }}
            >
              7
            </span>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-purple-400">{username || 'Loading...'}</h1>
              <p className="text-sm text-gray-300">Discord ID: {discordId || 'Loading...'}</p>
              <p className="text-sm text-gray-300">Joined: {joinDate || 'Loading...'}</p>
              <p className="text-sm text-gray-300">Subscription Ends: {endDate || 'Loading...'}</p>
              <p className="text-sm text-gray-300">HWID: {hwid}</p>
              <button
                onClick={(e) => {
                  handleResetHwid();
                  const button = e.currentTarget;
                  const rect = button.getBoundingClientRect();
                  const ripple = document.createElement('span');
                  ripple.className = 'ripple';
                  ripple.style.left = `${e.clientX - rect.left}px`;
                  ripple.style.top = `${e.clientY - rect.top}px`;
                  button.appendChild(ripple);
                  setTimeout(() => ripple.remove(), 600);
                }}
                className="ripple-button mt-2 p-2 rounded-lg text-white font-semibold transition-all duration-300"
                style={{
                  background: 'linear-gradient(90deg, #a100ff, #7b00cc)',
                  boxShadow: '0 0 10px rgba(161, 0, 255, 0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Reset HWID
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
