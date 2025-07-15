import React from 'react';

export interface TopNavbarProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ theme, onThemeToggle }) => {
  return (
    <header className="top-navbar">
      <div className="navbar-content">
        <h1 className="app-title">PlayListify</h1>
        <div className="navbar-actions">
          <button
            className="theme-toggle-btn"
            onClick={onThemeToggle}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
};