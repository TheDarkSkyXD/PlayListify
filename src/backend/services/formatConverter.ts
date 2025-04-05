import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { getSetting } from './settingsManager';
import { logToFile, c } from './logger';
import { DownloadItem } from '../services/downloadManager';

// Supported output formats
export type OutputFormat = 'mp4' | 'webm' | 'mp3' | 'aac' | 'flac' | 'opus' | 'm4a';

// Conversion options
export interface ConversionOptions {
  format: OutputFormat;
  quality?: string;
  audioBitrate?: string;
  videoBitrate?: string;
  width?: number;
  height?: number;
  fps?: number;
  startTime?: string;
  endTime?: string;
  metadata?: Record<string, string>;
}

// Conversion progress
export interface ConversionProgress {
  percent: number;
  fps?: number;
  kbps?: number;
  targetSize?: number;
  currentSize?: number;
  timemark?: string;
  eta?: string;
}

// Conversion result
export interface ConversionResult {
  success: boolean;
  outputPath: string;
  duration: number;
  format: string;
  size: number;
  error?: string;
}

// FFmpeg initialization status
let ffmpegInitialized = false;

/**
 * Initialize FFmpeg with the path from settings or bundled version
 */
export async function initFFmpeg(): Promise<void> {
  if (ffmpegInitialized) {
    return;
  }

  try {
    // Check if a custom path is set in settings
    const customPath = getSetting('ffmpegPath');
    
    if (customPath && await fs.pathExists(customPath)) {
      ffmpeg.setFfmpegPath(customPath);
      logToFile('INFO', c.success(`Using custom FFmpeg from settings: ${customPath}`));
    } else {
      // Use bundled FFmpeg in production, or rely on system PATH in development
      if (app.isPackaged) {
        const ffmpegPath = getBundledFFmpegPath();
        if (await fs.pathExists(ffmpegPath)) {
          ffmpeg.setFfmpegPath(ffmpegPath);
          logToFile('INFO', c.success(`Using bundled FFmpeg: ${ffmpegPath}`));
        } else {
          logToFile('WARN', c.warn(`Bundled FFmpeg not found at ${ffmpegPath}, falling back to system PATH`));
        }
      } else {
        logToFile('INFO', c.info('Using FFmpeg from system PATH (development mode)'));
      }
    }

    ffmpegInitialized = true;
  } catch (error) {
    logToFile('ERROR', c.error(`Failed to initialize FFmpeg: ${error}`));
    throw new Error(`Failed to initialize FFmpeg: ${error}`);
  }
}

/**
 * Get the path to the bundled FFmpeg binary
 */
export function getBundledFFmpegPath(): string {
  const platform = process.platform;
  const resourcesPath = process.resourcesPath;
  
  let binaryName = 'ffmpeg';
  if (platform === 'win32') {
    binaryName = 'ffmpeg.exe';
  }
  
  return path.join(resourcesPath, 'bin', binaryName);
}

/**
 * Convert a video file to another format
 */
