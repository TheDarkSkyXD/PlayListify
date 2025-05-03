import { ipcMain, dialog } from 'electron';
import { z } from 'zod';
import logger from '../../services/logService';
import formatConverter, { ConversionOptions, ConversionProgress } from '../../services/formatConverter';
import fs from 'fs-extra';
import path from 'path';

// Schemas for validation
const convertFileSchema = z.object({
  inputPath: z.string(),
  format: z.enum(['mp4', 'webm', 'mkv', 'mp3', 'aac', 'flac', 'opus', 'm4a']),
  quality: z.enum(['360p', '480p', '720p', '1080p', '1440p', '2160p', '4320p', 'best']).optional(),
  audioBitrate: z.string().optional(),
  videoCodec: z.string().optional(),
  audioCodec: z.string().optional(),
  outputFilename: z.string().optional(),
  customOptions: z.array(z.string()).optional()
});

const extractAudioSchema = z.object({
  inputPath: z.string(),
  outputFormat: z.enum(['mp3', 'aac', 'flac', 'opus', 'm4a']),
  audioBitrate: z.string().optional()
});

const changeVideoQualitySchema = z.object({
  inputPath: z.string(),
  quality: z.enum(['360p', '480p', '720p', '1080p', '1440p', '2160p']),
  outputFormat: z.enum(['mp4', 'webm', 'mkv']).optional()
});

// Helper function to handle errors safely
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Utility function to validate file path
async function validateFilePath(filePath: string): Promise<string> {
  try {
    // Check if file exists
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Check if it's a file and not a directory
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      throw new Error(`Not a file: ${filePath}`);
    }
    
    return filePath;
  } catch (error) {
    logger.error(`File validation error: ${getErrorMessage(error)}`);
    throw error;
  }
}

