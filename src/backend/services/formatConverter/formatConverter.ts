import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import ffmpeg from 'fluent-ffmpeg';
import logger from '../../services/logService';
import { getFfmpegPath, ensureFfmpeg } from '../../services/ffmpegService';

// Conversion options types
export interface ConversionOptions {
  format: 'mp4' | 'webm' | 'mkv' | 'mp3' | 'aac' | 'flac' | 'opus' | 'm4a';
  quality?: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | '4320p' | 'best';
  audioBitrate?: string; // e.g., '128k', '192k', '320k'
  videoCodec?: string; // e.g., 'libx264', 'libvpx-vp9'
  audioCodec?: string; // e.g., 'aac', 'libopus'
  outputFilename?: string;
  customOptions?: string[];
}

export interface ConversionProgress {
  percent: number;
  fps?: number;
  kbps?: number;
  targetSize?: number;
  currentSize?: number;
  timemark?: string;
  eta?: string;
}

export interface ConversionResult {
  success: boolean;
  outputPath: string;
  duration: number;
  format: string;
  size: number;
  error?: string;
}

// Initialize the FFmpeg module with the correct path
export async function initFFmpeg(): Promise<void> {
  try {
    // Ensure FFmpeg is installed
    await ensureFfmpeg();
    
    // Set the FFmpeg path
    const ffmpegPath = getFfmpegPath();
    ffmpeg.setFfmpegPath(ffmpegPath);
    
    logger.info(`FFmpeg initialized with path: ${ffmpegPath}`);
  } catch (error) {
    logger.error('Failed to initialize FFmpeg:', error);
    throw new Error('Failed to initialize FFmpeg. Please check your installation.');
  }
}

// Get video duration in seconds
export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (metadata && metadata.format && metadata.format.duration) {
        resolve(metadata.format.duration);
      } else {
        resolve(0);
      }
    });
  });
}

// Get video information
export async function getVideoInfo(videoPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(metadata);
    });
  });
}

// Resolution mapping for quality options
const qualityToResolution = {
  '360p': { width: 640, height: 360 },
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '2160p': { width: 3840, height: 2160 },
  '4320p': { width: 7680, height: 4320 }
};

// Format-specific default codecs
const formatDefaultCodecs = {
  mp4: { video: 'libx264', audio: 'aac' },
  webm: { video: 'libvpx-vp9', audio: 'libopus' },
  mkv: { video: 'libx264', audio: 'aac' },
  mp3: { video: '', audio: 'libmp3lame' },
  aac: { video: '', audio: 'aac' },
  flac: { video: '', audio: 'flac' },
  opus: { video: '', audio: 'libopus' },
  m4a: { video: '', audio: 'aac' }
};

// Convert media file to another format
export async function convertFile(
  inputPath: string,
  options: ConversionOptions,
  progressCallback?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  // Ensure FFmpeg is initialized
  await initFFmpeg();

  // Determine output path based on input path and format
  const parsedPath = path.parse(inputPath);
  const outputFilename = options.outputFilename || `${parsedPath.name}.${options.format}`;
  const outputDir = parsedPath.dir;
  const outputPath = path.join(outputDir, outputFilename);

  // Create FFmpeg command
  const command = ffmpeg(inputPath);

  // Set output format
  command.toFormat(options.format);

  // Determine if this is an audio-only format
  const isAudioOnly = ['mp3', 'aac', 'flac', 'opus', 'm4a'].includes(options.format);

  // Apply video options if not converting to audio-only format
  if (!isAudioOnly) {
    // Set video codec based on format
    const videoCodec = options.videoCodec || formatDefaultCodecs[options.format].video;
    if (videoCodec) {
      command.videoCodec(videoCodec);
    }

    // Set resolution based on quality if specified
    if (options.quality && options.quality !== 'best') {
      const resolution = qualityToResolution[options.quality];
      if (resolution) {
        command.size(`${resolution.width}x${resolution.height}`);
      }
    }
  } else {
    // Remove video stream for audio-only formats
    command.noVideo();
  }

  // Set audio codec and bitrate
  const audioCodec = options.audioCodec || formatDefaultCodecs[options.format].audio;
  if (audioCodec) {
    command.audioCodec(audioCodec);
  }

  if (options.audioBitrate) {
    command.audioBitrate(options.audioBitrate);
  }

  // Add any custom options
  if (options.customOptions && options.customOptions.length > 0) {
    options.customOptions.forEach(opt => {
      command.addOption(opt);
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
        timemark: progress.timemark,
        eta: progress.timemark
      });
    });
  }

  // Execute the conversion
  return new Promise((resolve, reject) => {
    command.on('end', async () => {
      try {
        // Get information about the converted file
        const stats = await fs.stat(outputPath);
        const duration = await getVideoDuration(outputPath);
        
        // Return result with file information
        resolve({
          success: true,
          outputPath,
          duration,
          format: options.format,
          size: stats.size
        });
      } catch (error) {
        logger.error('Error getting converted file info:', error);
        resolve({
          success: true,
          outputPath,
          duration: 0,
          format: options.format,
          size: 0
        });
      }
    }).on('error', (err) => {
      logger.error('Error during conversion:', err);
      reject({
        success: false,
        outputPath: '',
        duration: 0,
        format: options.format,
        size: 0,
        error: err.message
      });
    }).save(outputPath);
  });
}

