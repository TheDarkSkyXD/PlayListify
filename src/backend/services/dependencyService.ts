import logger from './logService';
import ytdlpService from './ytdlpService';
import ffmpegService from './ffmpegService';

// Dependency types (kept for backwards compatibility)
export enum DependencyType {
  YTDLP = 'ytdlp',
  FFMPEG = 'ffmpeg',
}

// Get path for a dependency based on type
export const getDependencyPath = (type: DependencyType): string => {
  return type === DependencyType.YTDLP 
    ? ytdlpService.getYtdlpPath() 
    : ffmpegService.getFfmpegPath();
};

// Verify dependency exists and is executable
export const verifyDependency = async (type: DependencyType): Promise<boolean> => {
  return type === DependencyType.YTDLP 
    ? ytdlpService.verifyYtdlp() 
    : ffmpegService.verifyFfmpeg();
};

// Download and install dependencies if needed
export const ensureDependencies = async (): Promise<void> => {
  logger.info('Checking external dependencies...');
  
  // Check both dependencies in parallel
  await Promise.all([
    ytdlpService.ensureYtdlp(),
    ffmpegService.ensureFfmpeg()
  ]);
  
  logger.info('Dependency check completed');
};

export default {
  getDependencyPath,
  verifyDependency,
  ensureDependencies,
  // Re-export individual services for direct access
  ytdlp: ytdlpService,
  ffmpeg: ffmpegService
}; 