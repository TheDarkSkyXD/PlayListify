"use strict";
/**
 * Utility functions for dependency management
 * Provides helper functions for downloading, extracting, and validating dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = downloadFile;
exports.extractZip = extractZip;
exports.extractTar = extractTar;
exports.makeExecutable = makeExecutable;
exports.validateBinary = validateBinary;
exports.getBinaryVersion = getBinaryVersion;
exports.cleanupTempFiles = cleanupTempFiles;
exports.formatBytes = formatBytes;
exports.retryWithBackoff = retryWithBackoff;
exports.checkUrlAccessibility = checkUrlAccessibility;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
const https = tslib_1.__importStar(require("https"));
const http = tslib_1.__importStar(require("http"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const stream_1 = require("stream");
const zlib = tslib_1.__importStar(require("zlib"));
const tar = tslib_1.__importStar(require("tar"));
const errors_1 = require("@/shared/errors");
const streamPipeline = (0, util_1.promisify)(stream_1.pipeline);
/**
 * Download a file from a URL with progress tracking
 */
async function downloadFile(url, destinationPath, onProgress) {
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
                    reject(new errors_1.DependencyDownloadError(`HTTP ${response.statusCode}: ${response.statusMessage}`));
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
                    fs.unlink(destinationPath).catch(() => { }); // Clean up on error
                    reject(new errors_1.DependencyDownloadError(`File write error: ${error.message}`));
                });
            });
            request.on('error', (error) => {
                reject(new errors_1.DependencyDownloadError(`Download error: ${error.message}`));
            });
            request.setTimeout(30000, () => {
                request.destroy();
                reject(new errors_1.DependencyDownloadError('Download timeout'));
            });
        });
    }
    catch (error) {
        throw new errors_1.DependencyDownloadError(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Extract a ZIP file
 */
async function extractZip(zipPath, extractPath) {
    try {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(zipPath);
        await fs.ensureDir(extractPath);
        zip.extractAllTo(extractPath, true);
    }
    catch (error) {
        throw new errors_1.DependencyInstallationError(`Failed to extract ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Extract a TAR file (with optional compression)
 */
async function extractTar(tarPath, extractPath) {
    try {
        await fs.ensureDir(extractPath);
        const readStream = fs.createReadStream(tarPath);
        let extractStream;
        if (tarPath.endsWith('.gz') || tarPath.endsWith('.tgz')) {
            extractStream = readStream.pipe(zlib.createGunzip());
        }
        else if (tarPath.endsWith('.xz')) {
            // For .xz files, we need to use a different approach
            const { spawn } = require('child_process');
            return new Promise((resolve, reject) => {
                const xz = spawn('tar', ['-xJf', tarPath, '-C', extractPath]);
                xz.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    }
                    else {
                        reject(new errors_1.DependencyInstallationError(`tar extraction failed with code ${code}`));
                    }
                });
                xz.on('error', (error) => {
                    reject(new errors_1.DependencyInstallationError(`tar extraction error: ${error.message}`));
                });
            });
        }
        else {
            extractStream = readStream;
        }
        await streamPipeline(extractStream, tar.extract({ cwd: extractPath, strip: 1 }));
    }
    catch (error) {
        throw new errors_1.DependencyInstallationError(`Failed to extract TAR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Make a file executable (Unix-like systems)
 */
async function makeExecutable(filePath) {
    try {
        if (process.platform !== 'win32') {
            await fs.chmod(filePath, 0o755);
        }
    }
    catch (error) {
        throw new errors_1.DependencyInstallationError(`Failed to make file executable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Validate that a binary exists and is executable
 */
async function validateBinary(binaryPath) {
    try {
        // Check if file exists
        const exists = await fs.pathExists(binaryPath);
        if (!exists) {
            return false;
        }
        // Check if file is executable
        try {
            await fs.access(binaryPath, fs.constants.F_OK | fs.constants.X_OK);
        }
        catch {
            return false;
        }
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Get version information from a binary
 */
async function getBinaryVersion(binaryPath, versionArgs = ['--version']) {
    try {
        return new Promise((resolve) => {
            const process = (0, child_process_1.spawn)(binaryPath, versionArgs, {
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
                }
                else if (errorOutput.trim()) {
                    // Some tools output version to stderr
                    const firstLine = errorOutput.split('\n')[0];
                    const versionMatch = firstLine.match(/(\d+\.[\d.]+)/);
                    resolve(versionMatch ? versionMatch[1] : firstLine.trim());
                }
                else {
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
    }
    catch {
        return null;
    }
}
/**
 * Clean up temporary files and directories
 */
async function cleanupTempFiles(tempDir) {
    try {
        if (await fs.pathExists(tempDir)) {
            await fs.remove(tempDir);
        }
    }
    catch (error) {
        // Log but don't throw - cleanup failures shouldn't break the main process
        console.warn(`Failed to cleanup temp files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            if (attempt === maxRetries) {
                break;
            }
            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
/**
 * Check if a URL is accessible
 */
async function checkUrlAccessibility(url) {
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
//# sourceMappingURL=dependency-utils.js.map