/**
 * Utility functions for dependency management
 * Provides helper functions for downloading, extracting, and validating dependencies
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { pipeline } from 'stream';
import * as zlib from 'zlib';
import * as tar from 'tar';
import { 
  DependencyDownloadError, 
  DependencyInstallationError, 
  DependencyValidationError 
} from '@/shared/errors';
import type { DependencyDownloadProgress } from '@/shared/interfaces/dependency-manager';

const streamPipeline = promisify(pipeline);

/**
 * Download a file from a URL with progress tracking
 */
export async function downloadFile(
  url: string, 
  destinationPath: string,
  onProgress?: (progress: DependencyDownloadProgress) => void
): Promise<void> {
  try {
    await fs.ensureDir(path.dirname(destinationPath));
    
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const request = protocol.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirects
          if (response.headers.location) {
            downloadFile(response.headers.location, destinationPath, onProgress)
              .then(resolve)
              .catch(reject);
            return;
          }
        }
        
        if (response.statusCode !== 200) {
          reject(new DependencyDownloadError(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;
        
        const fileStream = fs.createWriteStream(destinationPath);
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          
          if (onProgress && totalSize > 0) {
            const progress = Math.round((downloadedSize / totalSize) * 100);
            onProgress({
              dependency: 'ytdlp', // Will be set by caller
              progress,
              status: 'downloading',
              message: `Downloaded ${formatBytes(downloadedSize)} of ${formatBytes(totalSize)}`,
            });
          }
        });
        
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        
        fileStream.on('error', (error) => {
          fs.unlink(destinationPath).catch(() => {}); // Clean up on error
          reject(new DependencyDownloadError(`File write error: ${error.message}`));
        });
      });
      
      request.on('error', (error) => {
        reject(new DependencyDownloadError(`Download error: ${error.message}`));
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new DependencyDownloadError('Download timeout'));
      });
    });
  } catch (error) {
    throw new DependencyDownloadError(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract a ZIP file
 */
export async function extractZip(zipPath: string, extractPath: string): Promise<void> {
  try {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    
    await fs.ensureDir(extractPath);
    zip.extractAllTo(extractPath, true);
  } catch (error) {
    throw new DependencyInstallationError(`Failed to extract ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract a TAR file (with optional compression)
 */
export async function extractTar(tarPath: string, extractPath: string): Promise<void> {
  try {
    await fs.ensureDir(extractPath);
    
    const readStream = fs.createReadStream(tarPath);
    let extractStream;
    
    if (tarPath.endsWith('.gz') || tarPath.endsWith('.tgz')) {
      extractStream = readStream.pipe(zlib.createGunzip());
    } else if (tarPath.endsWith('.xz')) {
      // For .xz files, we need to use a different approach
      const { spawn } = require('child_process');
      return new Promise((resolve, reject) => {
        const xz = spawn('tar', ['-xJf', tarPath, '-C', extractPath]);
        xz.on('close', (code: number) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new DependencyInstallationError(`tar extraction failed with code ${code}`));
          }
        });
        xz.on('error', (error: Error) => {
          reject(new DependencyInstallationError(`tar extraction error: ${error.message}`));
        });
      });
    } else {
      extractStream = readStream;
    }
    
    await streamPipeline(
      extractStream,
      tar.extract({ cwd: extractPath, strip: 1 })
    );
  } catch (error) {
    throw new DependencyInstallationError(`Failed to extract TAR: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Make a file executable (Unix-like systems)
 */
export async function makeExecutable(filePath: string): Promise<void> {
  try {
    if (process.platform !== 'win32') {
      await fs.chmod(filePath, 0o755);
    }
  } catch (error) {
    throw new DependencyInstallationError(`Failed to make file executable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate that a binary exists and is executable
 */
export async function validateBinary(binaryPath: string): Promise<boolean> {
  try {
    // Check if file exists
    const exists = await fs.pathExists(binaryPath);
    if (!exists) {
      return false;
    }
    
    // Check if file is executable
    try {
      await fs.access(binaryPath, fs.constants.F_OK | fs.constants.X_OK);
    } catch {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Get version information from a binary
 */
export async function getBinaryVersion(binaryPath: string, versionArgs: string[] = ['--version']): Promise<string | null> {
  try {
    return new Promise((resolve) => {
      const process = spawn(binaryPath, versionArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10000,
      });
      
      let output = '';
      let errorOutput = '';
      
      process.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0 && output.trim()) {
          // Extract version from output (first line usually contains version)
          const firstLine = output.split('\n')[0];
          const versionMatch = firstLine.match(/(\d+\.[\d.]+)/);
          resolve(versionMatch ? versionMatch[1] : firstLine.trim());
        } else if (errorOutput.trim()) {
          // Some tools output version to stderr
          const firstLine = errorOutput.split('\n')[0];
          const versionMatch = firstLine.match(/(\d+\.[\d.]+)/);
          resolve(versionMatch ? versionMatch[1] : firstLine.trim());
        } else {
          resolve(null);
        }
      });
      
      process.on('error', () => {
        resolve(null);
      });
      
      // Timeout fallback
      setTimeout(() => {
        process.kill();
        resolve(null);
      }, 10000);
    });
  } catch {
    return null;
  }
}

/**
 * Clean up temporary files and directories
 */
export async function cleanupTempFiles(tempDir: string): Promise<void> {
  try {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  } catch (error) {
    // Log but don't throw - cleanup failures shouldn't break the main process
    console.warn(`Failed to cleanup temp files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Check if a URL is accessible
 */
export async function checkUrlAccessibility(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.request(url, { method: 'HEAD', timeout: 5000 }, (response) => {
      resolve(response.statusCode === 200 || response.statusCode === 302 || response.statusCode === 301);
    });
    
    request.on('error', () => {
      resolve(false);
    });
    
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
    
    request.end();
  });
}