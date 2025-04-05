import React from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import AppLayout from '../../components/Layout/AppLayout';

const DownloadsPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="container px-4 py-8">
        <header className="mb-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Download className="mr-3 h-8 w-8 text-primary" />
            Downloads
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage your video downloads
          </p>
        </header>

        <main>
          <div className="bg-card text-card-foreground shadow rounded-lg p-8 text-center">
            <div className="flex flex-col items-center">
              <Download className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Downloads Coming Soon
              </h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                This feature is under development. Check back soon for updates.
              </p>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default DownloadsPage;