import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';

console.log('🔍 Renderer script started');

const SimpleApp: React.FC = () => {
  console.log('🔍 SimpleApp component rendered');
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">PlayListify</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-green-600">✅ React Frontend Setup Complete!</h2>
          <p className="text-gray-600 mb-4">
            The frontend is now configured with:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>React 19 with TypeScript</li>
            <li>TailwindCSS for styling</li>
            <li>Shadcn/ui components</li>
            <li>Lucide React icons</li>
            <li>PostCSS processing</li>
            <li>Webpack configuration</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">🎨 UI Framework</h3>
            <p className="text-blue-700 text-sm">
              Shadcn/ui components are ready to use with consistent theming and dark/light mode support
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">🎯 Styling System</h3>
            <p className="text-green-700 text-sm">
              TailwindCSS utility classes with custom design tokens and responsive breakpoints
            </p>
          </div>
        </div>

        <div className="text-center">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors shadow-md hover:shadow-lg"
            onClick={() => {
              console.log('🔍 Button clicked!');
              alert('React + TailwindCSS is working perfectly!');
            }}
          >
            Test React + TailwindCSS
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Next Steps:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• UI components are available in src/components/ui/</li>
            <li>• Global styles configured in src/styles/globals.css</li>
            <li>• TailwindCSS config in tailwind.config.js</li>
            <li>• Ready for playlist management UI development</li>
          </ul>
        </div>
      </div>
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