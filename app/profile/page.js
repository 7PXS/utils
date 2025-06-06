'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function Topbar({ username, onSignOut }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(username || 'User');
  const [brandName, setBrandName] = useState('Nebula');
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const savedProfilePicture = localStorage.getItem('profilePicture');
    if (savedProfilePicture) {
      setProfilePicture(savedProfilePicture);
    }
  }, []);

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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfilePicture(base64String);
        localStorage.setItem('profilePicture', base64String);
      };
      reader.readAsDataURL(file);
    }
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
            <a className="nav-item" onClick={() => {}}>
              <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.01666 2.3667L3.525 5.8667C2.775 6.45003 2.16666 7.6917 2.16666 8.63337V14.8084C2.16666 16.7417 3.7416 18.325 6.83333 18.325H14.1667C17.2583 18.325 18.8333 16.7417 18.8333 14.8667V8.75003C18.8333 7.7417 18.1583 6.45003 17.3333 5.87503L12.1833 2.2667C11.0167 1.45003 9.14166 1.4917 8.01666 2.3667Z" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 14.9916V12.4916" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="nav-text">Home</div>
            </a>
          </Link>
          <Link href="/docs" legacyBehavior>
            <a className="nav-item" onClick={() => {}}>
              <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.1416 6.19995L10.4999 10.4583L17.8083 6.22495" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 18.0083V10.45" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.77491 2.0667L4.32491 4.53336C3.31658 5.0917 2.49158 6.4917 2.49158 7.6417V12.35C2.49158 13.5 3.31658 14.9 4.32491 15.4583L8.77491 17.9334C9.72491 18.4584 11.2832 18.4584 12.2332 17.9334L16.6832 15.4583C17.6916 14.9 18.5166 13.5 18.5166 12.35V7.6417C18.5166 6.4917 17.6916 5.0917 16.6832 4.53336L12.2332 2.05836C11.2749 1.53336 9.72491 1.53336 8.77491 2.0667Z" stroke="#CFD1D4" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="nav-text">Docs</div>
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
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="absolute opacity-0 w-full h-full cursor-pointer"
            />
            <Link href="/profile?from=dashboard">
              <div className="icon">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="20" fill="#a100ff"/>
                    <text x="50%" y="50%" textAnchor="middle" dy=".3em" fill="white" fontSize="20" fontFamily="'Inter', sans-serif">
                      {profileName[0].toUpperCase()}
                    </text>
                  </svg>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
      {profileModalOpen && (
        <div className="modal">
          <div className="modal-content p-6">
            <span className="close" onClick={closeModal}>×</span>
            <h2>Profile</h2>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your Name"
              className="modal-input w-full p-3 text-lg"
            />
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your Brand"
              className="modal-input w-full p-3 text-lg"
            />
            <button onClick={saveProfile} className="modal-button text-lg py-3 px-6 w-full mt-4">Save</button>
            <button onClick={closeModal} className="modal-button text-lg py-3 px-6 w-full mt-2">Cancel</button>
          </div>
        </div>
      )}
      {signOutModalOpen && (
        <div className="modal">
          <div className="modal-content p-6">
            <span className="close" onClick={closeModal}>×</span>
            <h2>Sign Out</h2>
            <p>Are you sure you want to sign out?</p>
            <button onClick={handleSignOut} className="modal-button text-lg py-3 px-6 w-full mt-4">Confirm</button>
            <button onClick={closeModal} className="modal-button text-lg py-3 px-6 w-full mt-2">Cancel</button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function UserProfile() {
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hwid, setHwid] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserData = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('No user found. Please log in.');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setUsername(user.username);
      setDiscordId(user.discordId);
      setIsAdmin(user.discordId === '1272720391462457400');

      const response = await fetch(`/dAuth/v1?ID=${encodeURIComponent(user.discordId)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch user data');
      }

      setHwid(data.hwid || 'Not set');
      setKey(data.key || 'Not set');
      setJoinDate(new Date(data.createTime * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }));
      setEndDate(new Date(data.endTime * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResetHwid = async () => {
    if (!discordId) {
      setError('No Discord ID found');
      return;
    }

    try {
      const response = await fetch('/reset-hwid/v1', {
        headers: {
          Authorization: `Bearer ${discordId}`,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset HWID');
      }

      setHwid('');
      setError('');
      alert('HWID reset successfully');
    } catch (error) {
      setError('Error resetting HWID: ' + error.message);
    }
  };

  const handleAddTime = () => {
    console.log('Add Time to Key clicked - placeholder functionality');
    alert('This feature is coming soon!');
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('profilePicture');
    window.location.href = '/';
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <div className="landing-page">
      <Topbar username={username} onSignOut={handleSignOut} />
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${Math.random() * 20 + 10}s`,
          }}
        />
      ))}
      <div className="landing-container">
        {error && <p className="login-error">{error}</p>}
        <h1 className="hero-title text-4xl text-center mb-8">{username || 'Loading...'}</h1>
        <div className="feature-card p-6">
          <h2 className="feature-card-title text-2xl mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="badge">Discord ID: {discordId || 'Loading...'}</div>
            <div className="badge">Joined: {joinDate || 'Loading...'}</div>
            <div className="badge">Subscription Ends: {endDate || 'Loading...'}</div>
            <div className="badge">HWID: {hwid}</div>
            <div className="badge">Key: {key}</div>
          </div>
          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={(e) => {
                handleResetHwid();
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.left = `${e.clientX - rect.left}px`;
                ripple.style.top = `${e.clientY - rect.top}px`;
                button.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
              }}
              className="ripple-button login-button text-lg py-3 px-6"
            >
              Reset HWID {isAdmin && '(Unlimited)'}
            </button>
            <button
              onClick={(e) => {
                handleAddTime();
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.left = `${e.clientX - rect.left}px`;
                ripple.style.top = `${e.clientY - rect.top}px`;
                button.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
              }}
              className="ripple-button login-button text-lg py-3 px-6"
            >
              Add Time to Key
            </button>
          </div>
        </div>

        <div className="feature-card mt-12 p-6">
          <h2 className="feature-card-title text-2xl mb-4">Helpful Information</h2>
          <p className="feature-card-description text-lg">
            Manage your Nebula subscription effectively:
          </p>
          <ul className="list-disc list-inside text-gray-200 text-base space-y-3 mt-4">
            <li>Check your subscription end date to ensure uninterrupted access.</li>
            <li>Use the "Reset HWID" button if you need to change your hardware ID.</li>
            <li>Contact support via Discord for assistance with your key.</li>
            <li>Visit our docs for detailed guides on using Nebula.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
