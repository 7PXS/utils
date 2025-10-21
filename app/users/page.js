'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Moon, Sun, TrendingUp, Clock, User, Home, FileText, Shield } from 'lucide-react';
import Link from 'next/link';

export default function UsersDirectory() {
  const [darkMode, setDarkMode] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, joined24h: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
      fetchUsers();
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
            return userData.success ? {
              username: userData.username,
              createTime: userData.createTime,
              isActive: userData.endTime > Date.now() / 1000
            } : null;
          } catch {
            return null;
          }
        }) || []
      );
      
      const validUsers = detailedUsers.filter(Boolean);
      setUsers(validUsers);
      
      const now = Date.now() / 1000;
      const day24hAgo = now - (24 * 60 * 60);
      setStats({
        total: validUsers.length,
        active: validUsers.filter(u => u.isActive).length,
        joined24h: validUsers.filter(u => u.createTime > day24hAgo).length
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatJoinDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
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
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    Nebula Community
                  </h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    User Directory
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
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Members</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
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
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Users</p>
                <p className="text-3xl font-bold mt-1">{stats.active}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
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
                <p className="text-3xl font-bold mt-1">{stats.joined24h}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className={`relative rounded-xl border ${
            darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
          }`}>
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search users by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl bg-transparent outline-none ${
                darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((user, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                  darkMode 
                    ? 'bg-[#0f0f1a] border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20' 
                    : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user.username}</p>
                    <div className="flex items-center space-x-1 mt-0.5">
                      {user.isActive && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      )}
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Joined {formatJoinDate(user.createTime)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-20">
            <User className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={`text-lg ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No users found matching "{searchTerm}"
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
