'use client';

import { useState, useEffect } from 'react';

export default function StatusDashboard() {
  const versionPrefix = 'version-';
  const [version, setVersion] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [logs, setLogs] = useState<{ time: string; message: string; type: string; icon: string }[]>([]);

  // Generate random version hash
  const generateVersionHash = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Format timestamp
  const getFormattedTimestamp = () => {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  };

  // Update version
  const updateVersion = () => {
    const newVersion = `${versionPrefix}${generateVersionHash()}`;
    setVersion(newVersion);
  };

  // Update last updated timestamp
  const updateTimestamp = () => {
    setLastUpdated(
      new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
        timeZone: 'America/Los_Angeles',
      }) + ' PDT'
    );
  };

  // Add log entry
  const addLogEntry = (message: string, type: string = 'info') => {
    const icon = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
    }[type] || 'ℹ️';
    setLogs((prevLogs) => [
      ...prevLogs,
      { time: getFormattedTimestamp(), message, type, icon },
    ]);
  };

  // Fetch script from /files endpoint
  const getScript = async (scriptName: string) => {
    addLogEntry(`Requesting script: ${scriptName}`, 'info');
    try {
      const response = await fetch(`/files/${scriptName}`, {
        method: 'GET',
        headers: {
          'Authorization': 'UserMode-2d93n2002n8',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid authentication header');
        }
        if (response.status === 404) {
          throw new Error(`Script "${scriptName}" not found`);
        }
        throw new Error(`HTTP error: ${response.status}`);
      }
      const content = await response.text();
      addLogEntry(`Successfully retrieved script: ${scriptName}`, 'success');
      return content;
    } catch (error) {
      addLogEntry(`Failed to retrieve script "${scriptName}": ${(error as Error).message}`, 'error');
      throw error;
    }
  };

  // Initialize dashboard
  useEffect(() => {
    updateVersion();
    updateTimestamp();
    addLogEntry('Dashboard initialized', 'success');

    // Periodic updates
    const interval = setInterval(() => {
      updateVersion();
      updateTimestamp();
      addLogEntry('System status check completed', 'success');
      // Example: Fetch a script periodically (e.g., 'example.js')
      getScript('example');
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold">Status</h2>
                <span
                  className="ml-2 h-4 w-4 rounded-full-Resfull rounded-full bg-green-500 status-dot"
                  style={{ boxShadow: '0 0 8px rgba(0, 255, 0, 0.5)' }}
                ></span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className="text-gray-300 text-xs font-semibold px-2 py-1 rounded category-tag"
                style={{ background: '#333', border: '1px solid #444', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {version}
              </span>
            </div>
            <div className="flex gap-3"></div>
            <p className="text-xs text-gray-500 mt-3">Windows • 2025-04-02 20:48 UTC</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-6">
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
