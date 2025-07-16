import { BrowserWindow } from 'electron';
export interface DevelopmentConfig {
    enabled: boolean;
    hotReload: boolean;
    devTools: boolean;
    debugLogging: boolean;
    performanceMonitoring: boolean;
    memoryTracking: boolean;
}
export interface PerformanceMetrics {
    startupTime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    timestamp: string;
}
declare class DevelopmentService {
    private config;
    private logger;
    private startTime;
    private performanceMetrics;
    private memoryTrackingInterval?;
    constructor(config?: Partial<DevelopmentConfig>);
    private initialize;
    private startPerformanceMonitoring;
    private startMemoryTracking;
    private formatMemoryUsage;
    private setupDevelopmentEventListeners;
    getPerformanceMetrics(): PerformanceMetrics[];
    getCurrentMemoryUsage(): NodeJS.MemoryUsage;
    getFormattedMemoryUsage(): any;
    logSystemInfo(): void;
    exportDevelopmentData(): Promise<string>;
    enableDevTools(window?: BrowserWindow): void;
    disableDevTools(window?: BrowserWindow): void;
    toggleDevTools(window?: BrowserWindow): void;
    forceGarbageCollection(): void;
    getConfig(): DevelopmentConfig;
    updateConfig(updates: Partial<DevelopmentConfig>): void;
    shutdown(): void;
}
export declare function createDevelopmentService(config?: Partial<DevelopmentConfig>): DevelopmentService;
export declare function getDevelopmentService(): DevelopmentService | null;
export { DevelopmentService };
//# sourceMappingURL=development-service.d.ts.map