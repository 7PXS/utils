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
              <path d="M8.77491 2.0667L4.32491 4.53336C3.31658 5.0917 2.49158 6.4917 2.49158 7.6417V12.35C2.49158 13.5 3.31658 14.9 4.32491 15.3C3.31658 14.9 2.49158 13.5 2.49158 12.35V7.6417C2.49158 6.4917 3.31658 5.0917 4.32491 4.53336L8.77491 2.05836C9.72491 1.53336 11.2749 1.53336 12.2332 2.05836L16.6832 4.53336C17.6916 5.0917 18.5166 6.4917 18.5166 7.6417V12.35C18.5166 13.5 17.6916 14.9 16.6832 15.4583L12.2332 17.9334C11.2749 18.4584 9.72491 18.4584 8.77491 17.9334Z" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
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

function Sidebar() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Luarmor API Documentation', icon: '👑' },
    { id: 'user-manual', title: 'Luarmor User Manual & F.A.Q', icon: '📖' },
    { id: 'ad-system', title: 'Ad System (Rewards)', icon: '🎁' },
    { id: 'insane-optimization', title: 'Insane Optimization Tricks & LPH Macro Usage', icon: '⚡' },
    { id: 'verified-scripts', title: 'Verified / Safe Scripts', icon: '✅' },
    { id: 'identifying-scams', title: 'Identifying Common Scams', icon: '❌' },
    { id: 'source-locker', title: 'Source Locker', icon: '🔒' },
    { id: 'webhook-protection', title: 'Webhook Protection', icon: '🌐' },
    { id: 'status', title: '/status', icon: '' },
    { id: 'register-v1', title: '/register/v1', icon: '' },
    { id: 'auth-v1', title: '/auth/v1', icon: '' },
    { id: 'dAuth-v1', title: '/dAuth/v1', icon: '' },
    { id: 'files-v1', title: '/files/v1', icon: '' },
    { id: 'scripts-list', title: '/scripts-list', icon: '' },
    { id: 'manage-v1', title: '/manage/v1', icon: '' },
    { id: 'login-v1', title: '/login/v1', icon: '' },
    { id: 'users-v1', title: '/users/v1', icon: '' },
    { id: 'reset-hwid-v1', title: '/reset-hwid/v1', icon: '' },
    { id: 'keys-details', title: '/keys/:api_key/details', icon: '' },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.icon && <span className="sidebar-icon">{section.icon}</span>}
            <span className="sidebar-text">{section.title}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}

