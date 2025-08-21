'use client';

import { useState } from 'react';
import Link from 'next/link';
import Topbar from './components/Topbar';
import Particles from './components/Particles';

export default function Docs() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeEndpoint, setActiveEndpoint] = useState('status');

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const endpoints = {
    status: { endpoint: 'https://utils32.vercel.app/status', method: 'GET', params: {}, responses: { '200': { success: true } } },
    'register-v1': {
      endpoint: 'https://utils32.vercel.app/register/v1',
      method: 'GET',
      params: {
        'ID*': { type: 'String', description: 'Discord ID' },
        'time*': { type: 'String', description: 'Duration (e.g., "100s")' },
        'username*': { type: 'String', description: '3-20 chars, alphanumeric' },
      },
      responses: { '200': { success: true, message: 'Registration successful' } },
    },
    'auth-v1': { endpoint: 'https://utils32.vercel.app/auth/v1', method: 'GET', params: {}, responses: { '200': { success: true } } },
    'dAuth-v1': { endpoint: 'https://utils32.vercel.app/dAuth/v1', method: 'GET', params: {}, responses: { '200': { success: true } } },
    'files-v1': { endpoint: 'https://utils32.vercel.app/files/v1', method: 'GET', params: {}, responses: { '200': { success: true } } },
    'scripts-list': {
      endpoint: 'https://utils32.vercel.app/scripts-list',
      method: 'GET',
      params: {},
      responses: { '200': { success: true, scripts: ['script1', 'script2'] } },
    },
    'manage-v1': {
      endpoint: 'https://utils32.vercel.app/manage/v1',
      method: 'GET/POST',
      params: { 'action*': { type: 'String', description: 'list, update, delete' } },
      responses: { '200': { success: true, message: 'Operation successful' } },
    },
    'login-v1': {
      endpoint: 'https://utils32.vercel.app/login/v1',
      method: 'GET',
      params: {
        'ID*': { type: 'String', description: 'Discord ID' },
        'username*': { type: 'String', description: 'Username' },
      },
      responses: { '200': { success: true, message: 'Login successful' } },
    },
    'users-v1': { endpoint: 'https://utils32.vercel.app/users/v1', method: 'GET', params: {}, responses: { '200': { users: ['user1', 'user2'] } } },
    'reset-hwid-v1': {
      endpoint: 'https://utils32.vercel.app/reset-hwid/v1',
      method: 'GET',
      params: {},
      responses: { '200': { success: true, message: 'HWID reset successful' } },
    },
    'keys-details': {
      endpoint: 'https://api.luarmor.net/v3/keys/:api_key/details',
      method: 'GET',
      params: { 'api_key*': { type: 'String', description: 'API key details' } },
      responses: { '200': { success: true, message: 'API key details retrieved' } },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Topbar username="User" onSignOut={() => alert('Signed out')} />
      <Particles mousePosition={mousePosition} />
      <div className="flex h-screen">
        <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
          <nav className="space-y-2">
            {Object.keys(endpoints).map((key) => (
              <Link
                key={key}
                href={`#${key}`}
                className={`block px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700 ${activeEndpoint === key ? 'bg-gray-700 text-white' : ''}`}
                onClick={() => setActiveEndpoint(key)}
              >
                {key.replace('-', ' ').replace(/v\d+/g, '')}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-3xl font-bold text-primary mb-6">API Documentation</h1>
          {Object.entries(endpoints).map(([key, { endpoint, method, params, responses }]) => (
            <div key={key} id={key} className="mb-8">
              <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-blue-300">{method}</span>
                  <span className="text-lg text-gray-300">{endpoint}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-md font-medium text-gray-200 mb-2">Parameters</h3>
                    {Object.keys(params).length === 0 ? (
                      <p className="text-gray-400">No parameters required</p>
                    ) : (
                      <ul className="space-y-2">
                        {Object.entries(params).map(([param, { type, description }]) => (
                          <li key={param} className="text-gray-300">
                            <span className="font-semibold">{param}</span> ({type}): {description}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h3 className="text-md font-medium text-gray-200 mb-2">Responses</h3>
                    <ul className="space-y-2">
                      {Object.entries(responses).map(([code, data]) => (
                        <li key={code} className="text-gray-300">
                          <span className="font-semibold">{code}</span>: {JSON.stringify(data)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