// Register all format conversion handlers
export function registerFormatConverterHandlers() {
  // Get available formats
  ipcMain.handle('format-converter:get-formats', async () => {
    try {
      const formats = formatConverter.getAvailableFormats();
      return { success: true, data: formats };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to get available formats: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  });
  
  // Get available quality options
  ipcMain.handle('format-converter:get-qualities', async () => {
    try {
      const qualities = formatConverter.getAvailableQualities();
      return { success: true, data: qualities };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to get available qualities: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  });
  
  // Get available audio bitrates
  ipcMain.handle('format-converter:get-audio-bitrates', async () => {
    try {
      const bitrates = formatConverter.getAvailableAudioBitrates();
      return { success: true, data: bitrates };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to get available audio bitrates: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  });
  
  // Get video info
  ipcMain.handle('format-converter:get-video-info', async (event, filePath: string) => {
    try {
      // Validate file path
      await validateFilePath(filePath);
      
      // Get video info
      const info = await formatConverter.getVideoInfo(filePath);
      return { success: true, data: info };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to get video info: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  });
  
  // Convert file
  ipcMain.handle('format-converter:convert-file', async (event, options: ConversionOptions) => {
    try {
      // Validate options
      const validatedOptions = convertFileSchema.parse(options);
      
      // Validate input file
      await validateFilePath(validatedOptions.inputPath);
      
      // Keep track of last progress to avoid sending too many updates
      let lastProgress = 0;
      let conversionId = `convert-${Date.now()}`;
      
      // Set up progress handler
      const progressHandler = (progress: ConversionProgress) => {
        // Only send progress updates when progress has changed significantly (every 1%)
        if (Math.abs(progress.percent - lastProgress) >= 1) {
          lastProgress = progress.percent;
          event.sender.send('format-converter:progress', {
            id: conversionId,
            progress
          });
        }
      };
      
      // Start conversion
      logger.info(`Starting file conversion: ${validatedOptions.inputPath} -> ${validatedOptions.format}`);
      const result = await formatConverter.convertFile(
        validatedOptions.inputPath,
        validatedOptions as ConversionOptions,
        progressHandler
      );
      
      // Send completion event
      event.sender.send('format-converter:complete', {
        id: conversionId,
        success: result.success,
        outputPath: result.outputPath,
        error: result.error
      });
      
      return { 
        success: result.success, 
        data: { 
          id: conversionId,
          outputPath: result.outputPath,
          duration: result.duration,
          format: result.format,
          size: result.size
        }, 
        error: result.error 
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to convert file: ${errorMessage}`);
      
      return { 
        success: false, 
        error: error instanceof z.ZodError 
          ? 'Invalid conversion options' 
          : errorMessage
      };
    }
  });
  
  // Extract audio from video
  ipcMain.handle('format-converter:extract-audio', async (event, options) => {
    try {
      // Validate options
      const validatedOptions = extractAudioSchema.parse(options);
      
      // Validate input file
      await validateFilePath(validatedOptions.inputPath);
      
      // Keep track of last progress to avoid sending too many updates
      let lastProgress = 0;
      let conversionId = `extract-${Date.now()}`;
      
      // Set up progress handler
      const progressHandler = (progress: ConversionProgress) => {
        // Only send progress updates when progress has changed significantly
        if (Math.abs(progress.percent - lastProgress) >= 1) {
          lastProgress = progress.percent;
          event.sender.send('format-converter:progress', {
            id: conversionId,
            progress
          });
        }
      };
      
      // Start extraction
      logger.info(`Starting audio extraction: ${validatedOptions.inputPath} -> ${validatedOptions.outputFormat}`);
      const result = await formatConverter.extractAudio(
        validatedOptions.inputPath,
        validatedOptions.outputFormat,
        validatedOptions.audioBitrate,
        progressHandler
      );
      
      // Send completion event
      event.sender.send('format-converter:complete', {
        id: conversionId,
        success: result.success,
        outputPath: result.outputPath,
        error: result.error
      });
      
      return { 
        success: result.success, 
        data: { 
          id: conversionId,
          outputPath: result.outputPath,
          duration: result.duration,
          format: result.format,
          size: result.size
        }, 
        error: result.error 
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to extract audio: ${errorMessage}`);
      
      return { 
        success: false, 
        error: error instanceof z.ZodError 
          ? 'Invalid extraction options' 
          : errorMessage
      };
    }
  });
  
  // Change video quality
  ipcMain.handle('format-converter:change-quality', async (event, options) => {
    try {
      // Validate options
      const validatedOptions = changeVideoQualitySchema.parse(options);
      
      // Validate input file
      await validateFilePath(validatedOptions.inputPath);
      
      // Keep track of last progress to avoid sending too many updates
      let lastProgress = 0;
      let conversionId = `quality-${Date.now()}`;
      
      // Set up progress handler
      const progressHandler = (progress: ConversionProgress) => {
        // Only send progress updates when progress has changed significantly
        if (Math.abs(progress.percent - lastProgress) >= 1) {
          lastProgress = progress.percent;
          event.sender.send('format-converter:progress', {
            id: conversionId,
            progress
          });
        }
      };
      
      // Start quality change
      logger.info(`Starting video quality change: ${validatedOptions.inputPath} -> ${validatedOptions.quality}`);
      const result = await formatConverter.changeVideoQuality(
        validatedOptions.inputPath,
        validatedOptions.quality,
        validatedOptions.outputFormat,
        progressHandler
      );
      
      // Send completion event
      event.sender.send('format-converter:complete', {
        id: conversionId,
        success: result.success,
        outputPath: result.outputPath,
        error: result.error
      });
      
      return { 
        success: result.success, 
        data: { 
          id: conversionId,
          outputPath: result.outputPath,
          duration: result.duration,
          format: result.format,
          size: result.size
        }, 
        error: result.error 
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to change video quality: ${errorMessage}`);
      
      return { 
        success: false, 
        error: error instanceof z.ZodError 
          ? 'Invalid quality options' 
          : errorMessage
      };
    }
  });
  
  // Select file for conversion
  ipcMain.handle('format-converter:select-file', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Video Files', extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv'] },
          { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        title: 'Select Media File for Conversion'
      });
      
      if (canceled || filePaths.length === 0) {
        return { success: false, data: null };
      }
      
      return { success: true, data: { path: filePaths[0] } };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to select file: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  });
  
  // Select output directory
  ipcMain.handle('format-converter:select-output-directory', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Output Directory'
      });
      
      if (canceled || filePaths.length === 0) {
        return { success: false, data: null };
      }
      
      return { success: true, data: { path: filePaths[0] } };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to select output directory: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  });
}

export default registerFormatConverterHandlers; 