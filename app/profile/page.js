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

export default function UserProfile() {
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hwid, setHwid] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [requestParams, setRequestParams] = useState({});
  const [requestResponse, setRequestResponse] = useState('');

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserData, setEditUserData] = useState({});

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

      if (user.discordId === '1272720391462457400') {
        fetchUsers();
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchUsers = async () => {
    if (!discordId) {
      setError('Discord ID not set. Please refresh the page.');
      return;
    }
    try {
      const response = await fetch('/manage/v1?action=list', {
        headers: {
          Authorization: `Bearer ${discordId}`,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error) {
      setError('Error fetching users: ' + error.message);
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

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${discordId}`,
        },
      });
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
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.discordId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({ ...user });
  };

  const handleEditChange = (key, value) => {
    setEditUserData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveUser = async () => {
    try {
      const response = await fetch('/manage/v1?action=update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${discordId}`,
        },
        body: JSON.stringify(editUserData),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user');
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.discordId === editUserData.discordId ? editUserData : user
        )
      );
      setFilteredUsers((prev) =>
        prev.map((user) =>
          user.discordId === editUserData.discordId ? editUserData : user
        )
      );
      setSelectedUser(null);
      alert('User updated successfully');
    } catch (error) {
      setError('Error updating user: ' + error.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await fetch('/manage/v1?action=delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${discordId}`,
        },
        body: JSON.stringify({ discordId: selectedUser.discordId }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers((prev) =>
        prev.filter((user) => user.discordId !== selectedUser.discordId)
      );
      setFilteredUsers((prev) =>
        prev.filter((user) => user.discordId !== selectedUser.discordId)
      );
      setSelectedUser(null);
      alert('User deleted successfully');
    } catch (error) {
      setError('Error deleting user: ' + error.message);
    }
  };

  const handleResetUserHwid = async () => {
    try {
      const response = await fetch('/reset-hwid/v1', {
        headers: {
          Authorization: `Bearer ${selectedUser.discordId}`,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset HWID');
      }

      setEditUserData((prev) => ({ ...prev, hwid: '' }));
      alert('HWID reset successfully for user');
    } catch (error) {
      setError('Error resetting HWID for user: ' + error.message);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const endpointOptions = {
    '/register/v1': ['ID', 'time', 'username'],
    '/auth/v1': ['hwid', 'key'],
    '/dAuth/v1': ['ID'],
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
        {error && (
          <p className="login-error">{error}</p>
        )}
        <div className="profile-card">
          <div className="flex items-center mb-6">
            <span className="text-5xl font-extrabold mr-4 text-purple-500">U</span>
            <h1 className="hero-title">{username || 'Loading...'}</h1>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="badge">Discord ID: {discordId || 'Loading...'}</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="badge">Joined: {joinDate || 'Loading...'}</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="badge">Subscription Ends: {endDate || 'Loading...'}</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="badge">HWID: {hwid}</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="badge">Key: {key}</span>
            </div>
            <div className="flex justify-center gap-4">
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
                className="ripple-button login-button"
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
                className="ripple-button login-button"
              >
                Add Time to Key
              </button>
            </div>
          </div>
          <div className="feature-card mt-8">
            <h2 className="feature-card-title">Helpful Information</h2>
            <p className="feature-card-description">
              Manage your Nebula subscription effectively:
            </p>
            <ul className="list-disc list-inside text-gray-200 text-sm space-y-2">
              <li>Check your subscription end date to ensure uninterrupted access.</li>
              <li>Use the "Reset HWID" button if you need to change your hardware ID.</li>
              <li>Contact support via Discord for assistance with your key.</li>
              <li>Visit our docs for detailed guides on using Nebula.</li>
            </ul>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-8">
            <div className="feature-card">
              <h2 className="feature-card-title">Request Sender</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Select Endpoint</label>
                  <select
                    value={selectedEndpoint}
                    onChange={(e) => {
                      setSelectedEndpoint(e.target.value);
                      setRequestParams({});
                      setRequestResponse('');
                    }}
                    className="modal-input w-full"
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
                  <div className="space-y-2">
                    {endpointOptions[selectedEndpoint].map((param) => (
                      <div key={param}>
                        <label className="block text-sm text-gray-400">{param}</label>
                        <input
                          type="text"
                          value={requestParams[param] || ''}
                          onChange={(e) => handleParamChange(param, e.target.value)}
                          className="modal-input w-full"
                          placeholder={`Enter ${param}`}
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleSendRequest}
                      className="ripple-button login-button"
                    >
                      Send Request
                    </button>
                    {requestResponse && (
                      <pre className="mt-4 p-4 rounded-md bg-gray-800 text-gray-200 text-sm overflow-auto max-h-48">
                        {requestResponse}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="feature-card">
              <h2 className="feature-card-title">Manage Users</h2>
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or Discord ID..."
                  className="modal-input"
                />
              </div>
              <div className="space-y-2 max-h-96">
                {filteredUsers.length === 0 ? (
                  <p className="text-gray-400">No users found.</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.discordId}
                      onClick={() => handleEditUser(user)}
                      className="docs-card cursor-pointer"
                    >
                      <h3 className="docs-card-title">{user.username}</h3>
                      <p className="docs-card-description">Discord ID: {user.discordId}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <h2 className="modal-title">Manage User: {selectedUser.username}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400">Username</label>
                <input
                  type="text"
                  value={editUserData.username || ''}
                  onChange={(e) => handleEditChange('username', e.target.value)}
                  className="modal-input"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Discord ID</label>
                <input
                  type="text"
                  value={editUserData.discordId || ''}
                  disabled
                  className="modal-input"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">HWID</label>
                <input
                  type="text"
                  value={editUserData.hwid || ''}
                  onChange={(e) => handleEditChange('hwid', e.target.value)}
                  className="modal-input"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Subscription End Date</label>
                <input
                  type="datetime-local"
                  value={
                    editUserData.endTime
                      ? new Date(editUserData.endTime * 1000).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    handleEditChange('endTime', Math.floor(new Date(e.target.value).getTime() / 1000))
                  }
                  className="modal-input"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveUser} className="modal-button">Save Changes</button>
                <button onClick={handleResetUserHwid} className="modal-button">Reset HWID</button>
                <button
                  onClick={handleDeleteUser}
                  className="modal-button"
                  style={{ background: 'linear-gradient(90deg, #ff0000, #cc0000)' }}
                >
                  Delete User
                </button>
                <button onClick={() => setSelectedUser(null)} className="modal-button">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
