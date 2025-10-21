'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, FileText, Users as UsersIcon, Shield, Moon, Sun, Key, Clock, TrendingUp, Lock, Zap, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [discordId, setDiscordId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, joined24h: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
    } else {
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/stats/v1');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
      setCurrentUser(user);
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
      setCurrentUser({ discordId, username });
      setIsAuthenticated(true);
      setIsAdmin(discordId === '1272720391462457400');
    } catch (error) {
      setError('An error occurred during registration');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-500 rounded-full opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className={`max-w-5xl w-full rounded-3xl overflow-hidden shadow-2xl ${
            darkMode ? 'bg-[#0f0f1a] border border-purple-500/20' : 'bg-white border border-gray-200'
          }`}>
            <div className="grid md:grid-cols-2">
              <div className="relative p-12 bg-gradient-to-br from-purple-500 to-purple-700 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h1 className="text-4xl font-bold mb-4">Nebula</h1>
                  <p className="text-purple-100 text-lg mb-8">
                    Premier whitelisting service for secure and seamless access management
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <span>Secure Authentication</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span>Lightning Fast</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span>24/7 Support</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sign in to continue
                    </p>
                  </div>
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
                </div>

                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                    {error}
                  </div>
                )}

                <form className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                        darkMode 
                          ? 'bg-[#1a1a2e] border-purple-500/20 focus:border-purple-500/50 text-white' 
                          : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900'
                      }`}
                      placeholder="Enter your username"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Discord ID
                    </label>
                    <input
                      type="text"
                      value={discordId}
                      onChange={(e) => setDiscordId(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                        darkMode 
                          ? 'bg-[#1a1a2e] border-purple-500/20 focus:border-purple-500/50 text-white' 
                          : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900'
                      }`}
                      placeholder="Enter your Discord ID"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleLogin}
                      className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-medium hover:scale-105 transition-transform"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={handleRegister}
                      className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                        darkMode
                          ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      }`}
                    >
                      Register
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
                    Nebula
                  </h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Whitelisting Service
                  </p>
                </div>
              </div>

              <nav className="hidden md:flex space-x-1">
                <button className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors bg-purple-500/10 text-purple-400`}>
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>
                
                <Link href="/users">
                  <button className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400' : 'hover:bg-gray-100'
                  }`}>
                    <UsersIcon className="w-4 h-4" />
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

              <Link href="/profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-110 transition-transform">
                  {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

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
                <p className="text-3xl font-bold mt-1">{loading ? '...' : stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20">
                <UsersIcon className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
            darkMode 
              ? 'bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20' 
              : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Keys</p>
                <p className="text-3xl font-bold mt-1">{loading ? '...' : stats.active}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20">
                <Key className="w-6 h-6 text-green-400" />
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
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>New (24h)</p>
                <p className="text-3xl font-bold mt-1">{loading ? '...' : stats.joined24h}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border overflow-hidden mb-8 ${
          darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
        }`}>
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Welcome to Nebula</h2>
            <p className={`text-lg mb-8 max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Your premier whitelisting service for secure and seamless access management. Get started by exploring our features below.
            </p>
            <Link href="/docs">
              <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-medium hover:scale-105 transition-transform shadow-lg shadow-purple-500/50">
                View Documentation
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/users">
            <div className={`p-6 rounded-2xl border backdrop-blur-sm cursor-pointer hover:scale-105 transition-all ${
              darkMode 
                ? 'bg-[#0f0f1a] border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20' 
                : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <UsersIcon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">User Directory</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Browse all members of the Nebula community
              </p>
            </div>
          </Link>

          <Link href="/docs">
            <div className={`p-6 rounded-2xl border backdrop-blur-sm cursor-pointer hover:scale-105 transition-all ${
              darkMode 
                ? 'bg-[#0f0f1a] border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20' 
                : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
            }`}>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">API Documentation</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Detailed guides on integrating with our API
              </p>
            </div>
          </Link>

          {isAdmin && (
            <Link href="/admin">
              <div className={`p-6 rounded-2xl border backdrop-blur-sm cursor-pointer hover:scale-105 transition-all ${
                darkMode 
                  ? 'bg-[#0f0f1a] border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20' 
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }`}>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Admin Dashboard</h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Manage users and view system statistics
                </p>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
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
      setCurrentUser({ discordId, username });
      setIsAuthenticated(true);
      setIsAdmin(discordId === '1272720391462457400');
