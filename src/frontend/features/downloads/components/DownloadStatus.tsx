import React, { useEffect } from 'react';
import useDownloadStore from '../../../stores/downloadStore';
import DownloadList from './DownloadList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Download } from 'lucide-react';

const DownloadStatus: React.FC = () => {
  const { downloads, initialize } = useDownloadStore();

  useEffect(() => {
    console.log('=== DOWNLOAD STATUS COMPONENT MOUNTED ===');
    console.log('DownloadStatus: Component mounted, initializing download store...');
    // Initialize the download store when the component mounts
    initialize();

    // We don't need multiple refreshes as they cause infinite loops
    // Just log the current state after initialization
    console.log(`DownloadStatus: Downloads updated, count: ${downloads.length}`);
  }, [initialize]);

  // Log downloads whenever they change
  useEffect(() => {
    console.log('DownloadStatus: Downloads updated, count:', downloads.length);
  }, [downloads]);

  // Auto-refresh is handled by the useEffect hook above

  // We don't need a separate listener here since the download store already has one
  // This was causing a memory leak with too many listeners

  // This function is already defined above, so we can remove this duplicate

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">Downloads</CardTitle>
            <CardDescription>
              Manage your video downloads and track progress
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {downloads && downloads.length > 0 ? (
          <DownloadList />
        ) : (
          <div className="bg-card text-card-foreground shadow rounded-lg p-8 text-center">
            <div className="flex flex-col items-center">
              <Download className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                No Active Downloads
              </h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                There are no active downloads. Videos might already be downloaded or you haven't started any downloads yet.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadStatus;
