'use client';

import { useState, useEffect } from 'react';

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
      setIsAuthenticated(false);
      return false;
    }

    try {
      const user = JSON.parse(storedUser);
      const response = await fetch(`/login/v1?ID=${encodeURIComponent(user.discordId)}&username=${encodeURIComponent(user.username)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setError(data.error || 'Authentication failed');
        return false;
      }

      setIsAuthenticated(true);
      return true;
    } catch (error) {
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
      setExecutors(data);
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
      <div
        className="min-h-screen flex items-center justify-center text-gray-200 overflow-hidden"
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
          @keyframes particleFloat {
            0% { transform: translateY(0) translateX(0); opacity: 0.3; }
            50% { opacity: 0.6; }
            100% { transform: translateY(-100vh) translateX(10px); opacity: 0; }
          }
          @keyframes glowPulse {
            0% { box-shadow: 0 0 5px rgba(0, 255, 128, 0.5); }
            50% { box-shadow: 0 0 15px rgba(0, 255, 128, 0.8); }
            100% { box-shadow: 0 0 5px rgba(0, 255, 128, 0.5); }
          }
          .particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(0, 255, 128, 0.5);
            border-radius: 50%;
            animation: particleFloat 10s infinite ease-in-out;
            pointer-events: none;
          }
          .input-label {
            position: absolute;
            top: 50%;
            left: 12px;
            transform: translateY(-50%);
            color: #888;
            transition: all 0.3s ease;
            pointer-events: none;
          }
          .input-field:focus + .input-label,
          .input-field:not(:placeholder-shown) + .input-label {
            top: -8px;
            font-size: 12px;
            color: #00ff80;
          }
          .input-field {
            background: none;
            border: none;
            border-bottom: 2px solid #444;
            transition: border-color 0.3s ease;
          }
          .input-field:focus {
            border-color: #00ff80;
            outline: none;
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
        {/* Particles Background */}
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
        <div
          className="p-10 rounded-2xl max-w-md w-full relative z-10"
          style={{
            background: 'rgba(30, 30, 30, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 255, 128, 0.3)',
            boxShadow: '0 0 20px rgba(0, 255, 128, 0.3)',
            animation: 'glowPulse 2s infinite ease-in-out',
          }}
        >
          <h2 className="mb-8 text-center text-2xl font-bold text-white tracking-wide">
            <span style={{ color: '#00ff80' }}>7Px</span> Dashboard
          </h2>
          {error && (
            <p className="mb-6 text-center text-red-400 animate-pulse">{error}</p>
          )}
          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                id="discordId"
                placeholder=" "
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                className="input-field w-full p-3 text-gray-200 rounded-t"
                style={{ borderBottom: '2px solid #444' }}
              />
              <label htmlFor="discordId" className="input-label">
                Discord ID
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                id="username"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field w-full p-3 text-gray-200 rounded-t"
                style={{ borderBottom: '2px solid #444' }}
              />
              <label htmlFor="username" className="input-label">
                Username
              </label>
            </div>
            <div className="flex gap-4">
              <button
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
                className="ripple-button flex-1 p-3 rounded-lg text-white font-semibold transition-all duration-300"
                style={{
                  background: 'linear-gradient(90deg, #00ff80, #00cc66)',
                  boxShadow: '0 0 10px rgba(0, 255, 128, 0.5)',
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
                Login
              </button>
              <button
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
                className="ripple-button flex-1 p-3 rounded-lg text-white font-semibold transition-all duration-300"
                style={{
                  background: 'linear-gradient(90deg, #00b7ff, #0088cc)',
                  boxShadow: '0 0 10px rgba(0, 183, 255, 0.5)',
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
                Register
              </button>
            </div>
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
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 5px rgba(0, 255, 128, 0.5); }
          50% { box-shadow: 0 0 15px rgba(0, 255, 128, 0.8); }
          100% { box-shadow: 0 0 5px rgba(0, 255, 128, 0.5); }
        }
        @keyframes rippleEffect {
          to {
            transform: scale(4);
            opacity: 0;
          }
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
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1
            className="text-2xl font-bold tracking-wide"
            style={{ color: '#00ff80', textShadow: '0 0 10px rgba(0, 255, 128, 0.5)' }}
          >
            Status Dashboard
          </h1>
          <div
            className="text-sm text-gray-400"
            style={{
              background: 'rgba(30, 30, 30, 0.8)',
              padding: '4px 12px',
              borderRadius: '12px',
              border: '1px solid rgba(0, 255, 128, 0.2)',
            }}
          >
            Last Updated: {lastUpdated}
          </div>
        </div>

        {/* Roblox Version Card (Centered) */}
        <div className="flex justify-center">
          <div
            className="max-w-[400px] rounded-2xl p-6"
            style={{
              background: 'rgba(30, 30, 30, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 255, 128, 0.3)',
              boxShadow: '0 0 20px rgba(0, 255, 128, 0.3)',
              transition: 'all 0.3s ease',
              animation: 'glowPulse 2s infinite ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 128, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 128, 0.3)';
            }}
          >
            <div className="mb-4 flex items-center justify-center">
              <div className="flex items-center">
                <h2 className="text-center text-xl font-semibold text-white">Roblox Version</h2>
                <span
                  className="ml-3 h-5 w-5 rounded-full bg-green-500"
                  style={{
                    boxShadow: '0 0 15px rgba(0, 255, 0, 0.7)',
                    animation: 'glowPulse 1.5s infinite ease-in-out',
                  }}
                ></span>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2 justify-center">
              <span
                className="rounded-xl px-3 py-1 text-xs font-semibold text-gray-200"
                style={{
                  background: 'rgba(50, 50, 50, 0.8)',
                  border: '1px solid rgba(0, 255, 128, 0.2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {robloxVersion || 'Loading...'}
              </span>
            </div>
            <p className="mt-3 text-center text-xs text-gray-400">
              Updated: {lastUpdated}
            </p>
          </div>
        </div>

        {/* Executors Cards */}
        <div className="mt-8 flex flex-wrap justify-center gap-8">
          {executors.length === 0 ? (
            <p className="text-gray-400 animate-pulse">No executors available or loading...</p>
          ) : (
            executors.map((executor, index) => (
              <div
                key={index}
                className="w-full max-w-[400px] rounded-2xl p-6"
                style={{
                  background: 'rgba(30, 30, 30, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 255, 128, 0.3)',
                  boxShadow: '0 0 20px rgba(0, 255, 128, 0.3)',
                  transition: 'all 0.3s ease',
                  animation: 'glowPulse 2s infinite ease-in-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 128, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 128, 0.3)';
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-white">{executor.title}</h3>
                    <span
                      className={`ml-3 h-5 w-5 rounded-full ${
                        executor.detected ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{
                        boxShadow: `0 0 15px rgba(${
                          executor.detected ? '255, 0, 0' : '0, 255, 0'
                        }, 0.7)`,
                        animation: 'glowPulse 1.5s infinite ease-in-out',
                      }}
                    ></span>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span
                    className="rounded-xl px-3 py-1 text-xs font-semibold text-gray-200"
                    style={{
                      background: 'rgba(50, 50, 50, 0.8)',
                      border: '1px solid rgba(0, 255, 128, 0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Version: {executor.version}
                  </span>
                  <span
                    className="rounded-xl px-3 py-1 text-xs font-semibold text-gray-200"
                    style={{
                      background: 'rgba(50, 50, 50, 0.8)',
                      border: '1px solid rgba(0, 255, 128, 0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Platform: {executor.platform}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  Status: {executor.detected ? 'Detected' : 'Undetected'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Updated: {executor.updatedDate}
                </p>
                {executor.websitelink && (
                  <a
                    href={executor.websitelink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Website
                  </a>
                )}
                {executor.discordlink && (
                  <a
                    href={executor.discordlink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Discord
                  </a>
                )}
              </div>
            ))
          )}
        </div>

        {/* Status Cards (Logs) */}
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-1 lg:grid-cols-1">
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'rgba(30, 30, 30, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 255, 128, 0.3)',
              boxShadow: '0 0 20px rgba(0, 255, 128, 0.3)',
              transition: 'all 0.3s ease',
              animation: 'glowPulse 2s infinite ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 128, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 128, 0.3)';
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <span
                  className="rounded-xl px-3 py-1 text-xs font-semibold text-gray-200"
                  style={{
                    background: 'rgba(50, 50, 50, 0.8)',
                    border: '1px solid rgba(0, 255, 128, 0.2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Service endpoint logs
                </span>
              </div>
              <span className="font-medium text-gray-400">by 7PX</span>
            </div>
            <div
              className="rounded-lg p-4"
              style={{
                background: '#1e1e1e',
                border: '1px solid rgba(0, 255, 128, 0.2)',
                fontFamily: 'Courier New, Courier, monospace',
                fontSize: '0.9rem',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {logs.map((log, index) => (
                <div key={index} className="log-entry flex items-center mb-2">
                  <span className="mr-2">{log.icon}</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-green-400'
                        : log.type === 'warning'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }
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
