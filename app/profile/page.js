'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UserProfile() {
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hwid, setHwid] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Request Sender State
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [requestParams, setRequestParams] = useState({});
  const [requestResponse, setRequestResponse] = useState('');

  // User List State
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserData, setEditUserData] = useState({});

  // Fetch user data from localStorage and API
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
        hour12: 'true',
      }));

      // Fetch users list for admin
      if (user.discordId === '1272720391462457400') {
        fetchUsers();
      }
    } catch (error) {
      setError(error.message');
    }
  };

  // Fetch all users (for admin only)
  const fetchUsers = async () => {
    try {
      const response = await fetch('/manage/v1?action=list');
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

  // Handle HWID reset
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

  // Handle request sending
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

  // Update request parameters based on input
  const handleParamChange = (key, value) => {
    setRequestParams((prev) => ({ ...prev, [key]: value }));
  };

  // Filter users based on search query
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.discordId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Open user management modal
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({ ...user });
  };

  // Handle user data changes in modal
  const handleEditChange = (key, value) => {
    setEditUserData((prev) => ({ ...prev, [key]: value }));
  };

  // Save edited user data
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

  // Delete user
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

  // Reset HWID for selected user
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

  useEffect(() => {
    fetchUserData();
  }, []);

  // Endpoint options and their parameters
  const endpointOptions = {
    '/register/v1': ['ID', 'time', 'username'],
    '/auth/v1': ['ID', 'key'],
    '/dAuth/v1': ['ID'],
    '/reset-hwid/v1': [],
  };

  return (
    <div
      className="min-h-screen text-gray-200 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a1a, #2c2c2c)',
        animation: 'gradientShift 15s ease infinite',
        backgroundSize: '400% 400%',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
      }}
    >
      <style jsx global>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 5px rgba(161, 0, 255, 0.5); }
          50% { box-shadow: 0 0 15px rgba(161, 0, 255, 0.8); }
          100% { box-shadow: 0 0 5px rgba(161, 0, 255, 0.5); }
        }
        .ripple-button {
          position: relative;
          overflow: hidden;
        }
        .ripple {
          position: absolute;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: rippleEffect 0.6s linear;
          pointer-events: none;
        }
        @keyframes rippleEffect {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: rgba(30, 30, 30, 0.95);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(161, 0, 255, 0.3);
          box-shadow: 0 0 20px rgba(161, 0, 255, 0.3);
          max-width: 500px;
          width: 90%;
        }
      `}</style>

      {/* Topbar */}
      <nav
        className="fixed top-0 left-0 w-full z-50"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(161, 0, 255, 0.3)',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="container mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/app/nebulaText.ico"
              alt="Nebula"
              className="h-6"
              style={{ textShadow: '0 0 10px rgba(161, 0, 255, 0.5)' }}
            />
          </div>
          <Link href="/">
            <div
              className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all duration-300"
              style={{
                background: 'rgba(50, 50, 50, 0.8)',
                border: '1px solid rgba(161, 0, 255, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(70, 70, 70, 0.8)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(161, 0, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(50, 50, 50, 0.8)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5.121 17.804A7 7 0 1112 5a7 7 0 016.879 5.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm-3 7a3 3 0 00-3 3h6a3 3 0 00-3-3z"
                />
              </svg>
              <span className="text-sm text-white">Back to Home</span>
            </div>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto p-8 pt-24">
        {error && <p className="text-red-400 animate-pulse mb-4">{error}</p>}

        {/* User Profile Card */}
        <div
          className="flex items-center p-4 rounded-lg max-w-md w-full mb-8"
          style={{
            background: 'rgba(50, 50, 50, 0.8)',
            border: '1px solid rgba(161, 0, 255, 0.3)',
            boxShadow: '0 0 20px rgba(161, 0, 255, 0.3)',
            animation: 'glowPulse 2s infinite ease-in-out',
          }}
        >
          <span
            className="text-4xl font-bold text-white mr-4"
            style={{ textShadow: '0 0 5px rgba(161, 0, 255, 0.5)' }}
          >
            7
          </span>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-purple-400">{username || 'Loading...'}</h1>
            <p className="text-sm text-gray-300">Discord ID: {discordId || 'Loading...'}</p>
            <p className="text-sm text-gray-300">Joined: {joinDate || 'Loading...'}</p>
            <p className="text-sm text-gray-300">Subscription Ends: {endDate || 'Loading...'}</p>
            <p className="text-sm text-gray-300">HWID: {hwid}</p>
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
              className="ripple-button mt-2 p-2 rounded-lg text-white font-semibold transition-all duration-300"
              style={{
                background: 'linear-gradient(90deg, #a100ff, #7b00cc)',
                boxShadow: '0 0 10px rgba(161, 0, 255, 0.5)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Reset HWID {isAdmin && '(Unlimited)'}
            </button>
          </div>
        </div>

        {/* Admin Features for User ID 1272720391462457400 */}
        {isAdmin && (
          <div className="space-y-8">
            {/* Request Sender */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(30, 30, 30, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(161, 0, 255, 0.3)',
                boxShadow: '0 0 20px rgba(161, 0, 255, 0.3)',
                animation: 'glowPulse 2s infinite ease-in-out',
              }}
            >
              <h2 className="text-xl font-semibold text-purple-400 mb-4">Request Sender</h2>
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
                    className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
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
                          className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                          placeholder={`Enter ${param}`}
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleSendRequest}
                      className="ripple-button p-2 rounded-lg text-white font-semibold transition-all duration-300"
                      style={{
                        background: 'linear-gradient(90deg, #a100ff, #7b00cc)',
                        boxShadow: '0 0 10px rgba(161, 0, 255, 0.5)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.2)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'brightness(1)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      Send Request
                    </button>
                    {requestResponse && (
                      <pre className="mt-4 p-4 rounded-lg bg-gray-900 text-gray-200 text-sm overflow-auto max-h-48">
                        {requestResponse}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User List */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(30, 30, 30, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(161, 0, 255, 0.3)',
                boxShadow: '0 0 20px rgba(161, 0, 255, 0.3)',
                animation: 'glowPulse 2s infinite ease-in-out',
              }}
            >
              <h2 className="text-xl font-semibold text-purple-400 mb-4">Manage Users</h2>
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or Discord ID..."
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-gray-400">No users found.</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.discordId}
                      onClick={() => handleEditUser(user)}
                      className="p-4 rounded-lg cursor-pointer transition-all duration-300"
                      style={{
                        background: 'rgba(50, 50, 50, 0.8)',
                        border: '1px solid rgba(161, 0, 255, 0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(70, 70, 70, 0.8)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(161, 0, 255, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(50, 50, 50, 0.8)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <h3 className="text-lg text-white">{user.username}</h3>
                      <p className="text-sm text-gray-300">Discord ID: {user.discordId}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Management Modal */}
      {selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <h2 className="text-xl font-semibold text-purple-400 mb-4">
              Manage User: {selectedUser.username}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400">Username</label>
                <input
                  type="text"
                  value={editUserData.username || ''}
                  onChange={(e) => handleEditChange('username', e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">Discord ID</label>
                <input
                  type="text"
                  value={editUserData.discordId || ''}
                  disabled
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400">HWID</label>
                <input
                  type="text"
                  value={editUserData.hwid || ''}
                  onChange={(e) => handleEditChange('hwid', e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
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
                  className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveUser}
                  className="ripple-button flex-1 p-2 rounded-lg text-white font-semibold transition-all duration-300"
                  style={{
                    background: 'linear-gradient(90deg, #a100ff, #7b00cc)',
                    boxShadow: '0 0 10px rgba(161, 0, 255, 0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Save Changes
                </button>
                <button
                  onClick={handleResetUserHwid}
                  className="ripple-button flex-1 p-2 rounded-lg text-white font-semibold transition-all duration-300"
                  style={{
                    background: 'linear-gradient(90deg, #a100ff, #7b00cc)',
                    boxShadow: '0 0 10px rgba(161, 0, 255, 0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Reset HWID
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="ripple-button flex-1 p-2 rounded-lg text-white font-semibold transition-all duration-300"
                  style={{
                    background: 'linear-gradient(90deg, #ff0000, #cc0000)',
                    boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Delete User
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="ripple-button flex-1 p-2 rounded-lg text-white font-semibold transition-all duration-300"
                  style={{
                    background: 'rgba(50, 50, 50, 0.8)',
                    border: '1px solid rgba(161, 0, 255, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(70, 70, 70, 0.8)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(161, 0, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(50, 50, 50, 0.8)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
