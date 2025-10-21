'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, FileText, Users as UsersIcon, Shield, Moon, Sun } from 'lucide-react';

function Topbar({ username, onSignOut, isAdmin }) {
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleSignOut = () => {
    onSignOut();
    setSignOutModalOpen(false);
  };

  return (
    <>
      <nav className={`topbar sticky top-0 z-50 backdrop-blur-xl border-b ${darkMode ? 'bg-[#0a0a0f]/80 border-purple-500/10' : 'bg-white/80 border-gray-200'}`}>
        <div className="topbar-container">
          <div className="brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#a100ff"/>
            </svg>
            <div className="brand-text">
              <div className="brand-letter">N</div>
              <div className="brand-name">Nebula</div>
            </div>
          </div>
          
          <div className="nav-menu hidden md:flex space-x-1">
            <div className="nav-item active">
              <Home className="w-4 h-4" />
              <div className="nav-text active">Home</div>
            </div>
            
            <Link href="/users" legacyBehavior>
              <a className="nav-item">
                <UsersIcon className="w-4 h-4" />
                <div className="nav-text">Users</div>
              </a>
            </Link>
            
            {isAdmin && (
              <Link href="/admin" legacyBehavior>
                <a className="nav-item">
                  <Shield className="w-4 h-4" />
                  <div className="nav-text">Admin</div>
                </a>
              </Link>
            )}
            
            <Link href="/docs" legacyBehavior>
              <a className="nav-item">
                <FileText className="w-4 h-4" />
                <div className="nav-text">Docs</div>
              </a>
            </Link>
          </div>
          
          <div className="right-menu">
            <div className="icon" onClick={() => {
              setDarkMode(!darkMode);
              document.body.classList.toggle('dark');
            }}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
            
            <div className="icon" onClick={() => setSignOutModalOpen(true)}>
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
                  <text x="50%" y="50%" textAnchor="middle" dy=".3em" fill="white" fontSize="20" fontFamily="'Inter', sans-serif">
                    {username?.[0]?.toUpperCase() || 'U'}
                  </text>
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {signOutModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setSignOutModalOpen(false)}>×</span>
            <h2>Sign Out</h2>
            <p>Are you sure you want to sign out?</p>
            <button onClick={handleSignOut} className="modal-button">Confirm</button>
            <button onClick={() => setSignOutModalOpen(false)} className="modal-button">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [discordId, setDiscordId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

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
      setIsAdmin(user.discordId === '1272720391462457400');
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
      setIsAdmin(discordId === '1272720391462457400');
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
      setIsAdmin(discordId === '1272720391462457400');
    } catch (error) {
      setError('An error occurred during registration');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUsername('');
    setDiscordId('');
    setIsAdmin(false);
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
      <Topbar username={username} onSignOut={handleSignOut} isAdmin={isAdmin} />
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
          <Link href="/docs">
            <button className="ripple-button hero-button">
              Get Started
            </button>
          </Link>
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
          <h2 className="docs-title">Quick Links</h2>
          <p className="docs-description">Explore our platform and community</p>
          <div className="docs-placeholder">
            <Link href="/docs">
              <div className="docs-card cursor-pointer hover:scale-105 transition-transform">
                <h3 className="docs-card-title">API Documentation</h3>
                <p className="docs-card-description">Detailed guides on integrating with our API.</p>
              </div>
            </Link>
            <Link href="/users">
              <div className="docs-card cursor-pointer hover:scale-105 transition-transform">
                <h3 className="docs-card-title">User Directory</h3>
                <p className="docs-card-description">Browse all members of the Nebula community.</p>
              </div>
            </Link>
            {isAdmin && (
              <Link href="/admin">
                <div className="docs-card cursor-pointer hover:scale-105 transition-transform">
                  <h3 className="docs-card-title">Admin Dashboard</h3>
                  <p className="docs-card-description">Manage users and view system statistics.</p>
                </div>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
