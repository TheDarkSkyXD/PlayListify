import React, { useState } from 'react';
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import ReactPlugin from '@stagewise-plugins/react';

export const App: React.FC = () => {
  const [count, setCount] = useState(0);
  
  console.log('🔍 React App component rendered!');

  return (
    <>
      <StagewiseToolbar
        config={{
          plugins: [new ReactPlugin()],
        }}
      />
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f8ff',
        minHeight: '100vh'
      }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>
          🎵 PlayListify
        </h1>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          React is now working! 🎉
        </p>
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => setCount(count + 1)}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Count: {count}
          </button>
        </div>
        <div style={{ 
          backgroundColor: '#ecf0f1',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid #bdc3c7'
        }}>
          <h3>✅ Setup Status:</h3>
          <ul>
            <li>✅ Electron app running</li>
            <li>✅ Webpack bundling working</li>
            <li>✅ React components rendering</li>
            <li>✅ JavaScript execution working</li>
            <li>✅ State management working</li>
          </ul>
        </div>
      </div>
    </>
  );
};