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
      <div className="landing-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <section className="docs-section">
          <h1 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '20px' }}>Nebula Middleware Documentation</h1>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Overview</h2>
            <p style={{ margin: '10px 0' }}>
              The Nebula Middleware handles API requests for user management, authentication, and script access, integrated with Vercel Blob for storage and Discord webhooks for logging. Most endpoints require a <code>User-Agent: Roblox/WinInet</code> header for security. Logs are sent to Discord with INFO, SUCCESS, WARN, and ERROR statuses.
            </p>
          </div>

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
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
                  <li>Response: <pre style={{ margin: '5px 0', color: '#e0e0e0' }}>{`{"version": "v3", "active": true, "message": "API is up and working!", "warning": false, "warning_message": "No warning"}`}</pre></li>
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

          <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '10px' }}>Detailed API Responses</h2>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>GET /scripts-list</h3>
            <p>Retrieve a list of available script names.</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`["script1", "script2", "script3"]`}
            </pre>
            <p><strong>401: Unauthorized</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Unauthorized"
}`}
            </pre>
            <p><strong>500: Internal Server Error</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Failed to fetch scripts"
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>GET /auth/v1</h3>
            <p>Authenticate a user with a key and hardware ID (HWID). Optionally validate a game ID.</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "success": true,
  "key": "AbCdEfGhIjKlMn",
  "hwid": "1234567890",
  "discordId": "123456789012345678",
  "username": "user123",
  "createTime": 1625097600,
  "endTime": 1656633600,
  "Games": {
    "ValidGame": true,
    "Code": "https://example.com/script.js"
  }
}`}
            </pre>
            <p><strong>400: Bad Request</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing key or hwid"
}`}
            </pre>
            <p><strong>401: Unauthorized</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Invalid key"
}`}
            </pre>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Invalid HWID"
}`}
            </pre>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Key expired"
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>GET /dAuth/v1</h3>
            <p>Authenticate a user with a Discord ID. Optionally validate a game ID.</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "success": true,
  "key": "AbCdEfGhIjKlMn",
  "hwid": "1234567890",
  "discordId": "123456789012345678",
  "username": "user123",
  "createTime": 1625097600,
  "endTime": 1656633600,
  "Games": {
    "ValidGame": true,
    "Code": "https://example.com/script.js"
  }
}`}
            </pre>
            <p><strong>400: Bad Request</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing Discord ID"
}`}
            </pre>
            <p><strong>401: Unauthorized</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Key expired"
}`}
            </pre>
            <p><strong>404: Not Found</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "No user found with this Discord ID"
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>GET /files/v1</h3>
            <p>Retrieve a script file based on filename and key.</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "GameID": "12345",
  "Code": "https://example.com/script.js"
}`}
            </pre>
            <p><strong>400: Bad Request</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing file name or key"
}`}
            </pre>
            <p><strong>401: Unauthorized</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Invalid key"
}`}
            </pre>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Key expired"
}`}
            </pre>
            <p><strong>404: Not Found</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "File not found"
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>GET /manage/v1?action=list</h3>
            <p>List all users (admin only).</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "success": true,
  "users": [
    {
      "key": "AbCdEfGhIjKlMn",
      "hwid": "1234567890",
      "discordId": "123456789012345678",
      "username": "user123",
      "createTime": 1625097600,
      "endTime": 1656633600
    }
  ]
}`}
            </pre>
            <p><strong>400: Bad Request</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing action parameter"
}`}
            </pre>
            <p><strong>401: Unauthorized</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing or invalid Authorization header"
}`}
            </pre>
            <p><strong>403: Forbidden</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Unauthorized - Admin access required"
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>POST /manage/v1?action=update</h3>
            <p>Update a user's details (admin only).</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "success": true,
  "user": {
    "key": "AbCdEfGhIjKlMn",
    "hwid": "1234567890",
    "discordId": "123456789012345678",
    "username": "user123",
    "createTime": 1625097600,
    "endTime": 1656633600
  }
}`}
            </pre>
            <p><strong>400: Bad Request</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing required fields (discordId, username, endTime)"
}`}
            </pre>
            <p><strong>404: Not Found</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "User not found"
}`}
            </pre>
            <p><strong>401: Unauthorized</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing or invalid Authorization header"
}`}
            </pre>
            <p><strong>403: Forbidden</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Unauthorized - Admin access required"
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>POST /manage/v1?action=delete</h3>
            <p>Delete a user (admin only).</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "success": true
}`}
            </pre>
            <p><strong>400: Bad Request</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing discordId"
}`}
            </pre>
            <p><strong>404: Not Found</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "User not found"
}`}
            </pre>
            <p><strong>401: Unauthorized</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing or invalid Authorization header"
}`}
            </pre>
            <p><strong>403: Forbidden</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Unauthorized - Admin access required"
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>GET /register/v1</h3>
            <p>Register a new user with Discord ID, username, and time duration.</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "success": true,
  "key": "AbCdEfGhIjKlMn",
  "hwid": "",
  "discordId": "123456789012345678",
  "username": "user123",
  "createTime": 1625097600,
  "endTime": 1656633600
}`}
            </pre>
            <p><strong>400: Bad Request</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing Discord ID, time, or username"
}`}
            </pre>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Username must be 3-20 characters and contain only letters, numbers, or underscores"
}`}
            </pre>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Invalid time format. Use format like 100s, 100m, 100h, 100d, 100mo, or 100yr"
}`}
            </pre>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "User already registered"
}`}
            </pre>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Username already taken"
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>GET /login/v1</h3>
            <p>Log in a user with Discord ID and username.</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "success": true,
  "key": "AbCdEfGhIjKlMn",
  "hwid": "1234567890",
  "discordId": "123456789012345678",
  "username": "user123",
  "createTime": 1625097600,
  "endTime": 1656633600
}`}
            </pre>
            <p><strong>400: Bad Request</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing Discord ID or username"
}`}
            </pre>
            <p><strong>401: Unauthorized</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Invalid username"
}`}
            </pre>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Key expired"
}`}
            </pre>
            <p><strong>404: Not Found</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "No user found with this Discord ID"
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>GET /users/v1</h3>
            <p>Retrieve a list of all users.</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "success": true,
  "users": [
    {
      "key": "AbCdEfGhIjKlMn",
      "hwid": "1234567890",
      "discordId": "123456789012345678",
      "username": "user123",
      "createTime": 1625097600,
      "endTime": 1656633600
    }
  ]
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>GET /reset-hwid/v1</h3>
            <p>Reset the HWID for a user.</p>
            <p><strong>200: OK</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "success": true,
  "message": "HWID reset successfully"
}`}
            </pre>
            <p><strong>400: Bad Request</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Missing Discord ID"
}`}
            </pre>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "No HWID set"
}`}
            </pre>
            <p><strong>404: Not Found</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "User not found"
}`}
            </pre>
            <p><strong>429: Too Many Requests</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "HWID reset limit reached (2/day)"
}`}
            </pre>
            <p><strong>500: Internal Server Error</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Internal server error"
}`}
            </pre>

            <h3 style={{ fontSize: '1.25em', marginTop: '15px' }}>General Middleware Errors</h3>
            <p><strong>404: Not Found (Unauthorized User-Agent)</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Unauthorized"
}`}
            </pre>
            <p><strong>500: Internal Server Error (General)</strong></p>
            <pre style={{ backgroundColor: '#333', padding: '10px', borderRadius: '3px' }}>
              {`{
  "error": "Internal server error"
}`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
