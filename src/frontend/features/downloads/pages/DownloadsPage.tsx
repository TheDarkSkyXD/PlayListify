import React from 'react';
import { Download } from 'lucide-react';
import AppLayout from '../../../components/Layout/AppLayout';
import DownloadStatus from '../components/DownloadStatus';

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
            Manage your video downloads and track progress
          </p>
        </header>

        <main>
          <DownloadStatus />
        </main>
      </div>
    </AppLayout>
  );
};

export default DownloadsPage;
