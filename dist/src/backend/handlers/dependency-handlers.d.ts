/**
 * IPC handlers for dependency management
 * Provides secure communication between main and renderer processes for dependency operations
 */
import { DependencyManagerService } from '../services/dependency-manager-service';
/**
 * Initialize dependency IPC handlers
 */
export declare function initializeDependencyHandlers(): void;
/**
 * Get the dependency manager instance
 */
export declare function getDependencyManager(): DependencyManagerService | null;
/**
 * Cleanup dependency handlers
 */
export declare function cleanupDependencyHandlers(): void;
//# sourceMappingURL=dependency-handlers.d.ts.map