// Extract audio from video
export async function extractAudio(
  inputPath: string,
  outputFormat: 'mp3' | 'aac' | 'flac' | 'opus' | 'm4a',
  audioBitrate?: string,
  progressCallback?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  return convertFile(
    inputPath,
    {
      format: outputFormat,
      audioBitrate,
      noVideo: true
    } as any,
    progressCallback
  );
}

// Change video resolution/quality
export async function changeVideoQuality(
  inputPath: string,
  quality: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p',
  outputFormat?: 'mp4' | 'webm' | 'mkv',
  progressCallback?: (progress: ConversionProgress) => void
): Promise<ConversionResult> {
  return convertFile(
    inputPath,
    {
      format: outputFormat || path.extname(inputPath).substring(1) as any || 'mp4',
      quality
    },
    progressCallback
  );
}

// Get available conversion formats
export function getAvailableFormats(): Array<{
  id: string;
  name: string;
  type: 'video' | 'audio';
  extensions: string[];
}> {
  return [
    { id: 'mp4', name: 'MP4 (H.264)', type: 'video', extensions: ['.mp4'] },
    { id: 'webm', name: 'WebM (VP9)', type: 'video', extensions: ['.webm'] },
    { id: 'mkv', name: 'MKV (Matroska)', type: 'video', extensions: ['.mkv'] },
    { id: 'mp3', name: 'MP3', type: 'audio', extensions: ['.mp3'] },
    { id: 'aac', name: 'AAC', type: 'audio', extensions: ['.aac', '.m4a'] },
    { id: 'flac', name: 'FLAC', type: 'audio', extensions: ['.flac'] },
    { id: 'opus', name: 'Opus', type: 'audio', extensions: ['.opus'] }
  ];
}

// Get available quality options
export function getAvailableQualities(): Array<{
  id: string;
  name: string;
  resolution?: string;
}> {
  return [
    { id: 'best', name: 'Best Quality (Original)' },
    { id: '4320p', name: '8K (4320p)', resolution: '7680x4320' },
    { id: '2160p', name: '4K (2160p)', resolution: '3840x2160' },
    { id: '1440p', name: '1440p', resolution: '2560x1440' },
    { id: '1080p', name: '1080p Full HD', resolution: '1920x1080' },
    { id: '720p', name: '720p HD', resolution: '1280x720' },
    { id: '480p', name: '480p', resolution: '854x480' },
    { id: '360p', name: '360p', resolution: '640x360' }
  ];
}

// Get available audio bitrates
export function getAvailableAudioBitrates(): Array<{
  id: string;
  name: string;
}> {
  return [
    { id: '320k', name: '320 kbps (High Quality)' },
    { id: '256k', name: '256 kbps' },
    { id: '192k', name: '192 kbps (Standard Quality)' },
    { id: '128k', name: '128 kbps' },
    { id: '96k', name: '96 kbps (Low Quality)' }
  ];
}

// Export a singleton instance
const formatConverter = {
  initFFmpeg,
  getVideoDuration,
  getVideoInfo,
  convertFile,
  extractAudio,
  changeVideoQuality,
  getAvailableFormats,
  getAvailableQualities,
  getAvailableAudioBitrates
};

export default formatConverter; 