/**
 * Dependency Manager Interfaces
 * Defines the contract for managing external dependencies like yt-dlp and FFmpeg
 */
export interface DependencyStatus {
    ytdlp: DependencyInfo;
    ffmpeg: DependencyInfo;
}
export interface DependencyInfo {
    name: string;
    version?: string;
    path: string;
    installed: boolean;
    isValid: boolean;
    error?: string;
}
export interface DependencyManagerService {
    /**
     * Check the status of all required dependencies
     */
    checkDependencies(): Promise<DependencyStatus>;
    /**
     * Install a specific dependency
     */
    installDependency(name: 'ytdlp' | 'ffmpeg'): Promise<void>;
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
     * Initialize the dependency manager
     */
    initialize(): Promise<void>;
}
export interface PlatformDependencyConfig {
    ytdlp: {
        downloadUrl: string;
        filename: string;
        executable: string;
    };
    ffmpeg: {
        downloadUrl: string;
        filename: string;
        executable: string;
    };
}
export interface DependencyDownloadProgress {
    dependency: 'ytdlp' | 'ffmpeg';
    progress: number;
    status: 'downloading' | 'extracting' | 'installing' | 'complete' | 'error';
    message?: string;
}
//# sourceMappingURL=dependency-manager.d.ts.map