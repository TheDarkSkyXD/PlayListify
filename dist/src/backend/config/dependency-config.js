"use strict";
/**
 * Platform-specific dependency configuration
 * Defines download URLs and file information for yt-dlp and FFmpeg on different platforms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDependencyConfig = getDependencyConfig;
exports.getDependenciesDirectory = getDependenciesDirectory;
exports.getDependencyDirectory = getDependencyDirectory;
exports.getDependencyExecutablePath = getDependencyExecutablePath;
exports.isPlatformSupported = isPlatformSupported;
exports.getExecutablePermissions = getExecutablePermissions;
const tslib_1 = require("tslib");
const os = tslib_1.__importStar(require("os"));
const path = tslib_1.__importStar(require("path"));
const PLATFORM = os.platform();
const ARCH = os.arch();
/**
 * Get platform-specific dependency configuration
 */
function getDependencyConfig() {
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
function getWindowsConfig() {
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
function getMacOSConfig() {
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
function getLinuxConfig() {
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
function getDependenciesDirectory() {
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'dependencies');
}
/**
 * Get the path for a specific dependency
 */
function getDependencyDirectory(dependencyName) {
    return path.join(getDependenciesDirectory(), dependencyName);
}
/**
 * Get the full path to a dependency executable
 */
function getDependencyExecutablePath(dependencyName) {
    const config = getDependencyConfig();
    const dependencyDir = getDependencyDirectory(dependencyName);
    if (dependencyName === 'ytdlp') {
        return path.join(dependencyDir, 'bin', config.ytdlp.executable);
    }
    else {
        return path.join(dependencyDir, 'bin', config.ffmpeg.executable);
    }
}
/**
 * Check if the current platform is supported
 */
function isPlatformSupported() {
    return ['win32', 'darwin', 'linux'].includes(PLATFORM);
}
/**
 * Get platform-specific file permissions for executables
 */
function getExecutablePermissions() {
    return PLATFORM === 'win32' ? 0o755 : 0o755;
}
//# sourceMappingURL=dependency-config.js.map