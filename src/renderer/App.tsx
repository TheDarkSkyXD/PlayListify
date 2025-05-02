import React, { useEffect, useState } from 'react';
import { useIPC } from './hooks/useIPC';
import { IPC_CHANNELS } from '../shared/constants/ipc-channels';
import { useAppStore } from './store/appStore';
import { Button } from './components/ui/Button';
import { AppInfo } from '../shared/types/app';

const App: React.FC = () => {
  const { invoke: pingInvoke, data: pingResponse, loading: pingLoading } = useIPC<void, string>(IPC_CHANNELS.PING);
  const { invoke: getAppInfo, data: appInfo } = useIPC<void, AppInfo>(IPC_CHANNELS.APP_INFO);
  const [isLoading, setIsLoading] = useState(false);

  // Testing global app store
  const { isLoading: appLoading, setIsLoading: setAppLoading } = useAppStore();

  useEffect(() => {
    // Test ping IPC
    pingInvoke();
    
    // Get app info
    getAppInfo();
  }, [pingInvoke, getAppInfo]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">PlayListify</h1>
      <p className="mb-4">Welcome to PlayListify - Your YouTube Playlist Manager</p>
      
      <div className="flex space-x-2 mb-4">
        <Button 
          onClick={() => setAppLoading(!appLoading)}
          variant="default"
        >
          Toggle Global Loading: {appLoading ? 'On' : 'Off'}
        </Button>
        
        <Button 
          onClick={() => setIsLoading(!isLoading)}
          variant="secondary"
        >
          Toggle Local Loading: {isLoading ? 'On' : 'Off'}
        </Button>
        
        <Button 
          onClick={() => pingInvoke()}
          variant="outline"
          disabled={pingLoading}
        >
          Ping Again
        </Button>
      </div>
      
      <div className="mt-4 p-4 border rounded bg-secondary/20">
        <h2 className="text-xl mb-2">System Info</h2>
        <p>IPC Test: {pingLoading ? 'Pinging...' : pingResponse}</p>
        
        {appInfo && (
          <div className="mt-2">
            <p>App: {appInfo.name} v{appInfo.version}</p>
            <p>Platform: {appInfo.platform} ({appInfo.arch})</p>
            <p>Electron: v{appInfo.electronVersion}</p>
            <p>Node.js: v{appInfo.nodeVersion}</p>
            <p>Chromium: v{appInfo.chromiumVersion}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App; 