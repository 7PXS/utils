'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, FileText, Users, Shield, Moon, Sun, Key, Clock, RefreshCw, Calendar, User as UserIcon } from 'lucide-react';

export default function UserProfile() {
  const [darkMode, setDarkMode] = useState(true);
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hwid, setHwid] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetData, setResetData] = useState({ resetsUsed: 0, resetsRemaining: 3 });

  const fetchUserData = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('No user found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setUsername(user.username);
      setDiscordId(user.discordId);
      setIsAdmin(user.discordId === '1272720391462457400');
      setIsAuthenticated(true); // Set authenticated immediately

      const response = await fetch(`/dAuth/v1?ID=${encodeURIComponent(user.discordId)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        // Even if API fails, keep them logged in with basic info
        setLoading(false);
        return;
      }

      setHwid(data.hwid || 'Not set');
      setKey(data.key || 'Not set');
      setJoinDate(new Date(data.createTime * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }));
      setEndDate(new Date(data.endTime * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetHwid = async () => {
    if (!discordId) {
      setError('No Discord ID found');
      return;
    }

    setError('');
    setSuccess('');

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

      setHwid('Not set');
      setSuccess('HWID reset successfully!');
      setResetData({
        resetsUsed: data.resetsUsed || 0,
        resetsRemaining: data.resetsRemaining || 3
      });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error resetting HWID: ' + error.message);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('profilePicture');
    window.location.href = '/';
  };

  const getDaysRemaining = () => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Not Authenticated</h1>
          <p className="text-gray-400 mb-6">Please log in to view your profile</p>
          <Link href="/">
            <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl hover:scale-105 transition-transform">
              Go to Login
            </button>
          </Link>
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
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    My Profile
                  </h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Account Settings
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
                {isAdmin && (
                  <Link href="/admin">
                    <button className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400' : 'hover:bg-gray-100'
                    }`}>
                      <Shield className="w-4 h-4" />
                      <span>Admin</span>
                    </button>
                  </Link>
                )}
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
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-purple-600'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold">
                {username?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className={`lg:col-span-2 p-8 rounded-2xl border backdrop-blur-sm ${
            darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-500/50">
                {username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-3xl font-bold">{username}</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Discord ID: {discordId}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-xl border ${
                darkMode ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Key className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Access Key</h3>
                </div>
                <code className={`text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  {key?.substring(0, 20)}...
                </code>
              </div>

              <div className={`p-4 rounded-xl border ${
                darkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold">HWID</h3>
                </div>
                <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {hwid === 'Not set' ? 'Not set' : `${hwid?.substring(0, 20)}...`}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${
                darkMode ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Calendar className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="font-semibold">Joined</h3>
                </div>
                <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {joinDate}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${
                getDaysRemaining() <= 7 
                  ? darkMode ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'
                  : darkMode ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    getDaysRemaining() <= 7 ? 'bg-red-500/20' : 'bg-yellow-500/20'
                  }`}>
                    <Clock className={`w-5 h-5 ${
                      getDaysRemaining() <= 7 ? 'text-red-400' : 'text-yellow-400'
                    }`} />
                  </div>
                  <h3 className="font-semibold">Expires</h3>
                </div>
                <p className={`text-sm ${
                  getDaysRemaining() <= 7 
                    ? darkMode ? 'text-red-400' : 'text-red-600'
                    : darkMode ? 'text-yellow-400' : 'text-yellow-600'
                }`}>
                  {endDate}
                </p>
                <p className={`text-xs mt-1 ${
                  getDaysRemaining() <= 7 ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  {getDaysRemaining()} days remaining
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
            darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
            
            <div className="space-y-4">
              <button
                onClick={handleResetHwid}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-medium hover:scale-105 transition-transform flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Reset HWID</span>
              </button>

              {!isAdmin && (
                <div className={`p-4 rounded-xl border ${
                  darkMode ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'
                }`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    HWID Resets Today
                  </p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">
                    {resetData.resetsUsed} / 3
                  </p>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {resetData.resetsRemaining} resets remaining
                  </p>
                </div>
              )}

              {isAdmin && (
                <div className={`p-4 rounded-xl border ${
                  darkMode ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50 border-green-200'
                }`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Admin Status
                  </p>
                  <p className="text-lg font-bold text-green-400 mt-1">
                    Unlimited Resets
                  </p>
                </div>
              )}

              <button
                onClick={handleSignOut}
                className={`w-full p-4 rounded-xl border font-medium transition-all ${
                  darkMode
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                    : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                }`}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className={`p-8 rounded-2xl border backdrop-blur-sm ${
          darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-2xl font-bold mb-6">Account Information</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span>Security</span>
              </h4>
              <ul className={`space-y-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Your HWID can be reset up to 3 times per day (unlimited for admins)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Keep your access key secure and never share it with others</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>If you suspect unauthorized access, reset your HWID immediately</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 flex items-center space-x-2">
                <Key className="w-5 h-5 text-blue-400" />
                <span>Subscription</span>
              </h4>
              <ul className={`space-y-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Your subscription expires on {endDate}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>You have {getDaysRemaining()} days remaining</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Contact support via Discord to extend your subscription</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-400" />
                <span>Resources</span>
              </h4>
              <ul className={`space-y-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Visit the <Link href="/docs" className="text-purple-400 hover:underline">documentation</Link> for API guides</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Browse the <Link href="/users" className="text-purple-400 hover:underline">user directory</Link> to see community members</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Join our Discord server for support and updates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
