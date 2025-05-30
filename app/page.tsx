'use client';

import { useState, useEffect } from 'react';

export default function StatusDashboard() {
  const versionPrefix = 'version-';
  const [version, setVersion] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [logs, setLogs] = useState([]);
  const [scripts, setScripts] = useState([]);

  // Language mapping based on language from Edge Config
  const getLanguageFromExtension = (language) => {
    const languageMap = {
      Lua: 'Lua',
      JavaScript: 'JavaScript',
      TypeScript: 'TypeScript',
      Python: 'Python',
      Ruby: 'Ruby',
      PHP: 'PHP',
      Java: 'Java',
      CSharp: 'C#',
      CPlusPlus: 'C++',
      C: 'C',
      Go: 'Go',
      Rust: 'Rust',
      Shell: 'Shell',
      SQL: 'SQL',
      HTML: 'HTML',
      CSS: 'CSS',
    };
    return languageMap[language] || 'Unknown';
  };

  // Generate random version hash
  const generateVersionHash = () => {
    return Math.random().toString(36).substring(2, 15);
  };

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

  // Update dashboard version
  const updateVersion = () => {
    const newVersion = `${versionPrefix}${generateVersionHash()}`;
    setVersion(newVersion);
  };

  // Update dashboard last updated timestamp
  const updateTimestamp = () => {
    setLastUpdated(getFormattedDate());
  };

  // Add log entry
  const addLogEntry = (message, type = 'info') => {
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

  // Fetch list of scripts from /scripts-list endpoint
  const fetchScriptsList = async () => {
    addLogEntry('Requesting list of scripts', 'info');
    try {
      const response = await fetch('/scripts-list', {
        method: 'GET',
        headers: {
          'Authorization': 'UserMode-2d93n2002n8',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid authentication header');
        }
        throw new Error(`HTTP error: ${response.status}`);
      }
      const scriptNames = await response.json();
      addLogEntry('Successfully retrieved script list', 'success');
      return scriptNames;
    } catch (error) {
      addLogEntry(`Failed to retrieve script list: ${error.message}`, 'error');
      throw error;
    }
  };

  // Fetch individual script content
  const getScript = async (scriptName) => {
    addLogEntry(`Requesting script: ${scriptName}`, 'info');
    try {
      const response = await fetch(`/files?filename=${scriptName}`, {
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
      addLogEntry(`Failed to retrieve script "${scriptName}": ${error.message}`, 'error');
      throw error;
    }
  };

  // Fetch all scripts and update state
  const fetchAllScripts = async () => {
    try {
      const scriptNames = await fetchScriptsList();
      const scriptPromises = scriptNames.map(async (scriptName) => {
        try {
          const content = await getScript(scriptName);
          // Fetch script metadata from Edge Config
          const response = await fetch('/scripts-list', {
            method: 'GET',
            headers: {
              'Authorization': 'UserMode-2d93n2002n8',
            },
          });
          const scripts = await response.json();
          const scriptData = scripts[scriptName] || {};
          
          return {
            name: scriptName,
            language: getLanguageFromExtension(scriptData.Lang || 'Unknown'),
            status: 'success',
            version: scriptData.Version || `${versionPrefix}${generateVersionHash()}`,
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
      // Error already logged in fetchScriptsList
    }
  };

  // Initialize dashboard
  useEffect(() => {
    updateVersion();
    updateTimestamp();
    addLogEntry('Dashboard initialized', 'success');
    fetchAllScripts();

    const interval = setInterval(() => {
      updateVersion();
      updateTimestamp();
      addLogEntry('System status check completed', 'success');
      fetchAllScripts();
    }, 60000);

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
                {version}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">Windows • {lastUpdated}</p>
          </div>
        </div>

        {/* Scripts Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {scripts.map((script, index) => (
            <div
              key={index}
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
