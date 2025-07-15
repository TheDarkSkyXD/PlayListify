import React from 'react';

export const SimpleApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">PlayListify</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">React + TailwindCSS Setup Complete!</h2>
          <p className="text-gray-600 mb-4">
            The frontend is now configured with:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>React 19 with TypeScript</li>
            <li>TailwindCSS for styling</li>
            <li>Shadcn/ui components</li>
            <li>Lucide React icons</li>
            <li>PostCSS processing</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">UI Framework</h3>
            <p className="text-blue-700 text-sm">
              Shadcn/ui components are ready to use with consistent theming
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Styling System</h3>
            <p className="text-green-700 text-sm">
              TailwindCSS utility classes with custom design tokens
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
};