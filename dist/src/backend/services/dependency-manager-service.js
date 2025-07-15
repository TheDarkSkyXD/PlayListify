"use strict";
/**
 * Dependency Manager Service
 * Manages external dependencies like yt-dlp and FFmpeg
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyManagerService = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
const os = tslib_1.__importStar(require("os"));
const events_1 = require("events");
const errors_1 = require("@/shared/errors");
const dependency_config_1 = require("../config/dependency-config");
const dependency_utils_1 = require("../utils/dependency-utils");
class DependencyManagerService extends events_1.EventEmitter {
    constructor() {
        super();
        this.initialized = false;
        this.dependencyStatus = null;
    }
    /**
     * Initialize the dependency manager
     */
    async initialize() {
        try {
            if (!(0, dependency_config_1.isPlatformSupported)()) {
                throw new errors_1.DependencyError(`Unsupported platform: ${os.platform()}`);
            }
            // Ensure dependencies directory exists
            const depsDir = (0, dependency_config_1.getDependenciesDirectory)();
            await fs.ensureDir(depsDir);
            // Check initial dependency status
            await this.checkDependencies();
            this.initialized = true;
            this.emit('initialized');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DependencyError(`Failed to initialize dependency manager: ${message}`);
        }
    }
    /**
     * Check the status of all required dependencies
     */
    async checkDependencies() {
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DependencyError(`Failed to check dependencies: ${message}`);
        }
    }
    /**
     * Check the status of a single dependency
     */
    async checkSingleDependency(name) {
        try {
            const executablePath = (0, dependency_config_1.getDependencyExecutablePath)(name);
            const isValid = await (0, dependency_utils_1.validateBinary)(executablePath);
            if (!isValid) {
                return {
                    name,
                    path: executablePath,
                    installed: false,
                    isValid: false,
                    error: 'Binary not found or not executable',
                };
            }
            const version = await (0, dependency_utils_1.getBinaryVersion)(executablePath);
            return {
                name,
                path: executablePath,
                installed: true,
                isValid: true,
                version: version || 'Unknown',
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                name,
                path: (0, dependency_config_1.getDependencyExecutablePath)(name),
                installed: false,
                isValid: false,
                error: message,
            };
        }
    }
    /**
     * Install a specific dependency
     */
    async installDependency(name) {
        try {
            this.emit('installStarted', name);
            const config = (0, dependency_config_1.getDependencyConfig)();
            const dependencyConfig = name === 'ytdlp' ? config.ytdlp : config.ffmpeg;
            const dependencyDir = (0, dependency_config_1.getDependencyDirectory)(name);
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
                const isAccessible = await (0, dependency_utils_1.checkUrlAccessibility)(dependencyConfig.downloadUrl);
                if (!isAccessible) {
                    throw new errors_1.DependencyDownloadError(`Download URL is not accessible: ${dependencyConfig.downloadUrl}`);
                }
                // Download the dependency
                const downloadPath = path.join(tempDir, dependencyConfig.filename);
                await (0, dependency_utils_1.retryWithBackoff)(async () => {
                    await (0, dependency_utils_1.downloadFile)(dependencyConfig.downloadUrl, downloadPath, (progress) => {
                        progress.dependency = name;
                        this.emit('downloadProgress', progress);
                    });
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
                    throw new errors_1.DependencyValidationError(`Installation validation failed for ${name}`);
                }
                // Update status
                await this.checkDependencies();
                this.emit('installCompleted', name);
            }
            finally {
                // Clean up temp files
                await (0, dependency_utils_1.cleanupTempFiles)(tempDir);
            }
        }
        catch (error) {
            this.emit('installFailed', name, error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DependencyInstallationError(`Failed to install ${name}: ${message}`);
        }
    }
    /**
     * Extract and install a dependency
     */
    async extractAndInstall(name, downloadPath, installDir) {
        const binDir = path.join(installDir, 'bin');
        await fs.ensureDir(binDir);
        if (name === 'ytdlp') {
            // yt-dlp is usually a single executable
            if (downloadPath.endsWith('.exe') || !downloadPath.includes('.')) {
                // Direct executable
                const config = (0, dependency_config_1.getDependencyConfig)();
                const targetPath = path.join(binDir, config.ytdlp.executable);
                await fs.copy(downloadPath, targetPath);
                await (0, dependency_utils_1.makeExecutable)(targetPath);
            }
            else {
                throw new errors_1.DependencyInstallationError('Unexpected yt-dlp package format');
            }
        }
        else if (name === 'ffmpeg') {
            // FFmpeg comes in various archive formats
            const tempExtractDir = path.join(path.dirname(downloadPath), 'extract');
            await fs.ensureDir(tempExtractDir);
            if (downloadPath.endsWith('.zip')) {
                await (0, dependency_utils_1.extractZip)(downloadPath, tempExtractDir);
            }
            else if (downloadPath.endsWith('.tar.xz') || downloadPath.endsWith('.tar.gz')) {
                await (0, dependency_utils_1.extractTar)(downloadPath, tempExtractDir);
            }
            else {
                throw new errors_1.DependencyInstallationError('Unsupported FFmpeg archive format');
            }
            // Find and copy the ffmpeg executable
            const ffmpegExecutable = await this.findExecutableInDirectory(tempExtractDir, 'ffmpeg');
            if (!ffmpegExecutable) {
                throw new errors_1.DependencyInstallationError('FFmpeg executable not found in archive');
            }
            const config = (0, dependency_config_1.getDependencyConfig)();
            const targetPath = path.join(binDir, config.ffmpeg.executable);
            await fs.copy(ffmpegExecutable, targetPath);
            await (0, dependency_utils_1.makeExecutable)(targetPath);
            // Clean up temp extraction
            await (0, dependency_utils_1.cleanupTempFiles)(tempExtractDir);
        }
    }
    /**
     * Find an executable in a directory (recursively)
     */
    async findExecutableInDirectory(dir, executableName) {
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
                }
                else if (item.isDirectory()) {
                    const found = await this.findExecutableInDirectory(fullPath, executableName);
                    if (found) {
                        return found;
                    }
                }
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Get the path to a dependency binary
     */
    getDependencyPath(name) {
        return (0, dependency_config_1.getDependencyExecutablePath)(name);
    }
    /**
     * Validate that a dependency is properly installed and functional
     */
    async validateDependency(name) {
        try {
            const executablePath = (0, dependency_config_1.getDependencyExecutablePath)(name);
            // Check if binary exists and is executable
            const isValid = await (0, dependency_utils_1.validateBinary)(executablePath);
            if (!isValid) {
                return false;
            }
            // Try to get version to ensure it's working
            const version = await (0, dependency_utils_1.getBinaryVersion)(executablePath);
            return version !== null;
        }
        catch {
            return false;
        }
    }
    /**
     * Get version information for a dependency
     */
    async getDependencyVersion(name) {
        try {
            const executablePath = (0, dependency_config_1.getDependencyExecutablePath)(name);
            return await (0, dependency_utils_1.getBinaryVersion)(executablePath);
        }
        catch {
            return null;
        }
    }
    /**
     * Clean up all managed dependencies
     */
    async cleanupDependencies() {
        try {
            const depsDir = (0, dependency_config_1.getDependenciesDirectory)();
            if (await fs.pathExists(depsDir)) {
                await fs.remove(depsDir);
            }
            // Reset status
            this.dependencyStatus = null;
            await this.checkDependencies();
            this.emit('dependenciesCleanedUp');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DependencyError(`Failed to cleanup dependencies: ${message}`);
        }
    }
    /**
     * Get current dependency status (cached)
     */
    getDependencyStatus() {
        return this.dependencyStatus;
    }
    /**
     * Check if the dependency manager is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Check if all dependencies are installed and valid
     */
    areAllDependenciesReady() {
        if (!this.dependencyStatus) {
            return false;
        }
        return this.dependencyStatus.ytdlp.installed &&
            this.dependencyStatus.ytdlp.isValid &&
            this.dependencyStatus.ffmpeg.installed &&
            this.dependencyStatus.ffmpeg.isValid;
    }
}
exports.DependencyManagerService = DependencyManagerService;
//# sourceMappingURL=dependency-manager-service.js.map