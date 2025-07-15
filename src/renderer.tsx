console.log('🔍 DEBUGGING: Renderer script started!');
console.log('🔍 DEBUGGING: Document ready state:', document.readyState);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './components/App';
import './styles/main.css';

console.log('🔍 DEBUGGING: React version:', React.version);

console.log('🔍 DEBUGGING: Imports loaded successfully');

const rootElement = document.getElementById('root');
console.log('🔍 DEBUGGING: Root element found:', !!rootElement);

if (rootElement) {
  console.log('🔍 DEBUGGING: Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('🔍 DEBUGGING: About to render App...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('🔍 DEBUGGING: App rendered successfully!');
} else {
  console.error('❌ DEBUGGING: Root element not found!');
}