function ResponseCard({ endpoint, method, responses }) {
  const [activeTab, setActiveTab] = useState(Object.keys(responses)[0]);

  return (
    <div className="response-card" id={endpoint.replace(/\//g, '-').replace(/:/g, '')}>
      <div className="request-header">
        <span className="method">{method}</span>
        <span className="endpoint">{endpoint}</span>
      </div>
      <div className="tab-buttons">
        {Object.keys(responses).map((status) => (
          <button
            key={status}
            className={`tab-button ${activeTab === status ? 'active' : ''}`}
            onClick={() => setActiveTab(status)}
          >
            {status}
          </button>
        ))}
      </div>
      <div className="response-content">
        <pre className="language-json">
          {JSON.stringify(responses[activeTab], null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  return (
    <div className="landing-page" style={{ backgroundColor: '#1a1a1a', color: '#e0e0e0' }}>
      <Topbar username={username} onSignOut={handleSignOut} />
      <div className="content-wrapper">
        <Sidebar />
        <div className="main-content" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <section className="docs-section" id="overview">
            <h1 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '20px' }}>Nebula Middleware Documentation</h1>

            <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Overview</h2>
              <p style={{ margin: '10px 0' }}>
                The Nebula Middleware handles API requests for user management, authentication, and script access, integrated with Vercel Blob for storage and Discord webhooks for logging. Most endpoints require a <code>User-Agent: Roblox/WinInet</code> header for security. Logs are sent to Discord with INFO, SUCCESS, WARN, and ERROR statuses.
              </p>
            </div>
          </section>

          <section className="docs-section" id="user-manual">
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>User Manual & F.A.Q</h2>
            <p style={{ margin: '10px 0' }}>Detailed user guide and frequently asked questions.</p>
          </section>

          <section className="docs-section" id="ad-system">
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Ad System (Rewards)</h2>
            <p style={{ margin: '10px 0' }}>Information about the ad system and rewards.</p>
          </section>

          <section className="docs-section" id="insane-optimization">
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Insane Optimization Tricks & LPH Macro Usage</h2>
            <p style={{ margin: '10px 0' }}>Tips for optimization and macro usage.</p>
          </section>

          <section className="docs-section" id="verified-scripts">
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Verified / Safe Scripts</h2>
            <p style={{ margin: '10px 0' }}>List of verified and safe scripts.</p>
          </section>

          <section className="docs-section" id="identifying-scams">
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Identifying Common Scams</h2>
            <p style={{ margin: '10px 0' }}>Guide to identifying common scams.</p>
          </section>

          <section className="docs-section" id="source-locker">
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Source Locker</h2>
            <p style={{ margin: '10px 0' }}>Details about source locker functionality.</p>
          </section>

          <section className="docs-section" id="webhook-protection">
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Webhook Protection</h2>
            <p style={{ margin: '10px 0' }}>Information on webhook protection features.</p>
          </section>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }} id="status">
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>API Endpoints</h2>
            <p>Below are the available endpoints, their parameters, and requirements:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '10px' }}>
              <li>
                <strong>/status</strong> - Check API status
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                  <li>Method: GET</li>
                  <li>Parameters: None</li>
                  <li>Headers: <code>User-Agent: Roblox/WinInet</code></li>
                  <li>Returns: API version, status, and message</li>
                  <li>Example: <code>GET https://utils32.vercel.app/status</code></li>
                </ul>
              </li>
              <li>
                <strong>/register/v1</strong> - Register a new user
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                  <li>Method: GET</li>
                  <li>Parameters: <code>ID</code> (Discord ID), <code>time</code> (duration, e.g., "100s", "100m", "100h", "100d", "100mo", "100yr"), <code>username</code> (3-20 chars, alphanumeric or underscore)</li>
                  <li>Headers: <code>User-Agent: Roblox/WinInet</code></li>
                  <li>Returns: User data with generated key, creation, and expiration time</li>
                  <li>Notes: Checks for duplicate Discord ID or username; generates 14-char key</li>
                  <li>Example: <code>GET https://utils32.vercel.app/register/v1?ID=123&time=100d&username=john_doe</code></li>
                </ul>
              </li>
              <li>
                <strong>/auth/v1</strong> - Authenticate with key and HWID
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                  <li>Method: GET</li>
                  <li>Parameters: <code>hwid</code> (hardware ID), <code>key</code> (user key), <code>gameId</code> (optional, for script validation)</li>
                  <li>Headers: <code>User-Agent: Roblox/WinInet</code></li>
                  <li>Returns: User data, game validation, and script code if gameId provided</li>
                  <li>Notes: Binds HWID if unset; checks key expiration</li>
                  <li>Example: <code>GET https://utils32.vercel.app/auth/v1?hwid=abc123&key=XYZ789&gameId=456</code></li>
                </ul>
              </li>
              <li>
                <strong>/dAuth/v1</strong> - Authenticate with Discord ID
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                  <li>Method: GET</li>
                  <li>Parameters: <code>ID</code> (Discord ID), <code>gameId</code> (optional, for script validation)</li>
                  <li>Headers: None</li>
                  <li>Returns: User data, game validation, and script code if gameId provided</li>
                  <li>Notes: Checks key expiration; no User-Agent required</li>
                  <li>Example: <code>GET https://utils32.vercel.app/dAuth/v1?ID=123&gameId=456</code></li>
                </ul>
              </li>
              <li>
                <strong>/files/v1</strong> - Fetch a script by filename
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                  <li>Method: GET</li>
                  <li>Parameters: <code>file</code> (script filename, case-insensitive), <code>key</code> (user key for authentication)</li>
                  <li>Headers: <code>User-Agent: Roblox/WinInet</code>, <code>Authorization: Bearer XYZ789</code></li>
                  <li>Returns: Script data if key is valid and not expired</li>
                  <li>Example: <code>GET https://utils32.vercel.app/files/v1?file=script1.lua&key=XYZ789</code></li>
                </ul>
              </li>
              <li>
                <strong>/scripts-list</strong> - List all script names (admin only)
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                  <li>Method: GET</li>
                  <li>Parameters: None</li>
                  <li>Headers: <code>User-Agent: Roblox/WinInet</code>, <code>Authorization: UserMode-2d93n2002n8</code></li>
                  <li>Returns: Array of script names</li>
                  <li>Example: <code>GET https://utils32.vercel.app/scripts-list</code></li>
                </ul>
              </li>
              <li>
                <strong>/manage/v1</strong> - Manage users (admin only)
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                  <li>Method: GET (list), POST (update, delete)</li>
                  <li>Parameters: <code>action</code> (list, update, delete)</li>
                  <li>Headers: <code>User-Agent: Roblox/WinInet</code>, <code>Authorization: Bearer {discordId}</code></li>
                  <li>Actions:
                    <ul style={{ listStyleType: 'square', paddingLeft: '20px' }}>
                      <li><strong>list</strong>: No additional params; returns all users</li>
                      <li><strong>update</strong>: Body requires <code>discordId</code>, <code>username</code>, <code>endTime</code>, optional <code>hwid</code></li>
                      <li><strong>delete</strong>: Body requires <code>discordId</code></li>
                    </ul>
                  </li>
                  <li>Notes: Admin Discord ID: 1272720391462457400</li>
                  <li>Example: <code>GET https://utils32.vercel.app/manage/v1?action=list</code></li>
                </ul>
              </li>
              <li>
                <strong>/login/v1</strong> - Login with Discord ID and username
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                  <li>Method: GET</li>
                  <li>Parameters: <code>ID</code> (Discord ID), <code>username</code></li>
                  <li>Headers: None</li>
                  <li>Returns: User data if valid and not expired</li>
                  <li>Example: <code>GET https://utils32.vercel.app/login/v1?ID=123&username=john_doe</code></li>
                </ul>
              </li>
              <li>
                <strong>/users/v1</strong> - List all users
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                  <li>Method: GET</li>
                  <li>Parameters: None</li>
                  <li>Headers: <code>User-Agent: Roblox/WinInet</code></li>
                  <li>Returns: Array of all user data</li>
                  <li>Example: <code>GET https://utils32.vercel.app/users/v1</code></li>
                </ul>
              </li>
              <li>
                <strong>/reset-hwid/v1</strong> - Reset HWID
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
                  <li>Method: GET</li>
                  <li>Parameters: None</li>
                  <li>Headers: <code>Authorization: Bearer {discordId}</code></li>
                  <li>Returns: Success message if reset is allowed</li>
                  <li>Notes: 2 resets/day limit, unlimited for admin (Discord ID: 1272720391462457400)</li>
                  <li>Example: <code>GET https://utils32.vercel.app/reset-hwid/v1</code></li>
                </ul>
              </li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }} id="keys-details">
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Detailed API Responses</h2>
            <ResponseCard
              endpoint="https://api.luarmor.net/v3/keys/:api_key/details"
              method="GET"
              responses={{
                '200': { success: true, message: 'API key details retrieved' },
                '403': { success: false, message: 'Wrong API key' },
                '400': { success: false, message: 'Invalid API key' }
              }}
            />
          </div>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }} id="scripts-list">
            <ResponseCard
              endpoint="https://utils32.vercel.app/scripts-list"
              method="GET"
              responses={{
                '200': { success: true, scripts: ['script1', 'script2', 'script3'] },
                '401': { success: false, error: 'Unauthorized' },
                '500': { success: false, error: 'Failed to fetch scripts' }
              }}
            />
          </div>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }} id="auth-v1">
            <ResponseCard
              endpoint="https://utils32.vercel.app/auth/v1"
              method="GET"
              responses={{
                '200': {
                  success: true,
                  key: 'AbCdEfGhIjKlMn',
                  hwid: '1234567890',
                  discordId: '123456789012345678',
                  username: 'user123',
                  createTime: 1625097600,
                  endTime: 1656633600,
                  Games: { ValidGame: true, Code: 'https://example.com/script.js' }
                },
                '400': { success: false, error: 'Missing key or hwid' },
                '401': { success: false, error: 'Invalid key' }
              }}
            />
          </div>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }} id="dAuth-v1">
            <ResponseCard
              endpoint="https://utils32.vercel.app/dAuth/v1"
              method="GET"
              responses={{
                '200': {
                  success: true,
                  key: 'AbCdEfGhIjKlMn',
                  hwid: '1234567890',
                  discordId: '123456789012345678',
                  username: 'user123',
                  createTime: 1625097600,
                  endTime: 1656633600,
                  Games: { ValidGame: true, Code: 'https://example.com/script.js' }
                },
                '400': { success: false, error: 'Missing Discord ID' },
                '401': { success: false, error: 'Key expired' }
              }}
            />
          </div>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }} id="files-v1">
            <ResponseCard
              endpoint="https://utils32.vercel.app/files/v1"
              method="GET"
              responses={{
                '200': { GameID: '12345', Code: 'https://example.com/script.js' },
                '400': { success: false, error: 'Missing file name or key' },
                '401': { success: false, error: 'Invalid key' }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
