import { ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import logger from '../services/logService';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import { z } from 'zod';
import fileUtils from '../utils/fileUtils';

// Schemas for validation
const FilePathSchema = z.object({
  filePath: z.string().min(1)
});

const PlaylistInfoSchema = z.object({
  playlistId: z.number(),
  playlistName: z.string().min(1)
});

const VideoInfoSchema = z.object({
  playlistId: z.number(),
  playlistName: z.string().min(1),
  videoId: z.string().min(1),
  format: z.string().optional()
});

const MetadataSchema = z.object({
  playlistId: z.number(),
  playlistName: z.string().min(1),
  metadata: z.any()
});

/**
 * Opens a file with the default application
 */
const handleOpenFile = async (_event: Electron.IpcMainInvokeEvent, args: unknown) => {
  try {
    const { filePath } = FilePathSchema.parse(args);
    
    // Verify the file exists
    if (!fs.existsSync(filePath)) {
      logger.warn(`File not found: ${filePath}`);
      return { success: false, error: 'File not found' };
    }
    
    logger.info(`Opening file: ${filePath}`);
    
    // Open the file with the default application
    const result = await shell.openPath(filePath);
    
    if (result !== '') {
      logger.warn(`Failed to open file: ${result}`);
      return { success: false, error: result };
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error opening file:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * Shows a file in the file explorer
 */
const handleShowInFolder = async (_event: Electron.IpcMainInvokeEvent, args: unknown) => {
  try {
    const { filePath } = FilePathSchema.parse(args);
    
    // Verify the file exists
    if (!fs.existsSync(filePath)) {
      logger.warn(`File not found: ${filePath}`);
      return { success: false, error: 'File not found' };
    }
    
    logger.info(`Showing file in folder: ${filePath}`);
    
    // Show the file in the file explorer
    const result = await shell.showItemInFolder(filePath);
    
    return { success: true };
  } catch (error) {
    logger.error('Error showing file in folder:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * Selects a directory via dialog
 */
const handleSelectDirectory = async (_event: Electron.IpcMainInvokeEvent) => {
  try {
    logger.info('Opening directory selection dialog');
    
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    const selectedDir = result.filePaths[0];
    logger.info(`Directory selected: ${selectedDir}`);
    
    return { success: true, dirPath: selectedDir };
  } catch (error) {
    logger.error('Error selecting directory:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * Creates playlist directory structure
 */
const handleCreatePlaylistDir = async (_event: Electron.IpcMainInvokeEvent, args: unknown) => {
  try {
    const { playlistId, playlistName } = PlaylistInfoSchema.parse(args);
    
    logger.info(`Creating playlist directory for ${playlistName}`);
    const dirPath = await fileUtils.createPlaylistDir(playlistId, playlistName);
    
    return { success: true, dirPath };
  } catch (error) {
    logger.error('Error creating playlist directory:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * Writes playlist metadata to file
 */
const handleWritePlaylistMetadata = async (_event: Electron.IpcMainInvokeEvent, args: unknown) => {
  try {
    const { playlistId, playlistName, metadata } = MetadataSchema.parse(args);
    
    logger.info(`Writing metadata for playlist ${playlistName}`);
    const filePath = await fileUtils.writePlaylistMetadata(playlistId, playlistName, metadata);
    
    return { success: true, filePath };
  } catch (error) {
    logger.error('Error writing playlist metadata:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * Reads playlist metadata from file
 */
const handleReadPlaylistMetadata = async (_event: Electron.IpcMainInvokeEvent, args: unknown) => {
  try {
    const { playlistId, playlistName } = PlaylistInfoSchema.parse(args);
    
    logger.info(`Reading metadata for playlist ${playlistName}`);
    const metadata = await fileUtils.readPlaylistMetadata(playlistId, playlistName);
    
    if (metadata === null) {
      return { success: false, error: 'Metadata not found' };
    }
    
    return { success: true, metadata };
  } catch (error) {
    logger.error('Error reading playlist metadata:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * Checks if a video file exists
 */
const handleVideoExists = async (_event: Electron.IpcMainInvokeEvent, args: unknown) => {
  try {
    const { playlistId, playlistName, videoId, format } = VideoInfoSchema.parse(args);
    
    const exists = await fileUtils.videoExists(playlistId, playlistName, videoId, format);
    
    return { success: true, exists };
  } catch (error) {
    logger.error('Error checking if video exists:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * Gets all playlist directories
 */
const handleGetAllPlaylistDirs = async (_event: Electron.IpcMainInvokeEvent) => {
  try {
    const dirs = await fileUtils.getAllPlaylistDirs();
    return { success: true, dirs };
  } catch (error) {
    logger.error('Error getting playlist directories:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * Gets available disk space
 */
const handleGetAvailableDiskSpace = async (_event: Electron.IpcMainInvokeEvent) => {
  try {
    const spaceBytes = await fileUtils.getAvailableDiskSpace();
    return { 
      success: true, 
      spaceBytes,
      // Add formatted values for convenience
      spaceMB: Math.floor(spaceBytes / (1024 * 1024)),
      spaceGB: Math.floor(spaceBytes / (1024 * 1024 * 1024)) 
    };
  } catch (error) {
    logger.error('Error getting available disk space:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

// Register handlers
export const registerFileHandlers = () => {
  ipcMain.handle('file:open', handleOpenFile);
  ipcMain.handle('file:show-in-folder', handleShowInFolder);
  ipcMain.handle('file:select-directory', handleSelectDirectory);
  ipcMain.handle('file:create-playlist-dir', handleCreatePlaylistDir);
  ipcMain.handle('file:write-playlist-metadata', handleWritePlaylistMetadata);
  ipcMain.handle('file:read-playlist-metadata', handleReadPlaylistMetadata);
  ipcMain.handle('file:video-exists', handleVideoExists);
  ipcMain.handle('file:get-all-playlist-dirs', handleGetAllPlaylistDirs);
  ipcMain.handle('file:get-available-disk-space', handleGetAvailableDiskSpace);
};

export default {
  registerFileHandlers
}; 