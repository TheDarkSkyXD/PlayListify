/**
 * Dependency Manager Service
 * Manages external dependencies like yt-dlp and FFmpeg
 */
import { EventEmitter } from 'events';
import type { DependencyManagerService as IDependencyManagerService, DependencyStatus } from '@/shared/interfaces/dependency-manager';
export declare class DependencyManagerService extends EventEmitter implements IDependencyManagerService {
    private initialized;
    private dependencyStatus;
    constructor();
    /**
     * Initialize the dependency manager
     */
    initialize(): Promise<void>;
    /**
     * Check the status of all required dependencies
     */
    checkDependencies(): Promise<DependencyStatus>;
    /**
     * Check the status of a single dependency
     */
    private checkSingleDependency;
    /**
     * Install a specific dependency
     */
    installDependency(name: 'ytdlp' | 'ffmpeg'): Promise<void>;
    /**
     * Extract and install a dependency
     */
    private extractAndInstall;
    /**
     * Find an executable in a directory (recursively)
     */
    private findExecutableInDirectory;
    /**
     * Get the path to a dependency binary
     */
    getDependencyPath(name: 'ytdlp' | 'ffmpeg'): string;
    /**
     * Validate that a dependency is properly installed and functional
     */
    validateDependency(name: 'ytdlp' | 'ffmpeg'): Promise<boolean>;
    /**
     * Get version information for a dependency
     */
    getDependencyVersion(name: 'ytdlp' | 'ffmpeg'): Promise<string | null>;
    /**
     * Clean up all managed dependencies
     */
    cleanupDependencies(): Promise<void>;
    /**
     * Get current dependency status (cached)
     */
    getDependencyStatus(): DependencyStatus | null;
    /**
     * Check if the dependency manager is initialized
     */
    isInitialized(): boolean;
    /**
     * Check if all dependencies are installed and valid
     */
    areAllDependenciesReady(): boolean;
}
//# sourceMappingURL=dependency-manager-service.d.ts.map