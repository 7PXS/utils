'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function Topbar({ username, onSignOut }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(username || 'User');
  const [brandName, setBrandName] = useState('Nebula');
  const [activeNav, setActiveNav] = useState('Docs');

  const setActive = (section) => {
    setActiveNav(section);
  };

  const openProfileModal = () => setProfileModalOpen(true);
  const openSignOutModal = () => setSignOutModalOpen(true);
  const closeModal = () => {
    setProfileModalOpen(false);
    setSignOutModalOpen(false);
  };

  const saveProfile = () => {
    setProfileName(profileName);
    setBrandName(brandName);
    closeModal();
  };

  const handleSignOut = () => {
    onSignOut();
    closeModal();
  };

  return (
    <nav className="topbar">
      <div className="topbar-container">
        <div className="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#a100ff"/>
          </svg>
          <div className="brand-text">
            <div className="brand-letter">N</div>
            <div className="brand-name">{brandName}</div>
          </div>
        </div>
        <div className="nav-menu">
          <Link href="/" legacyBehavior>
            <a
              className={`nav-item ${activeNav === 'Home' ? 'active' : ''}`}
              onClick={() => setActive('Home')}
            >
              <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.01666 2.3667L3.525 5.8667C2.775 6.45003 2.16666 7.6917 2.16666 8.63337V14.8084C2.16666 16.7417 3.7416 18.325 6.83333 18.325H14.1667C17.2583 18.325 18.8333 16.7417 18.8333 14.8667V8.75003C18.8333 7.7417 18.1583 6.45003 17.3333 5.87503L12.1833 2.2667C11.0167 1.45003 9.14166 1.4917 8.01666 2.3667Z" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 14.9916V12.4916" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className={`nav-text ${activeNav === 'Home' ? 'active' : ''}`}>Home</div>
            </a>
          </Link>
          <div
            className={`nav-item ${activeNav === 'Docs' ? 'active' : ''}`}
            onClick={() => setActive('Docs')}
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.1416 6.19995L10.4999 10.4583L17.8083 6.22495" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.5 18.0083V10.45" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.77491 2.0667L4.32491 4.53336C3.31658 5.0917 2.49158 6.4917 2.49158 7.6417V12.35C2.49158 13.5 3.31658 14.9 4.32491 15.4583L8.77491 17.9334C9.72491 18.4584 11.2832 18.4584 12.2332 17.9334L16.6832 15.4583C17.6916 14.9 18.5166 13.5 18.5166 12.35V7.6417C18.5166 6.4917 17.6916 5.0917 16.6832 4.53336L12.2332 2.05836C11.2749 1.53336 9.72491 1.53336 8.77491 2.0667Z" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={`nav-text ${activeNav === 'Docs' ? 'active' : ''}`}>Docs</div>
          </div>
        </div>
        <div className="right-menu">
          <div className="icon" onClick={() => document.body.classList.toggle('dark')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.99998 15.4166C12.9915 15.4166 15.4166 12.9915 15.4166 9.99998C15.4166 7.00844 12.9915 4.58331 9.99998 4.58331C7.00844 4.58331 4.58331 7.00844 4.58331 9.99998C4.58331 12.9915 7.00844 15.4166 9.99998 15.4166Z" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.95 15.95L15.8417 15.8417M15.8417 4.15835L15.95 4.05002L15.8417 4.15835ZM4.05002 15.95L4.15835 15.8417L4.05002 15.95ZM10 1.73335V1.66669V1.73335ZM10 18.3334V18.2667V18.3334ZM1.73335 10H1.66669H1.73335ZM18.3334 10H18.2667H18.3334ZM4.15835 4.15835L4.05002 4.05002L4.15835 4.15835Z" stroke="#CFD1D4" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="icon" onClick={openSignOutModal}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5H7.5" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.3333 14.1667L17.5 10L13.3333 5.83334" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17.5 10H7.5" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <Link href="/profile?from=dashboard">
            <div className="icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="#a100ff"/>
                <text x="50%" y="50%" textAnchor="middle" dy=".3em" fill="white" fontSize="20" fontFamily="'Inter', sans-serif">{profileName[0].toUpperCase()}</text>
              </svg>
            </div>
          </Link>
        </div>
      </div>
      {profileModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>×</span>
            <h2>Profile</h2>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your Name"
              className="modal-input"
            />
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your Brand"
              className="modal-input"
            />
            <button onClick={saveProfile} className="modal-button">Save</button>
            <button onClick={closeModal} className="modal-button">Cancel</button>
          </div>
        </div>
      )}
      {signOutModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>×</span>
            <h2>Sign Out</h2>
            <p>Are you sure you want to sign out?</p>
            <button onClick={handleSignOut} className="modal-button">Confirm</button>
            <button onClick={closeModal} className="modal-button">Cancel</button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function DocsPage() {
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [requestParams, setRequestParams] = useState({});
  const [requestResponse, setRequestResponse] = useState('');

  const checkAuth = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setIsAuthenticated(false);
      return false;
    }

    try {
      const user = JSON.parse(storedUser);
      const response = await fetch(`/login/v1?ID=${encodeURIComponent(user.discordId)}&username=${encodeURIComponent(user.username)}`, {
        headers: {
          'User-Agent': 'Roblox/WinInet'
        }
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setError(data.error || 'Authentication failed');
        return false;
      }

      setUsername(user.username);
      setDiscordId(user.discordId);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setError('Error checking authentication');
      setIsAuthenticated(false);
      return false;
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUsername('');
    setDiscordId('');
    window.location.href = '/';
  };

  const handleSendRequest = async () => {
    if (!selectedEndpoint) {
      setRequestResponse('Please select an endpoint');
      return;
    }

    try {
      let url = selectedEndpoint;
      const queryParams = new URLSearchParams();

      for (const [key, value] of Object.entries(requestParams)) {
        if (value) queryParams.set(key, value);
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      const headers = {
        'User-Agent': 'Roblox/WinInet',
      };
      if (selectedEndpoint.includes('/manage/v1') || selectedEndpoint.includes('/scripts-list')) {
        headers['Authorization'] = selectedEndpoint.includes('/scripts-list') ? 'UserMode-2d93n2002n8' : `Bearer ${discordId}`;
      }

      const response = await fetch(url, { headers });
      const data = await response.json();

      setRequestResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setRequestResponse('Error: ' + error.message);
    }
  };

  const handleParamChange = (key, value) => {
    setRequestParams((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-right">
            <h2 className="login-subtitle">Please Log In</h2>
            <p className="login-welcome">You need to be authenticated to access the documentation.</p>
            <Link href="/">
              <button className="ripple-button login-button">Go to Login</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const endpointOptions = {
    '/register/v1': ['ID', 'time', 'username'],
    '/auth/v1': ['hwid', 'key'],
    '/dAuth/v1': ['ID', 'gameId'],
    '/files/v1': ['file'],
    '/manage/v1?action=list': [],
    '/scripts-list': [],
    '/login/v1': ['ID', 'username'],
    '/reset-hwid/v1': [],
    '/status': []
  };

  return (
    <div className="landing-page" style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0' }}>
      <Topbar username={username} onSignOut={handleSignOut} />
      <div className="landing-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <section className="docs-section">
          <h1 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '20px' }}>API/Key Management</h1>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Getting API Status</h2>
            <div style={{ color: '#3498db' }}>GET https://api.luarmor.net/status</div>
            <p style={{ margin: '10px 0' }}>This will return you the version information about the API.</p>
            <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>
              <pre style={{ margin: 0, color: '#e0e0e0' }}>
                {`200: OK
{
  "version": "v3",
  "active": true,
  "message": "API is up and working!",
  "warning": false,
  "warning_message": "No warning"
}`}
              </pre>
            </div>
          </div>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>API Endpoints</h2>
            <p>All requests to the API must include the <code>User-Agent: Roblox/WinInet</code> header for security validation. Below are the available endpoints:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '10px' }}>
              <li><strong>/register/v1</strong> - Register a new user. Requires: <code>ID</code>, <code>time</code>, <code>username</code>.</li>
              <li><strong>/auth/v1</strong> - Authenticate with key and HWID. Requires: <code>hwid</code>, <code>key</code>.</li>
              <li><strong>/dAuth/v1</strong> - Authenticate with Discord ID. Requires: <code>ID</code>, <code>gameId</code>.</li>
              <li><strong>/files/v1</strong> - Fetch a script by filename. Requires: <code>file</code>.</li>
              <li><strong>/manage/v1?action=list</strong> - List all users (admin only). Requires: <code>Authorization: Bearer {discordId}</code>.</li>
              <li><strong>/scripts-list</strong> - List all script names (admin only). Requires: <code>Authorization: UserMode-2d93n2002n8</code>.</li>
              <li><strong>/login/v1</strong> - Login with Discord ID and username. Requires: <code>ID</code>, <code>username</code>.</li>
              <li><strong>/reset-hwid/v1</strong> - Reset HWID (2/day limit, unlimited for admin). Requires: <code>Authorization: Bearer {discordId}</code>.</li>
              <li><strong>/status</strong> - Check API status. No parameters required.</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px' }}>
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Interactive API Tester</h2>
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#3498db' }}>Select Endpoint</label>
              <select
                value={selectedEndpoint}
                onChange={(e) => {
                  setSelectedEndpoint(e.target.value);
                  setRequestParams({});
                  setRequestResponse('');
                }}
                style={{ width: '100%', padding: '8px', backgroundColor: '#333', color: '#e0e0e0', border: 'none', borderRadius: '3px' }}
              >
                <option value="">-- Select an Endpoint --</option>
                {Object.keys(endpointOptions).map((endpoint) => (
                  <option key={endpoint} value={endpoint}>
                    {endpoint}
                  </option>
                ))}
              </select>
            </div>
            {selectedEndpoint && (
              <div style={{ marginTop: '15px' }}>
                {endpointOptions[selectedEndpoint].map((param) => (
                  <div key={param} style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#3498db' }}>{param}</label>
                    <input
                      type="text"
                      value={requestParams[param] || ''}
                      onChange={(e) => handleParamChange(param, e.target.value)}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#333', color: '#e0e0e0', border: 'none', borderRadius: '3px' }}
                      placeholder={`Enter ${param}`}
                    />
                  </div>
                ))}
                <button
                  onClick={handleSendRequest}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                >
                  Send Request
                </button>
                {requestResponse && (
                  <pre style={{ marginTop: '15px', padding: '10px', backgroundColor: '#333', borderRadius: '3px', overflowX: 'auto' }}>
                    {requestResponse}
                  </pre>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
