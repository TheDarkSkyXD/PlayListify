import React from 'react';
import { createRoot } from 'react-dom/client';

console.log('🔍 Renderer script started');

const SimpleApp: React.FC = () => {
  console.log('🔍 SimpleApp component rendered');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: 'lightblue' }}>
      <h1 style={{ color: 'red' }}>PlayListify Test</h1>
      <p>React is working!</p>
      <button onClick={() => {
        console.log('🔍 Button clicked!');
        alert('Button clicked!');
      }}>Test Button</button>
    </div>
  );
};

console.log('🔍 Looking for root container...');
const container = document.getElementById('root');
console.log('🔍 Root container:', container);

if (container) {
  console.log('🔍 Creating React root...');
  const root = createRoot(container);
  console.log('🔍 Rendering app...');
  root.render(<SimpleApp />);
  console.log('🔍 App rendered successfully');
} else {
  console.error('❌ Root container not found');
}

console.log('🔍 Renderer script completed');