'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function StatusDashboardContent() {
  const versionPrefix = 'version-';
  const [version, setVersion] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [logs, setLogs] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [requestUrl, setRequestUrl] = useState('');
  const [requestMethod, setRequestMethod] = useState('GET');
  const [requestParams, setRequestParams] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [useDefaultHeader, setUseDefaultHeader] = useState(true);
  const [customHeaderKey, setCustomHeaderKey] = useState('');
  const [customHeaderValue, setCustomHeaderValue] = useState('');
  const [response, setResponse] = useState(null);
  const [responseError, setResponseError] = useState(null);

  const searchParams = useSearchParams();
  const isDevMode = searchParams.get('dev') === 'true';

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
      const response = await fetch(`/files?filename=${encodeURIComponent(scriptName)}`, {
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
      addOrUpdateLogEntry(`Script "${scriptName}" loaded`, 'success', scriptName);
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

  // Handle sending custom request
  const sendRequest = async (e) => {
    e.preventDefault();
    setResponse(null);
    setResponseError(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (useDefaultHeader) {
        headers['Authorization'] = 'UserMode-2d93n2002n8';
      } else if (customHeaderKey && customHeaderValue) {
        headers[customHeaderKey] = customHeaderValue;
      }

      let url = requestUrl;
      if (requestParams) {
        const params = new URLSearchParams(requestParams.split('&').map(param => param.split('=')));
        url = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
      }

      const fetchOptions = {
        method: requestMethod,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(requestMethod) && requestBody) {
        try {
          fetchOptions.body = JSON.stringify(JSON.parse(requestBody));
        } catch (error) {
          throw new Error('Invalid JSON body');
        }
      }

      const response = await fetch(url, fetchOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error: ${response.status}`);
      }

      setResponse(data);
      addOrUpdateLogEntry(`Request to ${url} succeeded`, 'success');
    } catch (error) {
      setResponseError(error.message);
      addOrUpdateLogEntry(`Request to ${url} failed: ${error.message}`, 'error');
    }
  };

  // Initialize dashboard
  useEffect(() => {
    updateTimestamp();
    addOrUpdateLogEntry('Dashboard initialized', 'success');
    fetchAllScripts();

    const intervalId = setInterval(() => {
      updateTimestamp();
      fetchAllScripts();
    }, 60000);

    return () => clearInterval(intervalId);
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
                {getFormattedDate()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">Windows • {lastUpdated}</p>
          </div>
        </div>

        {/* Request Sender */}
        <div className="mt-6">
          <div
            className="rounded-xl p-5 shadow-lg"
            style={{
              background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
              border: '1px solid #333',
            }}
          >
            <h2 className="text-lg font-semibold mb-4">Send Request</h2>
            <form onSubmit={sendRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">URL</label>
                <input
                  type="text"
                  value={requestUrl}
                  onChange={(e) => setRequestUrl(e.target.value)}
                  placeholder="e.g., /auth/admin or /register"
                  className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-[#444] text-gray-200 p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Method</label>
                <select
                  value={requestMethod}
                  onChange={(e) => setRequestMethod(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-[#444] text-gray-200 p-2 text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Query Parameters (key=value&key2=value2)</label>
                <input
                  type="text"
                  value={requestParams}
                  onChange={(e) => setRequestParams(e.target.value)}
                  placeholder="e.g., user=123456789&time=100h"
                  className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-[#444] text-gray-200 p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Request Body (JSON)</label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder='e.g., {"key": "value"}'
                  className="mt-1 block w-full rounded-md bg-[#2a2a2a] border border-[#444] text-gray-200 p-2 text-sm"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Headers</label>
                <div className="flex items-center space-x-4 mt-1">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={useDefaultHeader}
                      onChange={() => setUseDefaultHeader(true)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-300">Default (Authorization: UserMode-2d93n2002n8)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useDefaultHeader}
                      onChange={() => setUseDefaultHeader(false)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-300">Custom</span>
                  </label>
                </div>
                {!useDefaultHeader && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={customHeaderKey}
                      onChange={(e) => setCustomHeaderKey(e.target.value)}
                      placeholder="Header Key (e.g., Authorization)"
                      className="block w-full rounded-md bg-[#2a2a2a] border border-[#444] text-gray-200 p-2 text-sm"
                    />
                    <input
                      type="text"
                      value={customHeaderValue}
                      onChange={(e) => setCustomHeaderValue(e.target.value)}
                      placeholder="Header Value"
                      className="block w-full rounded-md bg-[#2a2a2a] border border-[#444] text-gray-200 p-2 text-sm"
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Send Request
              </button>
            </form>
            {(response || responseError) && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-300">Response</h3>
                <pre
                  className="mt-2 p-4 rounded-lg bg-[#1e1e1e] border border-[#444] text-gray-200 text-sm overflow-auto"
                  style={{ maxHeight: '200px' }}
                >
                  {responseError ? (
                    <span className="text-red-400">Error: {responseError}</span>
                  ) : (
                    JSON.stringify(response, null, 2)
                  )}
                </pre>
              </div>
            )}
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

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function StatusDashboard() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StatusDashboardContent />
    </Suspense>
  );
}
