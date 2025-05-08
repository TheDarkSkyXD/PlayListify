import React from 'react';

// Placeholder styles - will be replaced by Tailwind/Shadcn setup later
const appStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  fontFamily: 'sans-serif',
  textAlign: 'center'
};

const headingStyle: React.CSSProperties = {
  fontSize: '2rem',
  color: '#333'
};

const App: React.FC = () => {
  return (
    <div style={appStyle}>
      <header>
        <h1 style={headingStyle}>Playlistify</h1>
        <p>Welcome to your Electron YouTube Playlist Manager!</p>
        {/* Navigation and main content will go here */}
      </header>
    </div>
  );
};

export default App; 