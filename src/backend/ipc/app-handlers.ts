// src/backend/ipc/app-handlers.ts
import { app, ipcMain } from 'electron';
import type { IpcResponse, AppStatus } from '../../shared/types';
// We might need pathUtils later, e.g. to check dependency paths if not handled by start.js fully
// import { getFFmpegPath, getYtDlpPath } from '../utils/pathUtils'; 

/**
 * Handles requests for general application information.
 */
export function registerAppHandlers(): void {
  ipcMain.handle(
    'get-app-status',
    async (): Promise<IpcResponse<AppStatus>> => {
      try {
        // In a real scenario, dependency checks might be more complex
        // and could involve actually trying to execute the binaries or checking versions.
        // For now, we'll assume a simplified check or rely on `start.js` for initial setup.
        // const ffmpegPath = getFFmpegPath();
        // const ytDlpPath = getYtDlpPath();

        const status: AppStatus = {
          version: app.getVersion(),
          isOnline: true, // Placeholder, actual online check might be needed
          dependencies: {
            ffmpeg: 'checking', // Placeholder, replace with actual check
            ytDlp: 'checking', // Placeholder, replace with actual check
          },
        };
        return { success: true, data: status };
      } catch (error: any) {
        console.error('Error getting app status:', error);
        return {
          success: false,
          error: {
            message: error.message || 'Failed to get application status.',
            code: 'APP_STATUS_ERROR',
          },
        };
      }
    }
  );

  ipcMain.handle(
    'get-app-path',
    async (event, pathName: string): Promise<IpcResponse<string>> => {
      try {
        if (!pathName || typeof pathName !== 'string') {
          return { success: false, error: { message: 'Invalid path name provided.'}};
        }
        // Supported path names by Electron's app.getPath()
        const validPathNames = [
          'home', 'appData', 'userData', 'sessionData', 'temp', 'exe', 'module', 
          'desktop', 'documents', 'downloads', 'music', 'pictures', 'videos', 
          'recent', 'logs', 'crashDumps'
        ];

        if (!validPathNames.includes(pathName)) {
           return { success: false, error: { message: `Unsupported path name: ${pathName}. Supported: ${validPathNames.join(', ')}`}};
        }
        
        // Type assertion as pathName is validated to be one of the keys of AppPathName
        const requestedPath = app.getPath(pathName as Parameters<typeof app.getPath>[0]);
        return { success: true, data: requestedPath };
      } catch (error: any) {
        console.error(`Error getting app path "${pathName}":`, error);
        return {
          success: false,
          error: {
            message: error.message || `Failed to get application path: ${pathName}.`,
            code: 'APP_PATH_ERROR',
          },
        };
      }
    }
  );

  // Add more app-specific handlers here, for example:
  // - Get app name: app.getName()
  // - Get app locale: app.getLocale()
  // - Quit app: app.quit()
  // - Relaunch app: app.relaunch()
  
  console.log('App IPC handlers registered.');
}