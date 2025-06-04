'use client';

import { useState, useEffect } from 'react';

export default function UserProfile() {
  const [username, setUsername] = useState('7PXs');
  const [joinDate, setJoinDate] = useState('A moment ago');
  const [lastSeen, setLastSeen] = useState('A moment ago - Viewing member profile 7PXs');
  const [messages, setMessages] = useState(0);
  const [reactionScore, setReactionScore] = useState(0);
  const [activeTab, setActiveTab] = useState('Profile posts');
  const [error, setError] = useState('');

  // Fetch user data (simulated for now, replace with API call if available)
  const fetchUserData = () => {
    // Simulate fetching data; replace with actual API call if implemented
    setUsername('7PXs');
    setJoinDate('A moment ago');
    setLastSeen('A moment ago - Viewing member profile 7PXs');
    setMessages(0);
    setReactionScore(0);
  };

  // Handle find action (placeholder)
  const handleFind = () => {
    alert('Find action triggered!');
  };

  // Handle report action (placeholder)
  const handleReport = () => {
    alert('Report action triggered!');
  };

  useEffect(() => {
    fetchUserData();
  }, []);

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
          0% { box-shadow: 0 0 5px rgba(0, 255, 128, 0.5); }
          50% { box-shadow: 0 0 15px rgba(0, 255, 128, 0.8); }
          100% { box-shadow: 0 0 5px rgba(0, 255, 128, 0.5); }
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
      `}</style>
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-start">
          <div
            className="flex items-center p-4 rounded-lg"
            style={{
              background: '#d4a017',
              boxShadow: '0 0 10px rgba(212, 160, 23, 0.5)',
            }}
          >
            <span
              className="text-4xl font-bold text-white"
              style={{ textShadow: '0 0 5px rgba(0, 0, 0, 0.5)' }}
            >
              7
            </span>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-cyan-400">{username}</h1>
              <p className="text-sm text-gray-300">Joined: {joinDate}</p>
              <p className="text-sm text-gray-300">Last seen: {lastSeen}</p>
            </div>
          </div>
          <button
            onClick={handleReport}
            className="ripple-button p-2 rounded-full text-white font-semibold transition-all duration-300"
            style={{
              background: '#a100ff',
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
            Report
          </button>
        </div>
        <div className="mt-4 flex justify-between text-gray-400">
          <div>
            Messages <span className="text-white">{messages}</span>
          </div>
          <div>
            Reaction score <span className="text-white">{reactionScore}</span>
            <span className="ml-1 text-sm">Points</span>
          </div>
        </div>
        <button
          onClick={handleFind}
          className="ripple-button mt-4 p-2 rounded-full text-white font-semibold transition-all duration-300"
          style={{
            background: '#a100ff',
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
          Find <span style={{ fontSize: '10px' }}>▼</span>
        </button>
        <div className="mt-6 flex space-x-4 text-sm text-purple-400">
          <button
            className={`pb-2 ${activeTab === 'Profile posts' ? 'border-b-2 border-purple-400' : ''}`}
            onClick={() => setActiveTab('Profile posts')}
          >
            Profile posts
          </button>
          <button
            className={`pb-2 ${activeTab === 'Latest activity' ? 'border-b-2 border-purple-400' : ''}`}
            onClick={() => setActiveTab('Latest activity')}
          >
            Latest activity
          </button>
          <button
            className={`pb-2 ${activeTab === 'Postings' ? 'border-b-2 border-purple-400' : ''}`}
            onClick={() => setActiveTab('Postings')}
          >
            Postings
          </button>
          <button
            className={`pb-2 ${activeTab === 'Invitations' ? 'border-b-2 border-purple-400' : ''}`}
            onClick={() => setActiveTab('Invitations')}
          >
            Invitations
          </button>
          <button
            className={`pb-2 ${activeTab === 'About' ? 'border-b-2 border-purple-400' : ''}`}
            onClick={() => setActiveTab('About')}
          >
            About
          </button>
        </div>
        <div className="mt-4 p-4 bg-gray-900 rounded-lg">
          {activeTab === 'Profile posts' && (
            <p className="text-gray-400">There are no messages on {username}'s profile yet.</p>
          )}
          {activeTab === 'Latest activity' && <p className="text-gray-400">No recent activity.</p>}
          {activeTab === 'Postings' && <p className="text-gray-400">No postings yet.</p>}
          {activeTab === 'Invitations' && <p className="text-gray-400">No invitations yet.</p>}
          {activeTab === 'About' && <p className="text-gray-400">No about information yet.</p>}
        </div>
      </div>
    </div>
  );
}
