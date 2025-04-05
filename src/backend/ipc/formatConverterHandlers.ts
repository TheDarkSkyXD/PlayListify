import { ipcMain, IpcMainInvokeEvent } from 'electron';
import * as formatConverter from '../services/formatConverter';
import { downloadManager } from '../services/downloadManager';
import { logToFile } from '../services/logger';
import { ConversionOptions, ConversionProgress } from '../services/formatConverter';

/**
 * Register format converter IPC handlers
 */
export function registerFormatConverterHandlers(): void {
  // Initialize FFmpeg
  ipcMain.handle('format:initFFmpeg', async () => {
    try {
      await formatConverter.initFFmpeg();
      return { success: true };
    } catch (error: any) {
      logToFile('ERROR', `Failed to initialize FFmpeg: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // Convert a file
  ipcMain.handle(
    'format:convertFile',
    async (
      _: IpcMainInvokeEvent,
      inputPath: string,
      options: ConversionOptions
    ) => {
      try {
        logToFile('INFO', `Converting file: ${inputPath} to ${options.format}`);
        
        // Create a progress tracker for this conversion
        const progressChannel = `format:progress:${Date.now()}`;
        
        // Start the conversion
        const result = await formatConverter.convertFile(
          inputPath,
          options,
          (progress: ConversionProgress) => {
            // Send progress updates to the renderer
            if (_.sender && !_.sender.isDestroyed()) {
              _.sender.send(progressChannel, progress);
            }
          }
        );
        
        return {
          success: true,
          result,
          progressChannel
        };
      } catch (error: any) {
        logToFile('ERROR', `Failed to convert file: ${error.message}`);
        return {
          success: false,
          error: error.message
        };
      }
    }
  );

  // Convert a downloaded video
  ipcMain.handle(
    'format:convertDownloadedVideo',
    async (
      _: IpcMainInvokeEvent,
      downloadId: string,
      options: ConversionOptions
    ) => {
      try {
        // Get the download item
        const downloadItem = downloadManager.getDownload(downloadId);
        if (!downloadItem) {
          throw new Error(`Download ${downloadId} not found`);
        }
        
        logToFile('INFO', `Converting downloaded video: ${downloadItem.title} to ${options.format}`);
        
        // Create a progress tracker for this conversion
        const progressChannel = `format:progress:${downloadId}`;
        
        // Start the conversion
        const result = await formatConverter.convertDownloadedVideo(
          downloadItem,
          options,
          (progress: ConversionProgress) => {
            // Send progress updates to the renderer
            if (_.sender && !_.sender.isDestroyed()) {
              _.sender.send(progressChannel, progress);
            }
          }
        );
        
        return {
          success: true,
          result,
          progressChannel
        };
      } catch (error: any) {
        logToFile('ERROR', `Failed to convert downloaded video: ${error.message}`);
        return {
          success: false,
          error: error.message
        };
      }
    }
  );

  // Extract audio from a video
  ipcMain.handle(
    'format:extractAudio',
    async (
      _: IpcMainInvokeEvent,
      inputPath: string,
      format: string = 'mp3'
    ) => {
      try {
        logToFile('INFO', `Extracting audio from: ${inputPath} to ${format}`);
        
        // Create a progress tracker for this conversion
        const progressChannel = `format:progress:${Date.now()}`;
        
        // Start the extraction
        const result = await formatConverter.extractAudio(
          inputPath,
          format as any,
          (progress: ConversionProgress) => {
            // Send progress updates to the renderer
            if (_.sender && !_.sender.isDestroyed()) {
              _.sender.send(progressChannel, progress);
            }
          }
        );
        
        return {
          success: true,
          result,
          progressChannel
        };
      } catch (error: any) {
        logToFile('ERROR', `Failed to extract audio: ${error.message}`);
        return {
          success: false,
          error: error.message
        };
      }
    }
  );

  // Change video resolution
  ipcMain.handle(
    'format:changeResolution',
    async (
      _: IpcMainInvokeEvent,
      inputPath: string,
      quality: string
    ) => {
      try {
        logToFile('INFO', `Changing resolution of: ${inputPath} to ${quality}`);
        
        // Create a progress tracker for this conversion
        const progressChannel = `format:progress:${Date.now()}`;
        
        // Start the resolution change
        const result = await formatConverter.changeResolution(
          inputPath,
          quality as any,
          (progress: ConversionProgress) => {
            // Send progress updates to the renderer
            if (_.sender && !_.sender.isDestroyed()) {
              _.sender.send(progressChannel, progress);
            }
          }
        );
        
        return {
          success: true,
          result,
          progressChannel
        };
      } catch (error: any) {
        logToFile('ERROR', `Failed to change resolution: ${error.message}`);
        return {
          success: false,
          error: error.message
        };
      }
    }
  );

  // Trim a video
  ipcMain.handle(
    'format:trimVideo',
    async (
      _: IpcMainInvokeEvent,
      inputPath: string,
      startTime: string,
      endTime: string
    ) => {
      try {
        logToFile('INFO', `Trimming video: ${inputPath} from ${startTime} to ${endTime}`);
        
        // Create a progress tracker for this conversion
        const progressChannel = `format:progress:${Date.now()}`;
        
        // Start the trimming
        const result = await formatConverter.trimVideo(
          inputPath,
          startTime,
          endTime,
          (progress: ConversionProgress) => {
            // Send progress updates to the renderer
            if (_.sender && !_.sender.isDestroyed()) {
              _.sender.send(progressChannel, progress);
            }
          }
        );
        
        return {
          success: true,
          result,
          progressChannel
        };
      } catch (error: any) {
        logToFile('ERROR', `Failed to trim video: ${error.message}`);
        return {
          success: false,
          error: error.message
        };
      }
    }
  );

  // Get available formats
  ipcMain.handle('format:getAvailableFormats', () => {
    return formatConverter.getAvailableFormats();
  });

  // Get available qualities
  ipcMain.handle('format:getAvailableQualities', () => {
    return formatConverter.getAvailableQualities();
  });

  // Get video duration
  ipcMain.handle('format:getVideoDuration', async (_, filePath: string) => {
    try {
      const duration = await formatConverter.getVideoDuration(filePath);
      return {
        success: true,
        duration,
        formattedDuration: formatConverter.formatDuration(duration)
      };
    } catch (error: any) {
      logToFile('ERROR', `Failed to get video duration: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  });
}
