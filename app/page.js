import { useState, useEffect } from "react";
import Link from "next/link";

export default function Topbar({ username, onSignOut }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <nav className="topbar">
      <div className="topbar-container">
        {/* Brand */}
        <Link href="/" className="brand">
          <span className="brand-icon">🌌</span>
          <span className="brand-name">Nebula</span>
        </Link>

        {/* Nav Menu */}
        <div className="nav-menu">
          <Link href="/" className="nav-item">Home</Link>
          <Link href="/docs" className="nav-item">Docs</Link>
        </div>

        {/* Right Menu */}
        <div className="right-menu">
          <button 
            className="icon-btn"
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle Dark Mode"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <button 
            className="icon-btn" 
            onClick={onSignOut}
            aria-label="Sign Out"
          >
            🚪
          </button>
          <Link href="/profile" className="profile-avatar">
            {username?.[0]?.toUpperCase() || "U"}
          </Link>
        </div>
      </div>
    </nav>
  );
}