export async function convertFile(
  inputPath: string,
  options: ConversionOptions,
  progressCallback?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  // Ensure FFmpeg is initialized
  await initFFmpeg();
  
  // Determine output path based on input path and format
  const parsedPath = path.parse(inputPath);
  const outputPath = path.join(
    parsedPath.dir,
    `${parsedPath.name}.${options.format}`
  );
  
  // Ensure the output directory exists
  await fs.ensureDir(parsedPath.dir);
  
  // Log the conversion start
  logToFile('INFO', c.info(`Starting conversion: ${inputPath} -> ${outputPath}`));
  logToFile('INFO', c.info(`Conversion options: ${JSON.stringify(options)}`));
  
  return new Promise((resolve, reject) => {
    // Create FFmpeg command
    const command = ffmpeg(inputPath);
    
    // Set output format
    command.toFormat(options.format);
    
    // Apply video options if not converting to audio-only format
    if (!['mp3', 'aac', 'flac', 'opus', 'm4a'].includes(options.format)) {
      // Set video codec based on format
      if (options.format === 'mp4') {
        command.videoCodec('libx264');
      } else if (options.format === 'webm') {
        command.videoCodec('libvpx-vp9');
      }
      
      // Set video quality
      if (options.videoBitrate) {
        command.videoBitrate(options.videoBitrate);
      }
      
      // Set resolution if specified
      if (options.width && options.height) {
        command.size(`${options.width}x${options.height}`);
      } else if (options.quality) {
        // Set resolution based on quality
        switch (options.quality) {
          case '360p':
            command.size('640x360');
            break;
          case '480p':
            command.size('854x480');
            break;
          case '720p':
            command.size('1280x720');
            break;
          case '1080p':
            command.size('1920x1080');
            break;
          case '1440p':
            command.size('2560x1440');
            break;
          case '2160p':
            command.size('3840x2160');
            break;
        }
      }
      
      // Set frame rate if specified
      if (options.fps) {
        command.fps(options.fps);
      }
    }
    
    // Apply audio options
    if (['mp3', 'aac', 'flac', 'opus', 'm4a'].includes(options.format)) {
      // Set audio codec based on format
      if (options.format === 'mp3') {
        command.audioCodec('libmp3lame');
      } else if (options.format === 'aac') {
        command.audioCodec('aac');
      } else if (options.format === 'flac') {
        command.audioCodec('flac');
      } else if (options.format === 'opus') {
        command.audioCodec('libopus');
      } else if (options.format === 'm4a') {
        command.audioCodec('aac');
      }
    }
    
    // Set audio bitrate if specified
    if (options.audioBitrate) {
      command.audioBitrate(options.audioBitrate);
    } else {
      // Set default audio bitrate based on format
      if (options.format === 'mp3') {
        command.audioBitrate('192k');
      } else if (options.format === 'aac' || options.format === 'm4a') {
        command.audioBitrate('256k');
      } else if (options.format === 'opus') {
        command.audioBitrate('128k');
      }
    }
    
    // Set trim options if specified
    if (options.startTime) {
      command.seekInput(options.startTime);
    }
    
    if (options.endTime) {
      command.duration(options.endTime);
    }
    
    // Set metadata if specified
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        command.outputOptions(`-metadata ${key}="${value}"`);
      });
    }
    
    // Set progress handler
    if (progressCallback) {
      command.on('progress', (progress) => {
        progressCallback({
          percent: Math.min(Math.round(progress.percent || 0), 100),
          fps: progress.frames ? progress.frames / ((progress.timemark.split(':').reduce((acc, time) => (60 * acc) + +time, 0)) || 1) : undefined,
          kbps: progress.currentKbps,
          targetSize: progress.targetSize,
          currentSize: progress.currentSize,
          timemark: progress.timemark,
          eta: progress.timemark
        });
      });
    }
    
    // Set completion handlers
    command.on('end', async () => {
      try {
        // Get file stats
        const stats = await fs.stat(outputPath);
        
        // Get duration using ffprobe
        const duration = await getVideoDuration(outputPath);
        
        // Log success
        logToFile('INFO', c.success(`Conversion completed: ${inputPath} -> ${outputPath}`));
        
        // Return result
        resolve({
          success: true,
          outputPath,
          duration,
          format: options.format,
          size: stats.size
        });
      } catch (error) {
        logToFile('ERROR', c.error(`Error getting file info after conversion: ${error}`));
        resolve({
          success: true,
          outputPath,
          duration: 0,
          format: options.format,
          size: 0
        });
      }
    });
    
    command.on('error', (err) => {
      logToFile('ERROR', c.error(`Conversion failed: ${err.message}`));
      reject({
        success: false,
        outputPath: '',
        duration: 0,
        format: options.format,
        size: 0,
        error: err.message
      });
    });
    
    // Start the conversion
    command.save(outputPath);
  });
}

/**
 * Get the duration of a video file
 */
export async function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(metadata.format.duration || 0);
    });
  });
}

/**
 * Convert a downloaded video to another format
 */
export async function convertDownloadedVideo(
  downloadItem: DownloadItem,
  options: ConversionOptions,
  progressCallback?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  if (!downloadItem.outputPath) {
    throw new Error('Download item has no output path');
  }
  
  // Check if the file exists
  if (!await fs.pathExists(downloadItem.outputPath)) {
    throw new Error(`File not found: ${downloadItem.outputPath}`);
  }
  
  // Convert the file
  return convertFile(downloadItem.outputPath, options, progressCallback);
}

/**
 * Extract audio from a video file
 */
export async function extractAudio(
  inputPath: string,
  format: 'mp3' | 'aac' | 'flac' | 'opus' | 'm4a' = 'mp3',
  progressCallback?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  return convertFile(
    inputPath,
    {
      format,
      audioBitrate: format === 'mp3' ? '192k' : '256k'
    },
    progressCallback
  );
}

/**
 * Change the resolution of a video file
 */
export async function changeResolution(
  inputPath: string,
  quality: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p',
  progressCallback?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  // Determine format from input path
  const format = path.extname(inputPath).slice(1) as OutputFormat;
  
  return convertFile(
    inputPath,
    {
      format,
      quality
    },
    progressCallback
  );
}

/**
 * Trim a video file
 */
export async function trimVideo(
  inputPath: string,
  startTime: string,
  endTime: string,
  progressCallback?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  // Determine format from input path
  const format = path.extname(inputPath).slice(1) as OutputFormat;
  
  return convertFile(
    inputPath,
    {
      format,
      startTime,
      endTime
    },
    progressCallback
  );
}

/**
 * Get available formats for conversion
 */
export function getAvailableFormats(): { video: OutputFormat[], audio: OutputFormat[] } {
  return {
    video: ['mp4', 'webm'],
    audio: ['mp3', 'aac', 'flac', 'opus', 'm4a']
  };
}

/**
 * Get available quality options
 */
export function getAvailableQualities(): string[] {
  return ['360p', '480p', '720p', '1080p', '1440p', '2160p'];
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hours > 0 ? hours.toString().padStart(2, '0') : '',
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].filter(Boolean).join(':');
}
