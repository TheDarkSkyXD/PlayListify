import React from 'react';

export interface SidenavbarProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

export const Sidenavbar: React.FC<SidenavbarProps> = ({ currentRoute, onRouteChange }) => {
  const navItems = [
    { route: '/', label: 'Dashboard', icon: '📊' },
    { route: '/playlists', label: 'My Playlists', icon: '🎵' },
    { route: '/downloads', label: 'Downloads', icon: '⬇️' },
    { route: '/history', label: 'History', icon: '🕐' },
    { route: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="sidenavbar">
      <div className="nav-header">
        <h2>PlayListify</h2>
      </div>
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.route} className="nav-item">
            <button
              className={`nav-link ${currentRoute === item.route ? 'active' : ''}`}
              onClick={() => onRouteChange(item.route)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};