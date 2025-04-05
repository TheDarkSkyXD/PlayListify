import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './frontend/App';
import './frontend/styles/global.css';

// Create root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}
const root = createRoot(container);

// Render app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);