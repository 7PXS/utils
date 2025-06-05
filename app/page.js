'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

// Topbar component to handle useSearchParams
function Topbar({ username }) {
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get('from') === 'profile';

  return (
    <nav className="topbar">
      <div className="topbar-container">
        <div className="topbar-left">
          {fromProfile && (
            <Link href="/profile">
              <button
                className="ripple-button topbar-back-button"
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
            className="topbar-logo"
          />
        </div>
        <Link href="/profile?from=dashboard">
          <div className="topbar-profile">
            <svg
              className="topbar-profile-icon"
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
            <span className="topbar-profile-username">{username || 'User'}</span>
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
      <div className="login-page">
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
        <div className="login-container">
          <div className="login-left">
            <div className="glow-circle glow-circle-1"></div>
            <div className="glow-circle glow-circle-2"></div>
            <div className="login-left-content">
              <h1 className="login-title">Nebula</h1>
              <p className="login-description">Premier whitelisting service for secure access</p>
              <a
                href="#"
                className="ripple-button login-read-more"
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
                Read More
              </a>
            </div>
          </div>
          <div className="login-right">
            <h2 className="login-subtitle">Hello Again!</h2>
            <p className="login-welcome">Welcome Back</p>
            {error && (
              <p className="login-error">
                {error}
              </p>
            )}
            <div className="input-group">
              <input
                type="text"
                id="username"
                className="input-field"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className="input-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.7">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5.121 17.804A7 7 0 1112 5a7 7 0 016.879 5.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm-3 7a3 3 0 00-3 3h6a3 3 0 00-3-3z"
                      stroke="#e0e0e0"
                    />
                  </g>
                </svg>
              </div>
              <label htmlFor="username" className="input-label">Username</label>
            </div>
            <div className="input-group">
              <input
                type="text"
                id="discordId"
                className="input-field"
                placeholder=" "
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
              />
              <div className="input-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.7">
                    <path
                      d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.045-.319 13.579.193 18.07a.082.082 0 00.031.056 19.874 19.874 0 005.992 3.03.077.077 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.009-.128 10.51 10.51 0 00.372-.292.074.074 0 01.077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.372.292a.077.077 0 01-.01.129 13.114 13.114 0 01-1.873.892.076.076 0 00-.04.106c.36.698.771 1.231 1.25 1.993a.076.076 0 00.084.028 19.846 19.846 0 006.003-9.03.077.077 0 00.032-.054c.5-4.499-.838-9.14 3.118-13.701a.07-.007 0a-.032-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                      fill="#e0e0e0"
                    />
                  </g>
                </svg>
              </div>
              <label htmlFor="discordId" className="input-label">Discord ID</label>
            </div>
            <div className="login-button-group">
              <button
                className="ripple-button login-button"
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
              >
                Login
              </button>
              <button
                className="ripple-button login-button"
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
              >
                Register
              </button>
            </div>
            <a href="#" className="login-forgot-password">
              Forgot Password
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
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
          <nav className="topbar">
            <div className="topbar-container">
              <img
                src="/app/nebulaText.ico"
                alt="Nebula"
                className="topbar-logo"
              />
              <div className="topbar-profile">
                <span className="topbar-profile-username">Loading...</span>
              </div>
            </div>
          </nav>
        }
      >
        <Topbar username={username} />
      </Suspense>
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Nebula Dashboard</h1>
            <span className="dashboard-last-updated">Last Updated: {lastUpdated}</span>
          </div>
          <div className="roblox-version-card">
            <div className="card-header">
              <h2 className="card-title">Roblox Version</h2>
              <span className="status-dot"></span>
            </div>
            <div className="card-tags">
              <span className="category-tag">{robloxVersion || 'Loading...'}</span>
            </div>
            <p className="card-updated">Updated: {lastUpdated}</p>
          </div>
          <div className="executors-grid">
            {executors.length === 0 ? (
              <p className="no-executors">
                No matching executors found for AWP.GG, Visual, or Wave.
              </p>
            ) : (
              executors.map((executor, index) => (
                <div key={index} className="executor-card">
                  <div className="card-header">
                    <h3 className="card-title">{executor.title}</h3>
                    <span className={`status-dot ${executor.detected ? 'status-dot-down' : ''}`}></span>
                  </div>
                  <div className="card-tags">
                    <span className="category-tag">Version: {executor.version}</span>
                    <span className="category-tag">Platform: {executor.platform}</span>
                  </div>
                  <p className="card-status">Status: {executor.detected ? 'Detected' : 'Undetected'}</p>
                  <p className="card-updated">Updated: {executor.updatedDate}</p>
                  <div className="card-buttons">
                    {executor.websitelink && (
                      <button
                        onClick={() => window.open(executor.websitelink, '_blank', 'noopener,noreferrer')}
                        className="ripple-button btn"
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
                        Website
                      </button>
                    )}
                    {executor.discordlink && (
                      <button
                        onClick={() => window.open(executor.discordlink, '_blank', 'noopener,noreferrer')}
                        className="ripple-button btn"
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
          <div className="logs-card">
            <div className="card-header">
              <span className="category-tag">Service Endpoint Logs</span>
              <span className="card-by">by Nebula</span>
            </div>
            <div className="log-container">
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  <span className="log-icon">{log.icon}</span>
                  <span className={`log-text log-${log.type}`}>
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
