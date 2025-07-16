/**
 * Security Implementation Demonstration
 * This script demonstrates the enhanced security features implemented in Task 9
 */
declare const mockProcess: {
    contextIsolated: boolean;
    env: {
        NODE_ENV: string;
    };
};
declare const allowedChannels: Set<string>;
declare function validateChannelAccess(channel: string): boolean;
declare const testChannels: string[];
declare function validateArguments(args: any[]): boolean;
declare const testArgs: (string | number)[][];
declare const API_VERSION = "1.0.0";
declare const SUPPORTED_VERSIONS: string[];
declare function validateAPIVersion(requestedVersion?: string): boolean;
declare const testVersions: (string | undefined)[];
declare const dangerousGlobals: string[];
declare const mockGlobal: {
    require: () => void;
    exports: {};
    module: {};
    safeProperty: string;
    Buffer: BufferConstructor;
};
declare const foundDangerous: string[];
declare const timeoutMs = 1000;
declare function simulateTimeoutProtection(): Promise<void>;
//# sourceMappingURL=security-demo.d.ts.map