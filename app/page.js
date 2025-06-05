'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

// Topbar component to handle useSearchParams
function Topbar({ username }) {
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get('from') === 'profile';

  return (
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
          {fromProfile && (
            <Link href="/profile">
              <button
                className="ripple-button p-2 rounded-lg text-white font-semibold transition-all duration-300"
                style={{
                  background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))',
                  border: '1px solid rgba(161, 0, 255, 0.2)',
                  boxShadow: 'var(--glow)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.2)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(161, 0, 255, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'var(--glow)';
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
                Back to Profile
              </button>
            </Link>
          )}
          <img
            src="/app/nebulaText.ico"
            alt="Nebula"
            className="h-6"
            style={{ filter: 'drop-shadow(0 0 10px rgba(161, 0, 255, 0.5))' }}
          />
        </div>
        <Link href="/profile?from=dashboard">
          <div
            className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all duration-300"
            style={{
              background: 'rgba(50, 50, 50, 0.8)',
              border: '1px solid rgba(161, 0, 255, 0.2)',
              boxShadow: 'var(--glow)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(70, 70, 70, 0.8)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(161, 0, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(50, 50, 50, 0.8)';
              e.currentTarget.style.boxShadow = 'var(--glow)';
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
  );
}

export default function StatusDashboard() {
  const [lastUpdated, setLastUpdated] = useState('');
  const [logs, setLogs] = useState([]);
  const [executors, setExecutors] = useState([]);
  const [robloxVersion, setRobloxVersion] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [discordId, setDiscordId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  // Format timestamp
  const getFormattedTimestamp = () => {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  };

  // Format date for display
  const getFormattedDate = () => {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
      timeZone: 'America/Los_Angeles',
    }) + ' PDT';
  };

  // Update dashboard last updated timestamp
  const updateTimestamp = () => {
    setLastUpdated(getFormattedDate());
  };

  // Add or update log entry
  const addOrUpdateLogEntry = (message, type = 'info', executorName = null) => {
    const timestamp = getFormattedTimestamp();
    const icon = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
    }[type] || 'ℹ️';

    setLogs((prevLogs) => {
      const existingLogIndex = prevLogs.findIndex(
        (log) =>
          log.message.includes(`Executor "${executorName}"`) &&
          (log.type === 'success' || log.type === 'error')
      );

      if (existingLogIndex !== -1 && executorName) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = {
          ...updatedLogs[existingLogIndex],
          time: timestamp,
          icon,
        };
        return updatedLogs;
      } else {
        return [
          ...prevLogs,
          { time: timestamp, message, type, icon },
        ];
      }
    });
  };

  // Check authentication and load user data
  const checkAuth = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      console.log('No user found in localStorage');
      setIsAuthenticated(false);
      return false;
    }

    try {
      const user = JSON.parse(storedUser);
      console.log('Checking auth for user:', { discordId: user.discordId, username: user.username });
      const response = await fetch(`/login/v1?ID=${encodeURIComponent(user.discordId)}&username=${encodeURIComponent(user.username)}`);
      const data = await response.json();
      console.log('Auth response:', { status: response.status, data });

      if (!response.ok || !data.success) {
        console.log('Auth failed:', data.error || 'Authentication failed');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setError(data.error || 'Authentication failed');
        return false;
      }

      setUsername(user.username);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Error checking authentication:', error.message);
      setError('Error checking authentication');
      setIsAuthenticated(false);
      return false;
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/login/v1?ID=${encodeURIComponent(discordId)}&username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify({ discordId, username }));
      setIsAuthenticated(true);
      addOrUpdateLogEntry(`User ${username} logged in successfully`, 'success');
    } catch (error) {
      setError('An error occurred during login');
    }
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/register/v1?ID=${encodeURIComponent(discordId)}&time=30d&username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Registration failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify({ discordId, username }));
      setIsAuthenticated(true);
      addOrUpdateLogEntry(`User ${username} registered successfully`, 'success');
    } catch (error) {
      setError('An error occurred during registration');
    }
  };

  // Fetch Roblox Windows version
  const fetchRobloxVersion = async () => {
    try {
      const response = await fetch('https://whatexpsare.online/api/versions/current', {
        headers: { 'User-Agent': 'WEAO-3PService' },
      });
      const data = await response.json();
      if (!response.ok) {
        addOrUpdateLogEntry(`Failed to fetch Roblox version: ${data.error || 'Unknown error'}`, 'error');
        throw new Error(`HTTP error: ${response.status}`);
      }
      setRobloxVersion(data.Windows);
    } catch (error) {
      addOrUpdateLogEntry(`Failed to fetch Roblox version: ${error.message}`, 'error');
    }
  };

  // Fetch executors
  const fetchExecutors = async () => {
    try {
      const response = await fetch('https://whatexpsare.online/api/status/exploits', {
        headers: { 'User-Agent': 'WEAO-3PService' },
      });
      const data = await response.json();
      if (!response.ok) {
        addOrUpdateLogEntry(`Failed to fetch executors: ${data.error || 'Unknown error'}`, 'error');
        throw new Error(`HTTP error: ${response.status}`);
      }
      if (!Array.isArray(data)) {
        addOrUpdateLogEntry('Executors response is not an array', 'error');
        throw new Error('Invalid response format');
      }
      const filteredExecutors = data.filter(executor =>
        ['AWP.GG', 'Visual', 'Wave'].includes(executor.title)
      );
      setExecutors(filteredExecutors);
      if (filteredExecutors.length === 0) {
        addOrUpdateLogEntry('No matching executors found for AWP.GG, Visual, or Wave', 'warning');
      }
    } catch (error) {
      addOrUpdateLogEntry(`Failed to fetch executors: ${error.message}`, 'error');
    }
  };

  // Initialize dashboard
  useEffect(() => {
    const initialize = async () => {
      updateTimestamp();
      addOrUpdateLogEntry('Dashboard initialized', 'success');
      const authValid = await checkAuth();
      if (authValid) {
        fetchRobloxVersion();
        fetchExecutors();
        const intervalId = setInterval(() => {
          updateTimestamp();
          fetchRobloxVersion();
          fetchExecutors();
        }, 60000);
        return () => clearInterval(intervalId);
      }
    };

    initialize().catch((error) => {
      console.error('Initialization error:', error);
      setError('Failed to initialize dashboard');
    });
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-200 overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
                    animation: 'gradientShift 15s ease infinite',
                    backgroundSize: '400% 400%',
                    fontFamily: 'Inter, sans-serif',
                    position: 'relative' }}>
        <style jsx global>{`
          :root {
            --primary: #a100ff;
            --primary-dark: #7b00cc;
            --secondary: #1e1e1e;
            --secondary-dark: #2c2c2c;
            --text-light: #e0e0e0;
            --text-dark: #888;
            --shadow: 0 0 20px rgba(161, 0, 255, 0.3);
            --glow: 0 0 10px rgba(161, 0, 255, 0.5);
            --transition: all 0.3s ease;
          }
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
          @keyframes particleFloat {
            0% { transform: translateY(0) translateX(0); opacity: 0.3; }
            50% { opacity: 0.6; }
            100% { transform: translateY(-100vh) translateX(10px); opacity: 0; }
          }
          @keyframes rippleEffect {
            to { transform: scale(4); opacity: 0; }
          }
          .particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(161, 0, 255, 0.5);
            border-radius: 50%;
            animation: particleFloat 10s infinite ease-in-out;
            pointer-events: none;
          }
          .input-field {
            width: 100%;
            padding: 18px 26px 18px 50px;
            border-radius: 12px;
            border: 1px solid rgba(161, 0, 255, 0.3);
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            color: var(--text-light);
            background: rgba(50, 50, 50, 0.8);
            transition: var(--transition);
          }
          .input-field:focus {
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 10px rgba(161, 0, 255, 0.5);
          }
          .input-field::placeholder {
            color: var(--text-dark);
            opacity: 0.7;
          }
          .input-label {
            position: absolute;
            top: 50%;
            left: 50px;
            transform: translateY(-50%);
            color: var(--text-dark);
            transition: var(--transition);
            pointer-events: none;
            font-size: 14px;
          }
          .input-field:focus + .input-label,
          .input-field:not(:placeholder-shown) + .input-label {
            top: -8px;
            font-size: 12px;
            color: var(--primary);
            background: rgba(30, 30, 30, 0.9);
            padding: 0 5px;
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
        `}</style>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}vw`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
        <div className="container mx-auto max-w-5xl flex overflow-hidden" 
             style={{ background: 'rgba(30, 30, 30, 0.9)', backdropFilter: 'blur(10px)', 
                      border: '1px solid rgba(161, 0, 255, 0.3)', boxShadow: 'var(--shadow)', 
                      borderRadius: '16px', minHeight: '600px' }}>
          <div style={{ width: '60%', height: '100%', 
                        background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 85%, #5a0099 100%)', 
                        position: 'relative', padding: '60px', display: 'flex', flexDirection: 'column', 
                        justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ position: 'absolute', borderRadius: '9999px', border: '1px solid var(--primary)', 
                          opacity: '0.6', animation: 'glowPulse 2s infinite ease-in-out', 
                          width: '557px', height: '557px', left: '-126px', top: '646px' }}></div>
            <div style={{ position: 'absolute', borderRadius: '9999px', border: '1px solid var(--primary)', 
                          opacity: '0.6', animation: 'glowPulse 2s infinite ease-in-out', 
                          width: '557px', height: '557px', left: '-207px', top: '620px' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '23px', zIndex: 1 }}>
              <div style={{ color: 'var(--text-light)', fontSize: '48px', fontWeight: 700, 
                            letterSpacing: '1px', textShadow: 'var(--glow)' }}>Nebula</div>
              <div style={{ color: 'var(--text-light)', fontSize: '20px', fontWeight: 500, 
                            maxWidth: '400px', opacity: 0.9 }}>Premier whitelisting service for secure access</div>
              <a href="#" className="ripple-button" 
                 style={{ padding: '12px 40px', background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))', 
                          borderRadius: '30px', color: 'var(--text-light)', fontSize: '16px', fontWeight: 500, 
                          textDecoration: 'none', transition: 'var(--transition)', cursor: 'pointer', 
                          boxShadow: 'var(--glow)' }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.filter = 'brightness(1.2)';
                   e.currentTarget.style.transform = 'scale(1.05)';
                   e.currentTarget.style.boxShadow = '0 0 15px rgba(161, 0, 255, 0.8)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.filter = 'brightness(1)';
                   e.currentTarget.style.transform = 'scale(1)';
                   e.currentTarget.style.boxShadow = 'var(--glow)';
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
                 }}>
                Read More
              </a>
            </div>
          </div>
          <div style={{ width: '40%', height: '100%', padding: '60px', display: 'flex', 
                        flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
                        position: 'relative' }}>
            <div style={{ color: 'var(--text-light)', fontSize: '28px', fontWeight: 700, 
                          marginBottom: '10px', textShadow: 'var(--glow)' }}>Hello Again!</div>
            <div style={{ color: 'var(--text-dark)', fontSize: '18px', fontWeight: 400, 
                          marginBottom: '30px', opacity: 0.9 }}>Welcome Back</div>
            {error && (
              <p style={{ marginBottom: '20px', textAlign: 'center', color: '#f87171', animation: 'pulse 2s infinite' }}>
                {error}
              </p>
            )}
            <div style={{ width: '100%', maxWidth: '340px', position: 'relative', marginBottom: '25px' }}>
              <input type="text" id="username" className="input-field" placeholder=" " 
                     value={username} onChange={(e) => setUsername(e.target.value)} />
              <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.7">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M5.121 17.804A7 7 0 1112 5a7 7 0 016.879 5.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm-3 7a3 3 0 00-3 3h6a3 3 0 00-3-3z" 
                          stroke="#e0e0e0"/>
                  </g>
                </svg>
              </div>
              <label htmlFor="username" className="input-label">Username</label>
            </div>
            <div style={{ width: '100%', maxWidth: '340px', position: 'relative', marginBottom: '25px' }}>
              <input type="text" id="discordId" className="input-field" placeholder=" " 
                     value={discordId} onChange={(e) => setDiscordId(e.target.value)} />
              <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.7">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.045-.319 13.579.193 18.07a.082.082 0 00.031.056 19.874 19.874 0 005.992 3.03.077.077 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.009-.128 10.51 10.51 0 00.372-.292.074.074 0 01.077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.372.292a.077.077 0 01-.01.129 13.114 13.114 0 01-1.873.892.076.076 0 00-.04.106c.36.698.771 1.362 1.225 1.993a.076.076 0 00.084.028 19.846 19.846 0 006.003-3.03.077.077 0 00.032-.054c.5-4.499-.838-9.14-3.118-13.701a.07.07 0 00-.032-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" 
                          fill="#e0e0e0"/>
                  </g>
                </svg>
              </div>
              <label htmlFor="discordId" className="input-label">Discord ID</label>
            </div>
            <div style={{ width: '100%', maxWidth: '340px', display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button className="ripple-button" 
                      style={{ flex: 1, padding: '18px', background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))', 
                               borderRadius: '12px', color: 'var(--text-light)', fontSize: '16px', fontWeight: 500, 
                               border: 'none', cursor: 'pointer', transition: 'var(--transition)', boxShadow: 'var(--glow)', 
                               position: 'relative', overflow: 'hidden' }}
                      onClick={(e) => {
                        handleLogin(e);
                        const button = e.currentTarget;
                        const rect = button.getBoundingClientRect();
                        const ripple = document.createElement('span');
                        ripple.className = 'ripple';
                        ripple.style.left = `${e.clientX - rect.left}px`;
                        ripple.style.top = `${e.clientY - rect.top}px`;
                        button.appendChild(ripple);
                        setTimeout(() => ripple.remove(), 600);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.2)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(161, 0, 255, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'brightness(1)';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'var(--glow)';
                      }}>
                Login
              </button>
              <button className="ripple-button" 
                      style={{ flex: 1, padding: '18px', background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))', 
                               borderRadius: '12px', color: 'var(--text-light)', fontSize: '16px', fontWeight: 500, 
                               border: 'none', cursor: 'pointer', transition: 'var(--transition)', boxShadow: 'var(--glow)', 
                               position: 'relative', overflow: 'hidden' }}
                      onClick={(e) => {
                        handleRegister(e);
                        const button = e.currentTarget;
                        const rect = button.getBoundingClientRect();
                        const ripple = document.createElement('span');
                        ripple.className = 'ripple';
                        ripple.style.left = `${e.clientX - rect.left}px`;
                        ripple.style.top = `${e.clientY - rect.top}px`;
                        button.appendChild(ripple);
                        setTimeout(() => ripple.remove(), 600);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.2)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(161, 0, 255, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'brightness(1)';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'var(--glow)';
                      }}>
                Register
              </button>
            </div>
            <a href="#" style={{ color: 'var(--text-dark)', fontSize: '14px', fontWeight: 400, 
                                 opacity: 0.7, textDecoration: 'none', marginTop: '20px', transition: 'var(--transition)' }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.color = 'var(--primary)';
                 e.currentTarget.style.opacity = 1;
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.color = 'var(--text-dark)';
                 e.currentTarget.style.opacity = 0.7;
               }}>
              Forgot Password
            </a>
          </div>
        </div>
      </div>
    );
  }

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
        :root {
          --primary: #a100ff;
          --primary-dark: #7b00cc;
          --secondary: #1e1e1e;
          --secondary-dark: #2c2c2c;
          --text-light: #e0e0e0;
          --text-dark: #888;
          --shadow: 0 0 20px rgba(161, 0, 255, 0.3);
          --glow: 0 0 10px rgba(161, 0, 255, 0.5);
          --transition: all 0.3s ease;
        }
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
        @keyframes rippleEffect {
          to { transform: scale(4); opacity: 0; }
        }
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateX(10px); opacity: 0; }
        }
        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(161, 0, 255, 0.5);
          border-radius: 50%;
          animation: particleFloat 10s infinite ease-in-out;
          pointer-events: none;
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
      `}</style>

      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      <Suspense
        fallback={
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
              <img
                src="/app/nebulaText.ico"
                alt="Nebula"
                className="h-6"
                style={{ filter: 'drop-shadow(0 0 10px rgba(161, 0, 255, 0.5))' }}
              />
              <div
                className="flex items-center space-x-2 p-2 rounded-lg"
                style={{
                  background: 'rgba(50, 50, 50, 0.8)',
                  border: '1px solid rgba(161, 0, 255, 0.2)',
                  boxShadow: 'var(--glow)',
                }}
              >
                <span className="text-sm text-white">Loading...</span>
              </div>
            </div>
          </nav>
        }
      >
        <Topbar username={username} />
      </Suspense>

      <div className="container mx-auto p-8 pt-24 max-w-5xl">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(30, 30, 30, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(161, 0, 255, 0.3)',
            boxShadow: 'var(--shadow)',
            minHeight: '600px',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: '60px',
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-light)', fontSize: '28px', fontWeight: 700, textShadow: 'var(--glow)' }}>
                Nebula Dashboard
              </div>
              <div
                style={{
                  background: 'rgba(50, 50, 50, 0.8)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(161, 0, 255, 0.2)',
                  color: 'var(--text-dark)',
                  fontSize: '14px',
                  fontWeight: 400,
                  opacity: 0.9,
                }}
              >
                Last Updated: {lastUpdated}
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 85%, #5a0099 100%)',
                borderRadius: '16px',
                padding: '30px',
                boxShadow: 'var(--glow)',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(161, 0, 255, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'var(--glow)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: 'var(--text-light)', fontSize: '20px', fontWeight: 700, textShadow: 'var(--glow)' }}>
                  Roblox Version
                </h2>
                <span
                  style={{
                    marginLeft: '12px',
                    height: '12px',
                    width: '12px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    boxShadow: '0 0 15px rgba(161, 0, 255, 0.7)',
                    animation: 'glowPulse 1.5s infinite ease-in-out',
                  }}
                ></span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                <span
                  style={{
                    background: 'rgba(50, 50, 50, 0.8)',
                    border: '1px solid rgba(161, 0, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '6px 12px',
                    color: 'var(--text-light)',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {robloxVersion || 'Loading...'}
                </span>
              </div>
              <p style={{ color: 'var(--text-dark)', fontSize: '12px', marginTop: '12px', textAlign: 'center', opacity: 0.7 }}>
                Updated: {lastUpdated}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
              {executors.length === 0 ? (
                <p style={{ color: 'var(--text-dark)', fontSize: '16px', opacity: 0.7, animation: 'pulse 2s infinite' }}>
                  No matching executors found for AWP.GG, Visual, or Wave.
                </p>
              ) : (
                executors.map((executor, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 85%, #5a0099 100%)',
                      borderRadius: '16px',
                      padding: '30px',
                      boxShadow: 'var(--glow)',
                      transition: 'var(--transition)',
                      width: '100%',
                      maxWidth: '400px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(161, 0, 255, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'var(--glow)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h3 style={{ color: 'var(--text-light)', fontSize: '18px', fontWeight: 700, textShadow: 'var(--glow)' }}>
                          {executor.title}
                        </h3>
                        <span
                          style={{
                            marginLeft: '12px',
                            height: '12px',
                            width: '12px',
                            borderRadius: '50%',
                            background: executor.detected ? '#ef4444' : 'var(--primary)',
                            boxShadow: `0 0 15px rgba(${executor.detected ? '239, 68, 68' : '161, 0, 255'}, 0.7)`,
                            animation: 'glowPulse 1.5s infinite ease-in-out',
                          }}
                        ></span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                      <span
                        style={{
                          background: 'rgba(50, 50, 50, 0.8)',
                          border: '1px solid rgba(161, 0, 255, 0.2)',
                          borderRadius: '12px',
                          padding: '6px 12px',
                          color: 'var(--text-light)',
                          fontSize: '12px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Version: {executor.version}
                      </span>
                      <span
                        style={{
                          background: 'rgba(50, 50, 50, 0.8)',
                          border: '1px solid rgba(161, 0, 255, 0.2)',
                          borderRadius: '12px',
                          padding: '6px 12px',
                          color: 'var(--text-light)',
                          fontSize: '12px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Platform: {executor.platform}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-light)', fontSize: '14px', opacity: 0.9 }}>
                      Status: {executor.detected ? 'Detected' : 'Undetected'}
                    </p>
                    <p style={{ color: 'var(--text-dark)', fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                      Updated: {executor.updatedDate}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      {executor.websitelink && (
                        <button
                          onClick={() => window.open(executor.websitelink, '_blank', 'noopener,noreferrer')}
                          className="ripple-button"
                          style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))',
                            borderRadius: '12px',
                            color: 'var(--text-light)',
                            fontSize: '14px',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer,
                            animation: 'var(--glow)',
                            transition: 'var(--transition)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.filter = 'brightness(1.2)';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(161, 0, 255, 0.8)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'brightness(1)';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'var(--glow)';
                          }}
                          onClick={(e) => {
                            const button = e.currentTarget;
                            const rect = button.getBoundingClientRect();
                            const button = e.currentTarget;
                            const rect = button.getBoundingRect();
                            const ripple = document.createElement('span');
                            ripple.className = 'ripple-button';
                            ripple.style.left = `${e.clientX - rect.left}px`;
                            ripple.style.top = `${e.clientY - rect.top}px`;
                            button.appendChild(ripple);
                            setTimeout(() => ripple.remove(), 600);
                          }}
                        >
                          Website
                        </button>
                      )}
                      {executor.discordlink && (
                        <button
                          onClick={() => window.open(executor.discordlink, '_blank', 'noopener,noreferrer')}
                          className="ripple-button"
                          style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))',
                            borderRadius: '12px',
                            color: 'var(--text-light)',
                            fontSize: '14px',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                            boxShadow: 'var(--glow)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.filter = 'brightness(1.2)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(161, 0, 255, 0.8)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'brightness(1)';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'var(--glow)';
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
                          Discord
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 85%, var(--secondary-dark))',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--glow)',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(161, 0, 255, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'var(--glow)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span
                  style={{
                    background: 'rgba(50, 50, 50, 0.8)',
                    border: '1px solid rgba(161, 0, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    color: 'var(--text-light)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Service Endpoint Logs
                </span>
                <span style={{ color: 'var(--text-dark)', fontSize: '14px', fontWeight: 500, opacity: 0.8 }}>
                  by Nebula
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid rgba(161, 0, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: 'Courier New, monospace',
                  fontSize: '14px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  color: 'var(--text-light)',
                }}
              >
                {logs.map((log, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ marginRight: '8px' }}>{log.icon}</span>
                    <span
                      style={{
                        color:
                          log.type === 'success'
                            ? '#a1b3ff'
                            : log.type === 'warning'
                            ? '#ff5722'
                            : '#f44336',
                      }}
                    >
                      [{log.time}] {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
