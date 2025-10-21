'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, FileText, Users, Shield, Moon, Sun, Book, Code, Terminal } from 'lucide-react';

function ResponseCard({ endpoint, method, params, responses }) {
  const [activeTab, setActiveTab] = useState(Object.keys(responses)[0]);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={`rounded-2xl border overflow-hidden mb-6 ${
      darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
    }`}>
      <div className={`p-4 border-b ${darkMode ? 'bg-purple-500/5 border-purple-500/10' : 'bg-purple-50 border-purple-200'}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 font-semibold text-sm">
            {method}
          </span>
          <code className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {endpoint}
          </code>
        </div>
      </div>

      {params && Object.keys(params).length > 0 && (
        <div className="p-6 border-b border-purple-500/10">
          <h4 className="font-semibold mb-4 flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>Parameters</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {Object.entries(params).map(([name, { type, description }], index) => (
                  <tr key={index} className="border-t border-purple-500/10">
                    <td className="py-3 pr-4">
                      <code className="text-purple-400">{name}</code>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {type}
                      </span>
                    </td>
                    <td className={`py-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(responses).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === status
                  ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
                  : darkMode
                  ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className={`rounded-xl p-4 ${darkMode ? 'bg-[#1a1a2e]' : 'bg-gray-50'}`}>
          <pre className="overflow-x-auto">
            <code className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {JSON.stringify(responses[activeTab], null, 2)}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [username, setUsername] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

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

      setUsername(user.username);
      setCurrentUser(user);
      setIsAdmin(user.discordId === '1272720391462457400');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth error:', error);
      window.location.href = '/';
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  const sections = [
    { id: 'overview', title: 'Overview', icon: <Book className="w-4 h-4" /> },
    { id: 'status', title: '/status', icon: <Code className="w-4 h-4" /> },
    { id: 'register-v1', title: '/register/v1', icon: <Code className="w-4 h-4" /> },
    { id: 'auth-v1', title: '/auth/v1', icon: <Code className="w-4 h-4" /> },
    { id: 'dAuth-v1', title: '/dAuth/v1', icon: <Code className="w-4 h-4" /> },
    { id: 'reset-hwid-v1', title: '/reset-hwid/v1', icon: <Code className="w-4 h-4" /> },
    { id: 'users-v1', title: '/users/v1', icon: <Code className="w-4 h-4" /> },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${darkMode ? 'bg-[#0a0a0f]/80 border-purple-500/10' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    API Documentation
                  </h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Nebula REST API
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

      <div className="flex max-w-7xl mx-auto">
        <aside className={`hidden lg:block w-64 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r ${
          darkMode ? 'border-purple-500/10' : 'border-gray-200'
        }`}>
          <nav className="p-4 space-y-1">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-purple-700/20 text-purple-400 border border-purple-500/30'
                    : darkMode
                    ? 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {section.icon}
                <span className="text-sm font-medium">{section.title}</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <section id="overview" className="mb-12">
            <div className={`p-8 rounded-2xl border ${
              darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
            }`}>
              <h2 className="text-3xl font-bold mb-4">Nebula API Documentation</h2>
              <p className={`text-lg mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Welcome to the Nebula API documentation. This guide will help you integrate our whitelisting service into your applications.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${
                  darkMode ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'
                }`}>
                  <h3 className="font-semibold mb-2">Base URL</h3>
                  <code className={`text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    https://utils32.vercel.app
                  </code>
                </div>
                
                <div className={`p-4 rounded-xl border ${
                  darkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                }`}>
                  <h3 className="font-semibold mb-2">Authentication</h3>
                  <code className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    User-Agent: Roblox/WinInet
                  </code>
                </div>
              </div>
            </div>
          </section>

          <section id="status" className="mb-12">
            <ResponseCard
              endpoint="https://utils32.vercel.app/status"
              method="GET"
              params={{}}
              responses={{
                '200': { success: true, message: 'API is running', timestamp: '2025-01-15T12:00:00Z' }
              }}
            />
          </section>

          <section id="register-v1" className="mb-12">
            <ResponseCard
              endpoint="https://utils32.vercel.app/register/v1"
              method="GET"
              params={{
                'ID*': { type: 'String', description: 'Discord ID' },
                'username*': { type: 'String', description: '3-20 chars, alphanumeric' },
                'time*': { type: 'String', description: 'Duration (e.g., "30d", "1mo", "1yr")' }
              }}
              responses={{
                '200': { success: true, key: 'AbCdEfGhIjKlMn', createTime: 1625097600, endTime: 1656633600 },
                '400': { success: false, error: 'Invalid username format' }
              }}
            />
          </section>

          <section id="auth-v1" className="mb-12">
            <ResponseCard
              endpoint="https://utils32.vercel.app/auth/v1"
              method="GET"
              params={{
                'key*': { type: 'String', description: 'User key' },
                'hwid*': { type: 'String', description: 'Hardware ID' },
                'gameId': { type: 'String', description: 'Optional game ID' }
              }}
              responses={{
                '200': {
                  success: true,
                  key: 'AbCdEfGhIjKlMn',
                  hwid: '1234567890',
                  discordId: '123456789012345678',
                  username: 'user123',
                  createTime: 1625097600,
                  endTime: 1656633600,
                  gameValid: true
                },
                '400': { success: false, error: 'Missing key or hwid' },
                '401': { success: false, error: 'HWID mismatch' }
              }}
            />
          </section>

          <section id="dAuth-v1" className="mb-12">
            <ResponseCard
              endpoint="https://utils32.vercel.app/dAuth/v1"
              method="GET"
              params={{
                'ID*': { type: 'String', description: 'Discord ID' },
                'gameId': { type: 'String', description: 'Optional game ID' }
              }}
              responses={{
                '200': {
                  success: true,
                  key: 'AbCdEfGhIjKlMn',
                  hwid: '1234567890',
                  discordId: '123456789012345678',
                  username: 'user123',
                  createTime: 1625097600,
                  endTime: 1656633600
                },
                '401': { success: false, error: 'Key expired' },
                '404': { success: false, error: 'User not found' }
              }}
            />
          </section>

          <section id="reset-hwid-v1" className="mb-12">
            <ResponseCard
              endpoint="https://utils32.vercel.app/reset-hwid/v1"
              method="GET"
              params={{
                'Authorization*': { type: 'Header', description: 'Bearer {discordId}' }
              }}
              responses={{
                '200': { success: true, message: 'HWID reset successful', resetsUsed: 1, resetsRemaining: 2 },
                '404': { success: false, error: 'User not found' },
                '429': { success: false, error: 'Daily reset limit reached (3/day)' }
              }}
            />
          </section>

          <section id="users-v1" className="mb-12">
            <ResponseCard
              endpoint="https://utils32.vercel.app/users/v1"
              method="GET"
              params={{
                'Authorization*': { type: 'Header', description: 'UserMode-2d93n2002n8 (Admin only)' }
              }}
              responses={{
                '200': { success: true, users: ['123456789', '987654321'], count: 2 },
                '401': { success: false, error: 'Unauthorized' }
              }}
            />
          </section>

          <div className={`mt-12 p-8 rounded-2xl border ${
            darkMode ? 'bg-[#0f0f1a] border-purple-500/20' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              If you have questions or need assistance integrating the Nebula API, here are some resources:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${
                darkMode ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'
              }`}>
                <h4 className="font-semibold mb-2">Discord Support</h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Join our Discord server for real-time support and updates
                </p>
              </div>
              
              <div className={`p-4 rounded-xl border ${
                darkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'
              }`}>
                <h4 className="font-semibold mb-2">Community</h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Link href="/users" className="text-purple-400 hover:underline">
                    Browse our user directory
                  </Link> to connect with other developers
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
