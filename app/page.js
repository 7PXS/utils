'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function Topbar({ username, onSignOut }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(username || 'User');
  const [brandName, setBrandName] = useState('Nebula');
  const [activeNav, setActiveNav] = useState('Home');

  const setActive = (section) => {
    setActiveNav(section);
  };

  const openProfileModal = () => {
    setProfileModalOpen(true);
  };

  const openSignOutModal = () => {
    setSignOutModalOpen(true);
  };

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
          <div
            className={`nav-item ${activeNav === 'Home' ? 'active' : ''}`}
            onClick={() => setActive('Home')}
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.01666 2.3667L3.525 5.8667C2.775 6.45003 2.16666 7.6917 2.16666 8.63337V14.8084C2.16666 16.7417 3.7416 18.325 6.83333 18.325H14.1667C17.2583 18.325 18.8333 16.7417 18.8333 14.8667V8.75003C18.8333 7.7417 18.1583 6.45003 17.3333 5.87503L12.1833 2.2667C11.0167 1.45003 9.14166 1.4917 8.01666 2.3667Z" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.5 14.9916V12.4916" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={`nav-text ${activeNav === 'Home' ? 'active' : ''}`}>Home</div>
          </div>
          <Link href="/docs" legacyBehavior>
            <a
              className={`nav-item ${activeNav === 'Docs' ? 'active' : ''}`}
              onClick={() => setActive('Docs')}
            >
              <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.1416 6.19995L10.4999 10.4583L17.8083 6.22495" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 18.0083V10.45" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.77491 2.0667L4.32491 4.53336C3.31658 5.0917 2.49158 6.4917 2.49158 7.6417V12.35C2.49158 13.5 3.31658 14.9 4.32491 15.4583L8.77491 17.9334C9.72491 18.4584 11.2832 18.4584 12.2332 17.9334L16.6832 15.4583C17.6916 14.9 18.5166 13.5 18.5166 12.35V7.6417C18.5166 6.4917 17.6916 5.0917 16.6832 4.53336L12.2332 2.05836C11.2749 1.53336 9.72491 1.53336 8.77491 2.0667Z" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className={`nav-text ${activeNav === 'Docs' ? 'active' : ''}`}>Docs</div>
            </a>
          </Link>
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

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [discordId, setDiscordId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

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
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setError('Error checking authentication');
      setIsAuthenticated(false);
      return false;
    }
  };

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
    } catch (error) {
      setError('An error occurred during login');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/register/v1?ID=${encodeURIComponent(discordId)}&time=30d&username=${encodeURIComponent(username)}`, {
        headers: {
          'User-Agent': 'Roblox/WinInet'
        }
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Registration failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify({ discordId, username }));
      setIsAuthenticated(true);
    } catch (error) {
      setError('An error occurred during registration');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUsername('');
    setDiscordId('');
  };

  useEffect(() => {
    checkAuth();
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
              <p className="login-error">{error}</p>
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
                      d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.045-.319 13.579.193 18.07a.082.082 0 00.031.056 19.874 19.874 0 005.992 3.03.077.077 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.009-.128 10.51 10.51 0 00.372-.292.074.074 0 01.077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.372.292a.077.077 0 01-.01.129 13.114 13.114 0 01-1.873.892.076.076 0 00-.04.106c.36.698.771 1.362 1.225 1.993a.076.076 0 00.084.028 19.846 19.846 0 006.003-3.03.077.077 0 00.032-.054c.5-4.499-.838-9.14-3.118-13.701a.07.07 0 00-.032-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
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
          <h1 className="hero-title">Welcome to Nebula</h1>
          <p className="hero-description">Your premier whitelisting service for secure and seamless access.</p>
          <button
            className="ripple-button hero-button"
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
            Get Started
          </button>
        </section>
        <section className="features-section">
          <h2 className="features-title">Why Choose Nebula?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3 className="feature-card-title">Secure Whitelisting</h3>
              <p className="feature-card-description">Robust authentication to ensure only authorized users gain access.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-card-title">Easy Integration</h3>
              <p className="feature-card-description">Seamlessly integrate Nebula with your existing systems.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-card-title">24/7 Support</h3>
              <p className="feature-card-description">Our team is always here to assist you, day or night.</p>
            </div>
          </div>
        </section>
        <section className="docs-section">
          <h2 className="docs-title">Documentation</h2>
          <p className="docs-description">Explore our comprehensive guides to get started with Nebula.</p>
          <div className="docs-placeholder">
            <div className="docs-card">
              <h3 className="docs-card-title">Getting Started</h3>
              <p className="docs-card-description">Learn how to set up Nebula in a few simple steps.</p>
            </div>
            <div className="docs-card">
              <h3 className="docs-card-title">API Reference</h3>
              <p className="docs-card-description">Detailed documentation for integrating with our API.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
