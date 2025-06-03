'use client';

import { useState, useEffect } from 'react';

export default function StatusDashboard() {
  const [lastUpdated, setLastUpdated] = useState('');
  const [logs, setLogs] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [discordId, setDiscordId] = useState('');
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState(null);
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
  const addOrUpdateLogEntry = (message, type = 'info', scriptName = null) => {
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
          log.message.includes(`Script "${scriptName}"`) &&
          (log.type === 'success' || log.type === 'error')
      );

      if (existingLogIndex !== -1 && scriptName) {
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

      setUserData(data);
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
      setUserData(data);
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
      setUserData(data);
      setIsAuthenticated(true);
      addOrUpdateLogEntry(`User ${username} registered successfully`, 'success');
    } catch (error) {
      setError('An error occurred during registration');
    }
  };

  // Handle HWID reset
  const handleHwidReset = async () => {
    if (!userData?.discordId) {
      setError('User not authenticated');
      return;
    }

    try {
      const response = await fetch('/reset-hwid/v1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData.discordId}`,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'HWID reset failed');
        addOrUpdateLogEntry(`HWID reset failed: ${data.error || 'Unknown error'}`, 'error');
        return;
      }

      setUserData({ ...userData, hwid: '' });
      addOrUpdateLogEntry('HWID reset successfully', 'success');
    } catch (error) {
      setError('An error occurred during HWID reset');
      addOrUpdateLogEntry(`HWID reset failed: ${error.message}`, 'error');
    }
  };

  // Fetch list of scripts from /scripts-list endpoint
  const fetchScriptsList = async () => {
    try {
      const response = await fetch('/scripts-list', {
        method: 'GET',
        headers: {
          'Authorization': 'UserMode-2d93n2002n8',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        addOrUpdateLogEntry(`Scripts list request failed: ${data.error || 'Unknown error'}`, 'error');
        throw new Error(`HTTP error: ${response.status}`);
      }

      if (!Array.isArray(data)) {
        addOrUpdateLogEntry('Scripts list response is not an array', 'error');
        throw new Error('Invalid response format');
      }

      return data.length > 0 ? data : [];
    } catch (error) {
      addOrUpdateLogEntry(`Failed to fetch scripts list: ${error.message}`, 'error');
      throw error;
    }
  };

  // Fetch individual script details (excluding Code)
  const fetchIndividualScript = async (scriptName) => {
    try {
      const response = await fetch(`/files/v1?file=${encodeURIComponent(scriptName)}`, {
        method: 'GET',
        headers: {
          'Authorization': 'UserMode-2d93n2002n8',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        addOrUpdateLogEntry(`Failed to load script "${scriptName}" data: ${data.error || 'Unknown error'}`, 'error', scriptName);
        throw new Error(`HTTP error: ${response.status}`);
      }

      addOrUpdateLogEntry(`Script "${scriptName}" loaded successfully`, 'success', scriptName);
      return {
        Lang: data.Lang || 'Unknown',
        Version: data.Version || 'N/A',
      };
    } catch (error) {
      addOrUpdateLogEntry(`Failed to load script "${scriptName}" data: ${error.message}`, 'error', scriptName);
      return {
        Lang: 'Unknown',
        Version: 'N/A',
      };
    }
  };

  // Fetch all scripts and update state
  async function fetchAllScripts() {
    try {
      const scriptNames = await fetchScriptsList();
      const scriptPromises = scriptNames.map(async (scriptName) => {
        const scriptData = await fetchIndividualScript(scriptName);
        return {
          name: scriptName,
          language: scriptData.Lang,
          status: scriptData.Lang !== 'Unknown' ? 'success' : 'error',
          version: scriptData.Version,
          lastUpdated: getFormattedDate(),
        };
      });

      const scriptResults = await Promise.all(scriptPromises);
      setScripts(scriptResults);
    } catch (error) {
      addOrUpdateLogEntry(`Failed to fetch scripts: ${error.message}`, 'error');
    }
  }

  // Initialize dashboard
  useEffect(() => {
    const initialize = async () => {
      updateTimestamp();
      addOrUpdateLogEntry('Dashboard initialized', 'success');
      const authValid = await checkAuth();
      if (authValid) {
        fetchAllScripts();
        const intervalId = setInterval(() => {
          updateTimestamp();
          fetchAllScripts();
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
        className="min-h-screen flex items-center justify-center text-gray-300"
        style={{
          backgroundColor: '#1a1a1a',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Cg fill=%22#222222%22 fill-opacity=%220.3%22%3E%3Cpath d=%22M0 0h40v20H0zM20 20h20v20H20z%22/%3E%3C/g%3E%3C/svg%3E")',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          className="p-8 rounded-xl shadow-lg max-w-md w-full"
          style={{
            background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
            border: '1px solid #333',
          }}
        >
          <h2 className="mb-6 text-center text-xl font-semibold">Login or Register</h2>
          {error && (
            <p className="mb-4 text-center text-red-400">{error}</p>
          )}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Discord ID"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              className="w-full p-2 rounded bg-[#1e1e1e] text-gray-200 border border-[#444] focus:outline-none focus:border-green-500"
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 rounded bg-[#1e1e1e] text-gray-200 border border-[#444] focus:outline-none focus:border-green-500"
            />
            <div className="flex gap-4">
              <button
                onClick={handleLogin}
                className="flex-1 p-2 rounded bg-green-600 text-white font-semibold transition hover:bg-green-700"
              >
                Login
              </button>
              <button
                onClick={handleRegister}
                className="flex-1 p-2 rounded bg-blue-600 text-white font-semibold transition hover:bg-blue-700"
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
      className="min-h-screen text-gray-200"
      style={{
        backgroundColor: '#1a1a1a',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Cg fill=%22#222222%22 fill-opacity=%220.3%22%3E%3Cpath d=%22M0 0h40v40H0z%22/%3E%3Cpath d=%22M0 0h20v20H0zM20 20h20v20H20z%22/%3E%3C/g%3E%3C/svg%3E")',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Status Dashboard</h1>
          <div className="text-sm text-gray-500">
            Last Updated: {lastUpdated}
          </div>
        </div>

        {/* Service Status (Centered) */}
        <div className="flex justify-center">
          <div
            className="max-w-[400px] rounded-xl p-4 shadow-lg"
            style={{
              background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
              border: '1px solid #333',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div className="mb-3 flex items-center justify-center">
              <div className="flex items-center">
                <h2 className="text-center text-lg font-semibold">Status</h2>
                <span
                  className="ml-2 h-4 w-4 rounded-full bg-green-500"
                  style={{ boxShadow: '0 0 8px rgba(0, 255, 0, 0.5)' }}
                ></span>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2 justify-center">
              <span
                className="rounded px-2 py-1 text-xs font-semibold text-gray-300"
                style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {getFormattedDate()}
              </span>
            </div>
            <p className="mt-3 text-center text-xs text-gray-500">Windows • {lastUpdated}</p>
          </div>
        </div>

        {/* User Info Card (Under Status Card) */}
        {userData && (
          <div className="mt-6 flex justify-center">
            <div
              className="w-full max-w-[400px] rounded-xl p-5 shadow-lg"
              style={{
                background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
                border: '1px solid #333',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h2 className="mb-4 text-center text-lg font-semibold text-green-400">User Profile</h2>
              <div className="mb-4 flex flex-wrap gap-2 justify-center">
                <span
                  className="rounded px-2 py-1 text-xs font-semibold text-gray-300"
                  style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Username: {userData.username}
                </span>
                <span
                  className="rounded px-2 py-1 text-xs font-semibold text-gray-300"
                  style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Discord: {userData.discordId}
                </span>
                <span
                  className="rounded px-2 py-1 text-xs font-semibold text-gray-300"
                  style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Key: {userData.key}
                </span>
                <span
                  className="rounded px-2 py-1 text-xs font-semibold text-gray-300"
                  style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  HWID: {userData.hwid || 'Not set'}
                </span>
                <span
                  className="rounded px-2 py-1 text-xs font-semibold text-gray-300"
                  style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Ends: {new Date(userData.endTime * 1000).toLocaleString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleHwidReset}
                  disabled={!userData.hwid}
                  className={`p-2 rounded text-white font-semibold transition ${
                    userData.hwid
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  Reset HWID
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scripts Cards */}
        <div className="mt-6 flex flex-wrap justify-center gap-6">
          {scripts.length === 0 ? (
            <p className="text-gray-500">No scripts available or loading...</p>
          ) : (
            scripts.map((script, index) => (
              <div
                key={index}
                className="w-full max-w-[400px] rounded-xl p-5 shadow-lg"
                style={{
                  background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
                  border: '1px solid #333',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <h3 className="text-md font-semibold">{script.name}</h3>
                    <span
                      className={`ml-2 h-4 w-4 rounded-full ${
                        script.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ boxShadow: `0 0 8px rgba(${script.status === 'success' ? '0, 255, 0' : '255, 0, 0'}, 0.5)` }}
                    ></span>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span
                    className="rounded px-2 py-1 text-xs font-semibold text-gray-300"
                    style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    {script.language}
                  </span>
                  <span
                    className="rounded px-2 py-1 text-xs font-semibold text-gray-300"
                    style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    {script.version}
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Status: {script.status === 'success' ? 'Loaded' : 'Failed to load'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Last Updated: {script.lastUpdated}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Status Cards (Logs) */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-1">
          <div
            className="rounded-xl p-5 shadow-lg"
            style={{
              background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
              border: '1px solid #333',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <span
                  className="rounded px-2 py-1 text-xs font-semibold text-gray-300"
                  style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
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
                border: '1px solid #444',
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
