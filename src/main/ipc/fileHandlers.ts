import { ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import logger from '../services/logService';
import { z } from 'zod';

// Schemas for validation
const FilePathSchema = z.object({
  filePath: z.string().min(1)
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

// Register handlers
export const registerFileHandlers = () => {
  ipcMain.handle('file:open', handleOpenFile);
  ipcMain.handle('file:show-in-folder', handleShowInFolder);
};

export default {
  registerFileHandlers
}; 