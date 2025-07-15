/**
 * Platform-specific dependency configuration
 * Defines download URLs and file information for yt-dlp and FFmpeg on different platforms
 */
import type { PlatformDependencyConfig } from '@/shared/interfaces/dependency-manager';
/**
 * Get platform-specific dependency configuration
 */
export declare function getDependencyConfig(): PlatformDependencyConfig;
/**
 * Get the dependencies directory path
 */
export declare function getDependenciesDirectory(): string;
/**
 * Get the path for a specific dependency
 */
export declare function getDependencyDirectory(dependencyName: 'ytdlp' | 'ffmpeg'): string;
/**
 * Get the full path to a dependency executable
 */
export declare function getDependencyExecutablePath(dependencyName: 'ytdlp' | 'ffmpeg'): string;
/**
 * Check if the current platform is supported
 */
export declare function isPlatformSupported(): boolean;
/**
 * Get platform-specific file permissions for executables
 */
export declare function getExecutablePermissions(): number;
//# sourceMappingURL=dependency-config.d.ts.map