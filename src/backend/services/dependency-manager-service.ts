/**
 * Dependency Manager Service
 * Manages external dependencies like yt-dlp and FFmpeg
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';
import {
  DependencyError,
  DependencyInstallationError,
  DependencyValidationError,
  DependencyDownloadError,
} from '@/shared/errors';
import type {
  DependencyManagerService as IDependencyManagerService,
  DependencyStatus,
  DependencyInfo,
  DependencyDownloadProgress,
} from '@/shared/interfaces/dependency-manager';
import {
  getDependencyConfig,
  getDependenciesDirectory,
  getDependencyDirectory,
  getDependencyExecutablePath,
  isPlatformSupported,
  getExecutablePermissions,
} from '../config/dependency-config';
import {
  downloadFile,
  extractZip,
  extractTar,
  makeExecutable,
  validateBinary,
  getBinaryVersion,
  cleanupTempFiles,
  retryWithBackoff,
  checkUrlAccessibility,
} from '../utils/dependency-utils';

export class DependencyManagerService extends EventEmitter implements IDependencyManagerService {
  private initialized = false;
  private dependencyStatus: DependencyStatus | null = null;

  constructor() {
    super();
  }

  /**
   * Initialize the dependency manager
   */
  async initialize(): Promise<void> {
    try {
      if (!isPlatformSupported()) {
        throw new DependencyError(`Unsupported platform: ${os.platform()}`);
      }

      // Ensure dependencies directory exists
      const depsDir = getDependenciesDirectory();
      await fs.ensureDir(depsDir);

      // Check initial dependency status
      await this.checkDependencies();

      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new DependencyError(`Failed to initialize dependency manager: ${message}`);
    }
  }

  /**
   * Check the status of all required dependencies
   */
  async checkDependencies(): Promise<DependencyStatus> {
    try {
      const [ytdlpStatus, ffmpegStatus] = await Promise.all([
        this.checkSingleDependency('ytdlp'),
        this.checkSingleDependency('ffmpeg'),
      ]);

      this.dependencyStatus = {
        ytdlp: ytdlpStatus,
        ffmpeg: ffmpegStatus,
      };

      this.emit('statusUpdated', this.dependencyStatus);
      return this.dependencyStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new DependencyError(`Failed to check dependencies: ${message}`);
    }
  }

  /**
   * Check the status of a single dependency
   */
  private async checkSingleDependency(name: 'ytdlp' | 'ffmpeg'): Promise<DependencyInfo> {
    try {
      const executablePath = getDependencyExecutablePath(name);
      const isValid = await validateBinary(executablePath);

      if (!isValid) {
        return {
          name,
          path: executablePath,
          installed: false,
          isValid: false,
          error: 'Binary not found or not executable',
        };
      }

      const version = await getBinaryVersion(executablePath);

      return {
        name,
        path: executablePath,
        installed: true,
        isValid: true,
        version: version || 'Unknown',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        name,
        path: getDependencyExecutablePath(name),
        installed: false,
        isValid: false,
        error: message,
      };
    }
  }

  /**
   * Install a specific dependency
   */
  async installDependency(name: 'ytdlp' | 'ffmpeg'): Promise<void> {
    try {
      this.emit('installStarted', name);

      const config = getDependencyConfig();
      const dependencyConfig = name === 'ytdlp' ? config.ytdlp : config.ffmpeg;
      const dependencyDir = getDependencyDirectory(name);
      const tempDir = path.join(os.tmpdir(), `playlistify-${name}-${Date.now()}`);

      // Clean up any existing installation
      if (await fs.pathExists(dependencyDir)) {
        await fs.remove(dependencyDir);
      }

      // Create directories
      await fs.ensureDir(dependencyDir);
      await fs.ensureDir(tempDir);

      try {
        // Check if download URL is accessible
        const isAccessible = await checkUrlAccessibility(dependencyConfig.downloadUrl);
        if (!isAccessible) {
          throw new DependencyDownloadError(`Download URL is not accessible: ${dependencyConfig.downloadUrl}`);
        }

        // Download the dependency
        const downloadPath = path.join(tempDir, dependencyConfig.filename);
        
        await retryWithBackoff(async () => {
          await downloadFile(
            dependencyConfig.downloadUrl,
            downloadPath,
            (progress) => {
              progress.dependency = name;
              this.emit('downloadProgress', progress);
            }
          );
        });

        this.emit('downloadProgress', {
          dependency: name,
          progress: 100,
          status: 'extracting',
          message: 'Extracting files...',
        });

        // Extract and install
        await this.extractAndInstall(name, downloadPath, dependencyDir);

        // Validate installation
        const isValid = await this.validateDependency(name);
        if (!isValid) {
          throw new DependencyValidationError(`Installation validation failed for ${name}`);
        }

        // Update status
        await this.checkDependencies();

        this.emit('installCompleted', name);
      } finally {
        // Clean up temp files
        await cleanupTempFiles(tempDir);
      }
    } catch (error) {
      this.emit('installFailed', name, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new DependencyInstallationError(`Failed to install ${name}: ${message}`);
    }
  }

  /**
   * Extract and install a dependency
   */
  private async extractAndInstall(
    name: 'ytdlp' | 'ffmpeg',
    downloadPath: string,
    installDir: string
  ): Promise<void> {
    const binDir = path.join(installDir, 'bin');
    await fs.ensureDir(binDir);

    if (name === 'ytdlp') {
      // yt-dlp is usually a single executable
      if (downloadPath.endsWith('.exe') || !downloadPath.includes('.')) {
        // Direct executable
        const config = getDependencyConfig();
        const targetPath = path.join(binDir, config.ytdlp.executable);
        await fs.copy(downloadPath, targetPath);
        await makeExecutable(targetPath);
      } else {
        throw new DependencyInstallationError('Unexpected yt-dlp package format');
      }
    } else if (name === 'ffmpeg') {
      // FFmpeg comes in various archive formats
      const tempExtractDir = path.join(path.dirname(downloadPath), 'extract');
      await fs.ensureDir(tempExtractDir);

      if (downloadPath.endsWith('.zip')) {
        await extractZip(downloadPath, tempExtractDir);
      } else if (downloadPath.endsWith('.tar.xz') || downloadPath.endsWith('.tar.gz')) {
        await extractTar(downloadPath, tempExtractDir);
      } else {
        throw new DependencyInstallationError('Unsupported FFmpeg archive format');
      }

      // Find and copy the ffmpeg executable
      const ffmpegExecutable = await this.findExecutableInDirectory(tempExtractDir, 'ffmpeg');
      if (!ffmpegExecutable) {
        throw new DependencyInstallationError('FFmpeg executable not found in archive');
      }

      const config = getDependencyConfig();
      const targetPath = path.join(binDir, config.ffmpeg.executable);
      await fs.copy(ffmpegExecutable, targetPath);
      await makeExecutable(targetPath);

      // Clean up temp extraction
      await cleanupTempFiles(tempExtractDir);
    }
  }

  /**
   * Find an executable in a directory (recursively)
   */
  private async findExecutableInDirectory(dir: string, executableName: string): Promise<string | null> {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isFile()) {
          const baseName = path.basename(item.name, path.extname(item.name));
          if (baseName === executableName || item.name === executableName || 
              (process.platform === 'win32' && item.name === `${executableName}.exe`)) {
            return fullPath;
          }
        } else if (item.isDirectory()) {
          const found = await this.findExecutableInDirectory(fullPath, executableName);
          if (found) {
            return found;
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get the path to a dependency binary
   */
  getDependencyPath(name: 'ytdlp' | 'ffmpeg'): string {
    return getDependencyExecutablePath(name);
  }

  /**
   * Validate that a dependency is properly installed and functional
   */
  async validateDependency(name: 'ytdlp' | 'ffmpeg'): Promise<boolean> {
    try {
      const executablePath = getDependencyExecutablePath(name);
      
      // Check if binary exists and is executable
      const isValid = await validateBinary(executablePath);
      if (!isValid) {
        return false;
      }

      // Try to get version to ensure it's working
      const version = await getBinaryVersion(executablePath);
      return version !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get version information for a dependency
   */
  async getDependencyVersion(name: 'ytdlp' | 'ffmpeg'): Promise<string | null> {
    try {
      const executablePath = getDependencyExecutablePath(name);
      return await getBinaryVersion(executablePath);
    } catch {
      return null;
    }
  }

  /**
   * Clean up all managed dependencies
   */
  async cleanupDependencies(): Promise<void> {
    try {
      const depsDir = getDependenciesDirectory();
      if (await fs.pathExists(depsDir)) {
        await fs.remove(depsDir);
      }
      
      // Reset status
      this.dependencyStatus = null;
      await this.checkDependencies();
      
      this.emit('dependenciesCleanedUp');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new DependencyError(`Failed to cleanup dependencies: ${message}`);
    }
  }

  /**
   * Get current dependency status (cached)
   */
  getDependencyStatus(): DependencyStatus | null {
    return this.dependencyStatus;
  }

  /**
   * Check if the dependency manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if all dependencies are installed and valid
   */
  areAllDependenciesReady(): boolean {
    if (!this.dependencyStatus) {
      return false;
    }

    return this.dependencyStatus.ytdlp.installed && 
           this.dependencyStatus.ytdlp.isValid &&
           this.dependencyStatus.ffmpeg.installed && 
           this.dependencyStatus.ffmpeg.isValid;
  }
}