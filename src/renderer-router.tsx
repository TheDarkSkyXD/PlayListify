import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

console.log('🔍 DEBUGGING: Router renderer script started!');
console.log('🔍 DEBUGGING: Document ready state:', document.readyState);

const rootElement = document.getElementById('root');
console.log('🔍 DEBUGGING: Root element found:', !!rootElement);

if (rootElement) {
  console.log('🔍 DEBUGGING: Creating React root with router...');
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