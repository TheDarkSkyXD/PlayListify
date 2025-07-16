/**
 * Central IPC handler registry for secure communication between main and renderer processes
 * This file organizes all IPC handlers by functional domains and provides proper error handling
 */
/**
 * Initialize all IPC handlers with proper error handling
 */
export declare function initializeIPCHandlers(): void;
/**
 * Cleanup all IPC handlers
 */
export declare function cleanupIPCHandlers(): void;
/**
 * Utility function to create standardized IPC response
 */
export declare function createIPCResponse<T>(data?: T, error?: string): IPCResponse<T>;
/**
 * Utility function to handle IPC errors consistently
 */
export declare function handleIPCError(error: unknown, context: string): IPCResponse<any>;
/**
 * Standard IPC response interface
 */
export interface IPCResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}
/**
 * Type-safe IPC handler wrapper
 */
export declare function createIPCHandler<TArgs extends any[], TReturn>(handler: (...args: TArgs) => Promise<TReturn> | TReturn): (_event: Electron.IpcMainInvokeEvent, ...args: TArgs) => Promise<IPCResponse<TReturn>>;
//# sourceMappingURL=index.d.ts.map