'use client';

import { useState, useEffect } from 'react';

export default function StatusDashboard() {
  const versionPrefix = 'version-';
  const [version, setVersion] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [logs, setLogs] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
      const response = await fetch(`/login/v1?ID=${user.discordId}&username=${user.username}`);
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
      const response = await fetch(`/login/v1?ID=${discordId}&username=${username}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify({ discordId, username }));
      setUserData(data);
      setIsAuthenticated(true);
      addOrUpdateLogEntry(`User ${username} logged in`, 'success');
    } catch (error) {
      setError('Error during login');
    }
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/register/v1?ID=${discordId}&time=30d&username=${username}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Registration failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify({ discordId, username }));
      setUserData(data);
      setIsAuthenticated(true);
      addOrUpdateLogEntry(`User ${username} registered`, 'success');
    } catch (error) {
      setError('Error during registration');
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
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid authentication header');
        }
        throw new Error(`HTTP error: ${response.status}`);
      }
      return data;
    } catch (error) {
      addOrUpdateLogEntry(`Scripts list request failed: ${error.message}`, 'error');
      throw error;
    }
  };

  // Fetch individual script content and metadata
  const getScript = async (scriptName) => {
    try {
      const response = await fetch(`/files?filename=${scriptName}`, {
        method: 'GET',
        headers: {
          'Authorization': 'UserMode-2d93n2002n8',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        addOrUpdateLogEntry(`Script "${scriptName}" failed to load: ${data.error || 'Unknown error'}`, 'error', scriptName);
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid authentication header');
        }
        if (response.status === 404) {
          throw new Error(`Script "${scriptName}" not found`);
        }
        throw new Error(`HTTP error: ${response.status}`);
      }
      addOrUpdateLogEntry(`Script "${scriptName}" Loaded`, 'success', scriptName);
      return data.content;
    } catch (error) {
      addOrUpdateLogEntry(`Script "${scriptName}" failed to load: ${error.message}`, 'error', scriptName);
      throw error;
    }
  };

  // Fetch all scripts and update state
  const fetchAllScripts = async () => {
    try {
      const scriptNames = await fetchScriptsList();
      const metadataResponse = await fetch('/scripts-metadata', {
        method: 'GET',
        headers: {
          'Authorization': 'UserMode-2d93n2002n8',
        },
      });
      const metadataData = await metadataResponse.json();
      if (!metadataResponse.ok) {
        addOrUpdateLogEntry(`Metadata request failed: ${metadataData.error || 'Unknown error'}`, 'error');
        throw new Error(`HTTP error: ${metadataResponse.status}`);
      }

      const scriptPromises = scriptNames.map(async (scriptName) => {
        try {
          const content = await getScript(scriptName);
          const scriptData = metadataData.scripts[scriptName] || {};

          return {
            name: scriptName,
            language: scriptData.Lang || 'Unknown',
            status: 'success',
            version: scriptData.Version || 'N/A',
            lastUpdated: getFormattedDate(),
            content,
          };
        } catch (error) {
          return {
            name: scriptName,
            language: 'Unknown',
            status: 'error',
            version: 'N/A',
            lastUpdated: 'N/A',
          };
        }
      });
      const scriptResults = await Promise.all(scriptPromises);
      setScripts(scriptResults);
    } catch (error) {
      // Error already logged
    }
  };

  // Initialize dashboard
  useEffect(() => {
    const init = async () => {
      const authValid = await checkAuth();
      if (authValid) {
        updateTimestamp();
        addOrUpdateLogEntry('Dashboard initialized', 'success');
        fetchAllScripts();

        const interval = setInterval(() => {
          updateTimestamp();
          fetchAllScripts();
        }, 60000);

        return () => clearInterval(interval);
      }
    };
    init();
  }, []);

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen text-gray-200 flex items-center justify-center"
        style={{
          backgroundColor: '#1a1a1a',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cg fill=\'%23222222\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M0 0h40v40H0z\'/%3E%3Cpath d=\'M0 0h20v20H0zM20 20h20v20H20z\'/%3E%3C/g%3E%3C/svg%3E")',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div
          className="rounded-xl p-8 shadow-lg max-w-md w-full"
          style={{
            background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
            border: '1px solid #333',
          }}
        >
          <h2 className="text-xl font-semibold mb-6 text-center">Login or Register</h2>
          {error && (
            <p className="text-red-400 mb-4 text-center">{error}</p>
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
                className="flex-1 p-2 rounded bg-green-500 text-white font-semibold hover:bg-green-600 transition"
              >
                Login
              </button>
              <button
                onClick={handleRegister}
                className="flex-1 p-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
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
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cg fill=\'%23222222\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M0 0h40v40H0z\'/%3E%3Cpath d=\'M0 0h20v20H0zM20 20h20v20H20z\'/%3E%3C/g%3E%3C/svg%3E")',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div className="container mx-auto p-6">
        {/* User Info Card */}
        {userData && (
          <div
            className="rounded-xl p-5 shadow-lg mb-6 max-w-[400px] mx-auto"
            style={{
              background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
              border: '1px solid #333',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <h2 className="text-lg font-semibold mb-3">User Information</h2>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Username:</span> {userData.username}
              </p>
              <p className="text-sm">
                <span className="font-medium">Discord ID:</span> {userData.discordId}
              </p>
              <p className="text-sm">
                <span className="font-medium">Key:</span> {userData.key}
              </p>
              <p className="text-sm">
                <span className="font-medium">HWID:</span> {userData.hwid || 'Not set'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Subscription Ends:</span>{' '}
                {new Date(userData.endTime * 1000).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                  timeZone: 'America/Los_Angeles',
                })}{' '}
                PDT
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Status Dashboard</h1>
          <div className="text-sm text-gray-500">
            Last Updated: {lastUpdated}
          </div>
        </div>

        {/* Service Status (Centered) */}
        <div className="flex justify-center">
          <div
            className="service-card rounded-xl shadow-lg max-w-[400px] p-4"
            style={{
              background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
              border: '1px solid #333',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div className="flex justify-center items-center mb-3">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-center">Status</h2>
                <span
                  className="ml-2 h-4 w-4 rounded-full bg-green-500 status-dot"
                  style={{ boxShadow: '0 0 8px rgba(0, 255, 0, 0.5)' }}
                ></span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              <span
                className="text-gray-300 text-xs font-semibold px-2 py-1 rounded category-tag"
                style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {getFormattedDate()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">Windows • {lastUpdated}</p>
          </div>
        </div>

        {/* Scripts Cards */}
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          {scripts.map((script, index) => (
            <div
              key={index}
              className="rounded-xl p-5 shadow-lg w-full max-w-[400px]"
              style={{
                background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
                border: '1px solid #333',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <h3 className="text-md font-semibold">{script.name}</h3>
                  <span
                    className={`ml-2 h-4 w-4 rounded-full ${
                      script.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                    } status-dot`}
                    style={{ boxShadow: `0 0 8px rgba(${script.status === 'success' ? '0, 255, 0' : '255, 0, 0'}, 0.5)` }}
                  ></span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className="text-gray-300 text-xs font-semibold px-2 py-1 rounded category-tag"
                  style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  {script.language}
                </span>
                <span
                  className="text-gray-300 text-xs font-semibold px-2 py-1 rounded category-tag"
                  style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  {script.version}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Status: {script.status === 'success' ? 'Loaded' : 'Failed to load'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Last Updated: {script.lastUpdated}
              </p>
            </div>
          ))}
        </div>

        {/* Status Cards (Logs) */}
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
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
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <span
                  className="text-gray-300 text-xs font-semibold px-2 py-1 rounded"
                  style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Service endpoint logs
                </span>
              </div>
              <span className="text-gray-400 font-medium">by 7PX$</span>
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
                  <span className="log-icon mr-2">{log.icon}</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'log-success text-green-400'
                        : log.type === 'warning'
                        ? 'log-warning text-yellow-400'
                        : 'log-error text-red-400'
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
