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
      const response = await fetch(`/login/v1?ID=${encodeURIComponent(user.discordId)}&username=${encodeURIComponent(user.username)}`);
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

      const headers = {};
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
  };

  return (
    <div className="landing-page">
      <Topbar username={username} onSignOut={handleSignOut} />
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
      <div className="landing-container">
        <section className="hero-section">
          <h1 className="hero-title">Nebula Documentation</h1>
          <p className="hero-description">Comprehensive guides and API references for using Nebula's whitelisting service.</p>
        </section>

        <section className="docs-section">
          <h2 className="docs-title">Getting Started</h2>
          <div className="docs-card">
            <h3 className="docs-card-title">Introduction</h3>
            <p className="docs-card-description">
              Nebula is a secure whitelisting service designed for Discord-based user management. It supports user registration, authentication, script access, and admin controls using Vercel Blob Storage and Edge Config.
            </p>
          </div>
          <div className="docs-card">
            <h3 className="docs-card-title">Quick Start</h3>
            <p className="docs-card-description">
              1. Register a user via <code>/register/v1</code> with a Discord ID, username, and optional duration.<br/>
              2. Authenticate using <code>/auth/v1</code> or <code>/dAuth/v1</code> with your key or Discord ID.<br/>
              3. Access scripts via <code>/files/v1</code> with a valid key.<br/>
              4. Admins can manage users via <code>/manage/v1</code> (requires Discord ID: 1272720391462457400).
            </p>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-title">API Reference</h2>
          <div className="docs-card">
            <h3 className="docs-card-title">Endpoints</h3>
            <p className="docs-card-description">
              Below is a list of available API endpoints. Use the interactive tool to test them.
            </p>
            <ul className="list-disc list-inside text-gray-200 text-base space-y-3 mt-4">
              <li><strong>/register/v1</strong>: Register a new user (ID, time, username).</li>
              <li><strong>/auth/v1</strong>: Authenticate with key and HWID (hwid, key).</li>
              <li><strong>/dAuth/v1</strong>: Authenticate with Discord ID (ID, gameId).</li>
              <li><strong>/files/v1</strong>: Fetch a script by filename (file).</li>
              <li><strong>/manage/v1</strong>: Admin user management (action=list|update|delete).</li>
              <li><strong>/scripts-list</strong>: List all script names (admin only).</li>
              <li><strong>/login/v1</strong>: Login with Discord ID and username (ID, username).</li>
              <li><strong>/reset-hwid/v1</strong>: Reset HWID (2/day limit, unlimited for admin).</li>
            </ul>
          </div>
          <div className="docs-card">
            <h3 className="docs-card-title">Interactive API Tester</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select Endpoint</label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => {
                    setSelectedEndpoint(e.target.value);
                    setRequestParams({});
                    setRequestResponse('');
                  }}
                  className="modal-input w-full p-3 text-lg"
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
                <div className="space-y-4">
                  {endpointOptions[selectedEndpoint].map((param) => (
                    <div key={param}>
                      <label className="block text-sm text-gray-400 mb-2">{param}</label>
                      <input
                        type="text"
                        value={requestParams[param] || ''}
                        onChange={(e) => handleParamChange(param, e.target.value)}
                        className="modal-input w-full p-3 text-lg"
                        placeholder={`Enter ${param}`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleSendRequest}
                    className="ripple-button login-button text-lg py-3 px-6 w-full"
                  >
                    Send Request
                  </button>
                  {requestResponse && (
                    <pre className="mt-4 p-4 rounded-md bg-gray-800 text-gray-200 text-base overflow-auto max-h-60">
                      {requestResponse}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="docs-section">
          <h2 className="docs-title">Admin Guide</h2>
          <div className="docs-card">
            <h3 className="docs-card-title">Managing Users</h3>
            <p className="docs-card-description">
              Admins (Discord ID: 1272720391462457400) can use <code>/manage/v1</code> to list, update, or delete users. Example actions:
              <ul className="list-disc list-inside text-gray-200 text-base space-y-3 mt-4">
                <li><strong>List Users</strong>: <code>/manage/v1?action=list</code></li>
                <li><strong>Update User</strong>: POST to <code>/manage/v1?action=update</code> with JSON body (username, endTime, hwid).</li>
                <li><strong>Delete User</strong>: POST to <code>/manage/v1?action=delete</code> with JSON body (discordId).</li>
              </ul>
            </p>
          </div>
          <div className="docs-card">
            <h3 className="docs-card-title">Script Management</h3>
            <p className="docs-card-description">
              Use <code>/scripts-list</code> to view available scripts and <code>/files/v1</code> to fetch specific scripts. Requires admin authorization header: <code>UserMode-2d93n2002n8</code>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
