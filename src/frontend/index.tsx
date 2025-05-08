import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Assuming App.tsx will be created in the same directory or accessible path

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root container missing in index.html');
} 