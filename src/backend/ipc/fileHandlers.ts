import { ipcMain, dialog } from 'electron';
import * as fileUtils from '../utils/fileUtils';
import { isValidPath } from '../utils/fileUtils'; // Direct import for use in handlers
// Potentially import pathUtils if needed for resolving base paths from settings, etc.
// import { getPlaylistsBasePath } from '../utils/pathUtils'; // Example if pathUtils provides it
// import settingsService from '../services/settingsService'; // To get configured base paths

// Define IPC Channel Names
export const FileSystemChannels = {
  ENSURE_DIR: 'fs:ensureDir',
  PATH_EXISTS: 'fs:pathExists',
  READ_FILE_SAFE: 'fs:readFileSafe', // "Safe" implies it won't throw sensitive paths in errors to renderer
  WRITE_FILE_SAFE: 'fs:writeFileSafe',
  REMOVE_ITEM: 'fs:removeItem',
  MOVE_ITEM: 'fs:moveItem',
  COPY_ITEM: 'fs:copyItem',
  SELECT_DIRECTORY_DIALOG: 'fs:selectDirectoryDialog',
  IS_VALID_PATH: 'fs:isValidPath', // For path validation
  CREATE_PLAYLIST_DIR: 'fs:createPlaylistDirectory',
  DELETE_PLAYLIST_DIR: 'fs:deletePlaylistDirectory',
  READ_PLAYLIST_META: 'fs:readPlaylistMetadata',
  WRITE_PLAYLIST_META: 'fs:writePlaylistMetadata',
  SANITIZE_FILENAME: 'fs:sanitizeFilename',
};

