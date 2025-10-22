'use client';

import { useState, useEffect } from 'react';
import { Bell, Users, Key, Clock, Search, X, Plus, RefreshCw, Moon, Sun, AlertCircle, CheckCircle, Home, FileText, Edit, Trash2, UserPlus, Save } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    discordId: '',
    time: '30d'
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      window.location.href = '/';
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      const response = await fetch(`/login/v1?ID=${encodeURIComponent(user.discordId)}&username=${encodeURIComponent(user.username)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      }

      setCurrentUser(user);
      setIsAuthenticated(true);
      setIsAdmin(user.discordId === '1272720391462457400');

      if (user.discordId === '1272720391462457400') {
        fetchUsers();
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
      }
    } catch (error) {
      console.error('Auth error:', error);
      window.location.href = '/';
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/users/v1', {
        headers: { 'Authorization': 'UserMode-2d93n2002n8' }
      });
      const data = await response.json();
      
      const detailedUsers = await Promise.all(
        data.users?.map(async (userId) => {
          try {
            const userResponse = await fetch(`/dAuth/v1?ID=${userId}`);
            const userData = await userResponse.json();
            return userData.success ? { ...userData, discordId: userId } : null;
          } catch {
            return null;
          }
        }) || []
      );
      
      setUsers(detailedUsers.filter(Boolean));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const fetchNotifications = async () => {
    const now = Date.now() / 1000;
    const newNotifications = [];

    users.forEach(user => {
      const daysUntilExpiry = (user.endTime - now) / (24 * 60 * 60);
      
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        newNotifications.push({
          type: 'expiry',
          severity: daysUntilExpiry <= 3 ? 'high' : 'medium',
          message: `${user.username}'s key expires in ${Math.ceil(daysUntilExpiry)} days`,
          timestamp: Date.now(),
          userId: user.discordId
        });
      }
    });

    setNotifications(prev => [...newNotifications, ...prev.slice(0, 20)]);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/register/v1?ID=${encodeURIComponent(newUser.discordId)}&username=${encodeURIComponent(newUser.username)}&time=${newUser.time}`, {
        headers: { 'User-Agent': 'Roblox/WinInet' }
      });
      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setNewUser({ username: '', discordId: '', time: '30d' });
        fetchUsers();
        setNotifications(prev => [{
          type: 'success',
          severity: 'low',
          message: `Successfully created user: ${newUser.username}`,
          timestamp: Date.now()
        }, ...prev]);
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      newEndTime: Math.floor((user.endTime - Date.now() / 1000) / 86400) // Convert to days
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const additionalTime = `${editingUser.newEndTime}d`;
      const response = await fetch(`/auth/admin?user=${editingUser.discordId}&time=${additionalTime}`, {
        headers: { 'Authorization': 'UserMode-2d93n2002n8' }
      });
      const data = await response.json();
      
      if (data.success) {
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
        setNotifications(prev => [{
          type: 'success',
          severity: 'low',
          message: `Successfully updated ${editingUser.username}`,
          timestamp: Date.now()
        }, ...prev]);
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/manage/v1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'UserMode-2d93n2002n8',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ discordId: user.discordId })
      });
      const data = await response.json();
      
      if (data.success) {
        fetchUsers();
        setNotifications(prev => [{
          type: 'success',
          severity: 'low',
          message: `Successfully deleted user: ${user.username}`,
          timestamp: Date.now()
        }, ...prev]);
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleAddTime = async (userId, time) => {
    try {
      const response = await fetch(`/auth/admin?user=${userId}&time=${time}`, {
        headers: { 'Authorization': 'UserMode-2d93n2002n8' }
      });
      const data = await response.json();
      
      if (data.success) {
        fetchUsers();
        setNotifications(prev => [{
          type: 'success',
          severity: 'low',
          message: `Successfully added ${time} to user's key`,
          timestamp: Date.now()
        }, ...prev]);
      }
    } catch (error) {
      console.error('Error adding time:', error);
    }
  };

  const handleResetHwid = async (userId) => {
    try {
      const response = await fetch('/reset-hwid/v1', {
        headers: { 'Authorization': `Bearer ${userId}` }
      });
      const data = await response.json();
      
      if (data.success) {
        fetchUsers();
        setNotifications(prev => [{
          type: 'success',
          severity: 'low',
          message: `Successfully reset HWID for user`,
          timestamp: Date.now()
        }, ...prev]);
      }
    } catch (error) {
      console.error('Error resetting HWID:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.discordId?.includes(searchTerm)
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'expiry': return <Clock className="w-5 h-5" />;
      case 'new_user': return <Users className="w-5 h-5" />;
      case 'request': return <AlertCircle className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'from-red-500/20 to-red-600/20 border-red-500/30';
      case 'medium': return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 'low': return 'from-green-500/20 to-green-600/20 border-green-500/30';
      default: return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
    }
  };

  const getDaysRemaining = (endTime) => {
    const days = Math.ceil((endTime - Date.now() / 1000) / (24 * 60 * 60));
    return days > 0 ? days : 0;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Access Denied
            </h1>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              You don't have permission to access this page
            </p>
            <Link href="/">
              <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl hover:scale-105 transition-transform">
                Go Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${darkMode ? 'bg-[#0a0a0f]/80 border-purple-500/10' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    Nebula Admin
                  </h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Management Dashboard
                  </p>
                </div>
              </div>

              <nav className="hidden md:flex space-x-1">
                <Link href="/">
                  <button className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400' : 'hover:bg-gray-100'
                  }`}>
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </button>
                </Link>
                <Link href="/users">
                  <button className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400' : 'hover:bg-gray-100'
                  }`}>
                    <Users className="w-4 h-4" />
                    <span>Users</span>
                  </button>
                </Link>
                <Link href="/docs">
                  <button className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400' : 'hover:bg-gray-100'
                  }`}>
                    <FileText className="w-4 h-4" />
                    <span>Docs</span>
                  </button>
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-purple-600'
                }`}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-purple-600'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <Link href="/profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-110 transition-transform">
                  {currentUser?.username?.[0]?.toUpperCase() || 'A'}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {showNotifications && (
        <div className={`fixed right-4 top-20 w-96 max-h-[600px] overflow-y-auto rounded-2xl shadow-2xl border backdrop-blur-xl z-50 ${
          darkMode ? 'bg-[#0f0f1a]/95 border-purple-500/20' : 'bg-white/95 border-gray-200'
        }`}>
          <div className="p-4 border-b border-purple-500/10">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className={`p-1 rounded-lg ${darkMode ? 'hover:bg-purple-500/10' : 'hover:bg-gray-100'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>No notifications</p>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl mb-2 border bg-gradient-to-br ${getSeverityColor(notif.severity)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={notif.severity === 'high' ? 'text-red-400' : notif.severity === 'medium' ? 'text-yellow-400' : 'text-green-400'}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{notif.message}</p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(notif.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${
            darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create New User</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-purple-500/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                    darkMode 
                      ? 'bg-[#1a1a2e] border-purple-500/20 focus:border-purple-500/50 text-white' 
                      : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900'
                  }`}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Discord ID
                </label>
                <input
                  type="text"
                  value={newUser.discordId}
                  onChange={(e) => setNewUser({...newUser, discordId: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                    darkMode 
                      ? 'bg-[#1a1a2e] border-purple-500/20 focus:border-purple-500/50 text-white' 
                      : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900'
                  }`}
                  placeholder="Enter Discord ID"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Duration
                </label>
                <select
                  value={newUser.time}
                  onChange={(e) => setNewUser({...newUser, time: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                    darkMode 
                      ? 'bg-[#1a1a2e] border-purple-500/20 focus:border-purple-500/50 text-white' 
                      : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900'
                  }`}
                >
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                  <option value="60d">60 Days</option>
                  <option value="90d">90 Days</option>
                  <option value="6mo">6 Months</option>
                  <option value="1yr">1 Year</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                    darkMode
                      ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-medium hover:scale-105 transition-transform"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${
            darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-purple-500/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  disabled
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${
                    darkMode 
                      ? 'bg-[#1a1a2e] border-purple-500/20 text-gray-500' 
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Discord ID
                </label>
                <input
                  type="text"
                  value={editingUser.discordId}
                  disabled
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${
                    darkMode 
                      ? 'bg-[#1a1a2e] border-purple-500/20 text-gray-500' 
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Add Days
                </label>
                <input
                  type="number"
                  value={editingUser.newEndTime}
                  onChange={(e) => setEditingUser({...editingUser, newEndTime: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                    darkMode 
                      ? 'bg-[#1a1a2e] border-purple-500/20 focus:border-purple-500/50 text-white' 
                      : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900'
                  }`}
                  placeholder="Number of days to add"
                  min="1"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                    darkMode
                      ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-medium hover:scale-105 transition-transform flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
            darkMode 
              ? 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20' 
              : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                <p className="text-3xl font-bold mt-1">{users.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
            darkMode 
              ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20' 
              : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Keys</p>
                <p className="text-3xl font-bold mt-1">
                  {users.filter(u => u.endTime > Date.now() / 1000).length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Key className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
            darkMode 
              ? 'bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20' 
              : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Expiring Soon</p>
                <p className="text-3xl font-bold mt-1">
                  {users.filter(u => getDaysRemaining(u.endTime) <= 7 && getDaysRemaining(u.endTime) > 0).length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/20">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className={`relative flex-1 mr-4 rounded-xl border ${
            darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
          }`}>
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search users by name or Discord ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl bg-transparent outline-none ${
                darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'
              }`}
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-medium hover:scale-105 transition-transform flex items-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Create User</span>
          </button>
        </div>

        <div className={`rounded-2xl border overflow-hidden ${
          darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-purple-500/5' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Discord ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Key</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">HWID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
                      <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Loading users...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className={darkMode ? 'text-gray-500' : 'text-gray-400'}>No users found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.discordId}
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-purple-500/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold">
                            {user.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.discordId}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <code className={`text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          {user.key?.substring(0, 12)}...
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.hwid ? `${user.hwid.substring(0, 8)}...` : 'Not set'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          getDaysRemaining(user.endTime) <= 3
                            ? 'bg-red-500/20 text-red-400'
                            : getDaysRemaining(user.endTime) <= 7
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {getDaysRemaining(user.endTime)} days
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAddTime(user.discordId, '30d')}
                            className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
                            title="Add 30 days"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetHwid(user.discordId)}
                            className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                            title="Reset HWID"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
