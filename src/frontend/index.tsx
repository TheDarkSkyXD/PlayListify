import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/frontend/App';
import './styles/globals.css'; // Will be created later

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root container missing in index.html");
}