export function registerFileHandlers() {
  ipcMain.handle(FileSystemChannels.ENSURE_DIR, async (_event, dirPath: string) => {
    try {
      if (!isValidPath(dirPath)) { // Basic validation on the path received
        throw new Error('Invalid directory path provided.');
      }
      await fileUtils.ensureDir(dirPath);
      return { success: true };
    } catch (error: any) {
      console.error(`IPC Error (${FileSystemChannels.ENSURE_DIR}):`, error);
      return { success: false, error: { message: error.message || 'Failed to ensure directory.' } };
    }
  });

  ipcMain.handle(FileSystemChannels.PATH_EXISTS, async (_event, itemPath: string) => {
    try {
      // No need to re-validate with isValidPath here as pathExists itself is a check
      const exists = await fileUtils.pathExists(itemPath);
      return { success: true, data: exists };
    } catch (error: any) {
      console.error(`IPC Error (${FileSystemChannels.PATH_EXISTS}):`, error);
      // pathExists itself shouldn't throw for non-existence, but other fs errors might occur
      return { success: false, error: { message: error.message || 'Failed to check path existence.' } };
    }
  });

  ipcMain.handle(FileSystemChannels.READ_FILE_SAFE, async (_event, filePath: string) => {
    try {
      if (!isValidPath(filePath)) {
        throw new Error('Invalid file path for reading.');
      }
      // Add safety checks: ensure file is within an expected readable directory if applicable
      const content = await fileUtils.readFile(filePath);
      return { success: true, data: content };
    } catch (error: any) {
      console.error(`IPC Error (${FileSystemChannels.READ_FILE_SAFE}):`, error);
      return { success: false, error: { message: 'Failed to read file.' } }; // Generic error to renderer
    }
  });

  ipcMain.handle(FileSystemChannels.WRITE_FILE_SAFE, async (_event, filePath: string, data: string) => {
    try {
      if (!isValidPath(filePath)) {
        throw new Error('Invalid file path for writing.');
      }
      // Add safety checks: ensure file is within an expected writable directory if applicable
      await fileUtils.writeFile(filePath, data);
      return { success: true };
    } catch (error: any) {
      console.error(`IPC Error (${FileSystemChannels.WRITE_FILE_SAFE}):`, error);
      return { success: false, error: { message: 'Failed to write file.' } }; // Generic error
    }
  });
  
  ipcMain.handle(FileSystemChannels.REMOVE_ITEM, async (_event, itemPath: string) => {
    try {
      if (!isValidPath(itemPath)) {
        throw new Error('Invalid item path for removal.');
      }
      // Add safety checks: e.g., prevent deletion of critical app directories
      await fileUtils.remove(itemPath);
      return { success: true };
    } catch (error: any) {
      console.error(`IPC Error (${FileSystemChannels.REMOVE_ITEM}):`, error);
      return { success: false, error: { message: 'Failed to remove item.' } };
    }
  });

  ipcMain.handle(FileSystemChannels.SELECT_DIRECTORY_DIALOG, async (event) => {
    const window = require('electron').BrowserWindow.fromWebContents(event.sender);
    if (!window) {
        return { success: false, error: { message: 'Could not get browser window.'}};
    }
    try {
      const result = await dialog.showOpenDialog(window, {
        properties: ['openDirectory', 'createDirectory'],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: null }; // User cancelled
      }
      return { success: true, data: result.filePaths[0] };
    } catch (error: any) {
      console.error(`IPC Error (${FileSystemChannels.SELECT_DIRECTORY_DIALOG}):`, error);
      return { success: false, error: { message: error.message || 'Failed to open directory dialog.' } };
    }
  });

  ipcMain.handle(FileSystemChannels.IS_VALID_PATH, (_event, itemPath: string) => {
    // This IPC is more for the renderer to quickly check a path string.
    // The main process validation happens within each handler that receives a path.
    try {
      const isValid = fileUtils.isValidPath(itemPath); // Use the utility
      return { success: true, data: isValid };
    } catch (error: any) {
      // isValidPath shouldn't typically throw, but as a safeguard:
      console.error(`IPC Error (${FileSystemChannels.IS_VALID_PATH}):`, error);
      return { success: false, data: false, error: { message: 'Error validating path.' } };
    }
  });

  ipcMain.handle(FileSystemChannels.SANITIZE_FILENAME, (_event, filename: string) => {
    try {
      const sanitized = fileUtils.sanitizeFilename(filename);
      return { success: true, data: sanitized };
    } catch (error: any) {
      console.error(`IPC Error (${FileSystemChannels.SANITIZE_FILENAME}):`, error);
      return { success: false, error: { message: 'Error sanitizing filename.' } };
    }
  });

  // Playlist specific handlers
  // These will require knowing the base path for playlists, likely from settings.
  // For now, let's assume a function getPlaylistStoragePath() will be available,
  // perhaps from settingsService or a dedicated path configuration module.

  // Example structure (will need actual settings integration):
  // const getPlaylistBasePathFromSettings = async (): Promise<string> => {
  //   const settings = await settingsService.getSettings();
  //   if (!settings.playlistStoragePath || !isValidPath(settings.playlistStoragePath)) {
  //       throw new Error("Playlist storage path is not configured or invalid.");
  //   }
  //   return settings.playlistStoragePath;
  // }

  ipcMain.handle(FileSystemChannels.CREATE_PLAYLIST_DIR, async (_event, playlistName: string, basePath: string /* TODO: Get from settings */) => {
    try {
      // const actualBasePath = await getPlaylistBasePathFromSettings(); // Ideal
      if (!isValidPath(basePath)) { // Temporary: basePath passed from renderer for now
          throw new Error('Base path for playlist creation is invalid.');
      }
      const playlistPath = await fileUtils.createPlaylistDirectory(playlistName, basePath);
      return { success: true, data: playlistPath };
    } catch (error: any) {
      console.error(`IPC Error (${FileSystemChannels.CREATE_PLAYLIST_DIR}):`, error);
      return { success: false, error: { message: error.message || 'Failed to create playlist directory.' } };
    }
  });

  ipcMain.handle(FileSystemChannels.DELETE_PLAYLIST_DIR, async (_event, playlistPath: string) => {
    try {
      if (!isValidPath(playlistPath)) {
          throw new Error('Invalid playlist path for deletion.');
      }
      // Add safety: ensure this path is within the expected playlist storage area
      await fileUtils.deletePlaylistDirectory(playlistPath);
      return { success: true };
    } catch (error: any) {
      console.error(`IPC Error (${FileSystemChannels.DELETE_PLAYLIST_DIR}):`, error);
      return { success: false, error: { message: error.message || 'Failed to delete playlist directory.' } };
    }
  });

  ipcMain.handle(FileSystemChannels.READ_PLAYLIST_META, async (_event, playlistPath: string) => {
    try {
        if (!isValidPath(playlistPath)) {
            throw new Error('Invalid playlist path for reading metadata.');
        }
        const metadata = await fileUtils.readPlaylistMetadata(playlistPath);
        return { success: true, data: metadata };
    } catch (error: any) {
        console.error(`IPC Error (${FileSystemChannels.READ_PLAYLIST_META}):`, error);
        return { success: false, error: { message: 'Failed to read playlist metadata.' } };
    }
  });

  ipcMain.handle(FileSystemChannels.WRITE_PLAYLIST_META, async (_event, playlistPath: string, metadata: any /* Should be Playlist type */) => {
    try {
        if (!isValidPath(playlistPath)) {
            throw new Error('Invalid playlist path for writing metadata.');
        }
        // TODO: Validate metadata structure against Playlist type from shared/types
        await fileUtils.writePlaylistMetadata(playlistPath, metadata);
        return { success: true };
    } catch (error: any) {
        console.error(`IPC Error (${FileSystemChannels.WRITE_PLAYLIST_META}):`, error);
        return { success: false, error: { message: 'Failed to write playlist metadata.' } };
    }
  });

  console.log('File system IPC handlers registered.');
}