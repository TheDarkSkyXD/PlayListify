/**
 * Platform-specific dependency configuration
 * Defines download URLs and file information for yt-dlp and FFmpeg on different platforms
 */

import * as os from 'os';
import * as path from 'path';
import type { PlatformDependencyConfig } from '@/shared/interfaces/dependency-manager';

const PLATFORM = os.platform();
const ARCH = os.arch();

/**
 * Get platform-specific dependency configuration
 */
export function getDependencyConfig(): PlatformDependencyConfig {
  switch (PLATFORM) {
    case 'win32':
      return getWindowsConfig();
    case 'darwin':
      return getMacOSConfig();
    case 'linux':
      return getLinuxConfig();
    default:
      throw new Error(`Unsupported platform: ${PLATFORM}`);
  }
}

function getWindowsConfig(): PlatformDependencyConfig {
  return {
    ytdlp: {
      downloadUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
      filename: 'yt-dlp.exe',
      executable: 'yt-dlp.exe',
    },
    ffmpeg: {
      downloadUrl: ARCH === 'x64' 
        ? 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip'
        : 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win32-gpl.zip',
      filename: ARCH === 'x64' ? 'ffmpeg-win64-gpl.zip' : 'ffmpeg-win32-gpl.zip',
      executable: 'ffmpeg.exe',
    },
  };
}

function getMacOSConfig(): PlatformDependencyConfig {
  return {
    ytdlp: {
      downloadUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
      filename: 'yt-dlp',
      executable: 'yt-dlp',
    },
    ffmpeg: {
      downloadUrl: ARCH === 'arm64'
        ? 'https://evermeet.cx/ffmpeg/getrelease/zip'
        : 'https://evermeet.cx/ffmpeg/getrelease/zip',
      filename: 'ffmpeg-macos.zip',
      executable: 'ffmpeg',
    },
  };
}

function getLinuxConfig(): PlatformDependencyConfig {
  return {
    ytdlp: {
      downloadUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
      filename: 'yt-dlp',
      executable: 'yt-dlp',
    },
    ffmpeg: {
      downloadUrl: ARCH === 'x64'
        ? 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz'
        : 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz',
      filename: ARCH === 'x64' ? 'ffmpeg-linux-amd64.tar.xz' : 'ffmpeg-linux-i686.tar.xz',
      executable: 'ffmpeg',
    },
  };
}

/**
 * Get the dependencies directory path
 */
export function getDependenciesDirectory(): string {
  const { app } = require('electron');
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'dependencies');
}

/**
 * Get the path for a specific dependency
 */
export function getDependencyDirectory(dependencyName: 'ytdlp' | 'ffmpeg'): string {
  return path.join(getDependenciesDirectory(), dependencyName);
}

/**
 * Get the full path to a dependency executable
 */
export function getDependencyExecutablePath(dependencyName: 'ytdlp' | 'ffmpeg'): string {
  const config = getDependencyConfig();
  const dependencyDir = getDependencyDirectory(dependencyName);
  
  if (dependencyName === 'ytdlp') {
    return path.join(dependencyDir, 'bin', config.ytdlp.executable);
  } else {
    return path.join(dependencyDir, 'bin', config.ffmpeg.executable);
  }
}

/**
 * Check if the current platform is supported
 */
export function isPlatformSupported(): boolean {
  return ['win32', 'darwin', 'linux'].includes(PLATFORM);
}

/**
 * Get platform-specific file permissions for executables
 */
export function getExecutablePermissions(): number {
  return PLATFORM === 'win32' ? 0o755 : 0o755;
}