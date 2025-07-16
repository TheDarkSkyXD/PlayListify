"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevelopmentService = void 0;
exports.createDevelopmentService = createDevelopmentService;
exports.getDevelopmentService = getDevelopmentService;
const tslib_1 = require("tslib");
const electron_1 = require("electron");
const logger_service_1 = require("./logger-service");
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
class DevelopmentService {
    constructor(config) {
        this.logger = (0, logger_service_1.getLogger)();
        this.performanceMetrics = [];
        this.startTime = Date.now();
        this.config = {
            enabled: process.env.NODE_ENV === 'development',
            hotReload: process.env.NODE_ENV === 'development',
            devTools: process.env.NODE_ENV === 'development',
            debugLogging: process.env.NODE_ENV === 'development',
            performanceMonitoring: process.env.NODE_ENV === 'development',
            memoryTracking: process.env.NODE_ENV === 'development',
            ...config
        };
        if (this.config.enabled) {
            this.initialize();
        }
    }
    initialize() {
        this.logger.debug('Development service initialized', 'DevelopmentService', {
            config: this.config
        });
        // Start performance monitoring
        if (this.config.performanceMonitoring) {
            this.startPerformanceMonitoring();
        }
        // Start memory tracking
        if (this.config.memoryTracking) {
            this.startMemoryTracking();
        }
        // Set up development event listeners
        this.setupDevelopmentEventListeners();
    }
    startPerformanceMonitoring() {
        const startupTime = Date.now() - this.startTime;
        const metrics = {
            startupTime,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            timestamp: new Date().toISOString()
        };
        this.performanceMetrics.push(metrics);
        this.logger.debug('Performance metrics collected', 'DevelopmentService', {
            startupTime: `${startupTime}ms`,
            memoryUsage: this.formatMemoryUsage(metrics.memoryUsage)
        });
    }
    startMemoryTracking() {
        // Track memory usage every 30 seconds in development
        this.memoryTrackingInterval = setInterval(() => {
            const memoryUsage = process.memoryUsage();
            this.logger.debug('Memory usage', 'DevelopmentService', {
                memory: this.formatMemoryUsage(memoryUsage)
            });
            // Warn if memory usage is high
            const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
            if (heapUsedMB > 100) {
                this.logger.warn('High memory usage detected', 'DevelopmentService', {
                    heapUsedMB: Math.round(heapUsedMB),
                    threshold: 100
                });
            }
        }, 30000);
    }
    formatMemoryUsage(memoryUsage) {
        return {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        };
    }
    setupDevelopmentEventListeners() {
        // Listen for app events and log them for debugging
        electron_1.app.on('browser-window-created', (event, window) => {
            this.logger.debug('Browser window created', 'DevelopmentService', {
                windowId: window.id,
                title: window.getTitle()
            });
            // Set up window-specific development features
            if (this.config.devTools) {
                window.webContents.on('did-finish-load', () => {
                    this.logger.debug('Window finished loading', 'DevelopmentService', {
                        windowId: window.id,
                        url: window.webContents.getURL()
                    });
                });
                window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
                    this.logger.error('Window failed to load', 'DevelopmentService', {
                        windowId: window.id,
                        errorCode,
                        errorDescription,
                        url: validatedURL
                    });
                });
            }
        });
        electron_1.app.on('browser-window-focus', (event, window) => {
            this.logger.debug('Window focused', 'DevelopmentService', {
                windowId: window.id
            });
        });
        electron_1.app.on('browser-window-blur', (event, window) => {
            this.logger.debug('Window blurred', 'DevelopmentService', {
                windowId: window.id
            });
        });
    }
    getPerformanceMetrics() {
        return [...this.performanceMetrics];
    }
    getCurrentMemoryUsage() {
        return process.memoryUsage();
    }
    getFormattedMemoryUsage() {
        return this.formatMemoryUsage(this.getCurrentMemoryUsage());
    }
    logSystemInfo() {
        if (!this.config.enabled)
            return;
        const systemInfo = {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            electronVersion: process.versions.electron,
            chromeVersion: process.versions.chrome,
            v8Version: process.versions.v8,
            appVersion: electron_1.app.getVersion(),
            appName: electron_1.app.getName(),
            userDataPath: electron_1.app.getPath('userData'),
            tempPath: electron_1.app.getPath('temp'),
            homePath: electron_1.app.getPath('home')
        };
        this.logger.info('System information', 'DevelopmentService', systemInfo);
    }
    async exportDevelopmentData() {
        if (!this.config.enabled) {
            throw new Error('Development service is not enabled');
        }
        const developmentData = {
            config: this.config,
            performanceMetrics: this.performanceMetrics,
            currentMemoryUsage: this.getCurrentMemoryUsage(),
            systemInfo: {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                electronVersion: process.versions.electron,
                chromeVersion: process.versions.chrome,
                v8Version: process.versions.v8,
                appVersion: electron_1.app.getVersion()
            },
            timestamp: new Date().toISOString()
        };
        try {
            const userDataPath = electron_1.app.getPath('userData');
            const exportPath = path.join(userDataPath, 'development-data.json');
            await fs.writeJson(exportPath, developmentData, { spaces: 2 });
            this.logger.info('Development data exported', 'DevelopmentService', {
                exportPath
            });
            return exportPath;
        }
        catch (error) {
            this.logger.error('Failed to export development data', 'DevelopmentService', {
                error: error.message
            });
            throw error;
        }
    }
    enableDevTools(window) {
        if (!this.config.enabled)
            return;
        const targetWindow = window || electron_1.BrowserWindow.getFocusedWindow();
        if (targetWindow && !targetWindow.isDestroyed()) {
            targetWindow.webContents.openDevTools();
            this.logger.debug('DevTools opened', 'DevelopmentService', {
                windowId: targetWindow.id
            });
        }
    }
    disableDevTools(window) {
        if (!this.config.enabled)
            return;
        const targetWindow = window || electron_1.BrowserWindow.getFocusedWindow();
        if (targetWindow && !targetWindow.isDestroyed()) {
            targetWindow.webContents.closeDevTools();
            this.logger.debug('DevTools closed', 'DevelopmentService', {
                windowId: targetWindow.id
            });
        }
    }
    toggleDevTools(window) {
        if (!this.config.enabled)
            return;
        const targetWindow = window || electron_1.BrowserWindow.getFocusedWindow();
        if (targetWindow && !targetWindow.isDestroyed()) {
            targetWindow.webContents.toggleDevTools();
            this.logger.debug('DevTools toggled', 'DevelopmentService', {
                windowId: targetWindow.id
            });
        }
    }
    forceGarbageCollection() {
        if (!this.config.enabled)
            return;
        if (global.gc) {
            const beforeMemory = process.memoryUsage();
            global.gc();
            const afterMemory = process.memoryUsage();
            this.logger.debug('Garbage collection forced', 'DevelopmentService', {
                before: this.formatMemoryUsage(beforeMemory),
                after: this.formatMemoryUsage(afterMemory),
                freed: `${Math.round((beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024)}MB`
            });
        }
        else {
            this.logger.warn('Garbage collection not available', 'DevelopmentService', {
                hint: 'Start with --expose-gc flag to enable manual garbage collection'
            });
        }
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.logger.debug('Development config updated', 'DevelopmentService', {
            updates,
            newConfig: this.config
        });
        // Restart services if needed
        if (updates.memoryTracking !== undefined) {
            if (this.memoryTrackingInterval) {
                clearInterval(this.memoryTrackingInterval);
                this.memoryTrackingInterval = undefined;
            }
            if (updates.memoryTracking && this.config.enabled) {
                this.startMemoryTracking();
            }
        }
    }
    shutdown() {
        this.logger.debug('Development service shutting down', 'DevelopmentService');
        // Clear intervals
        if (this.memoryTrackingInterval) {
            clearInterval(this.memoryTrackingInterval);
            this.memoryTrackingInterval = undefined;
        }
        // Log final performance metrics
        if (this.config.performanceMonitoring) {
            const totalRuntime = Date.now() - this.startTime;
            const finalMemory = process.memoryUsage();
            this.logger.info('Final development metrics', 'DevelopmentService', {
                totalRuntime: `${totalRuntime}ms`,
                finalMemory: this.formatMemoryUsage(finalMemory),
                totalMetricsCollected: this.performanceMetrics.length
            });
        }
    }
}
exports.DevelopmentService = DevelopmentService;
// Create singleton instance
let developmentServiceInstance = null;
function createDevelopmentService(config) {
    if (!developmentServiceInstance) {
        developmentServiceInstance = new DevelopmentService(config);
    }
    return developmentServiceInstance;
}
function getDevelopmentService() {
    return developmentServiceInstance;
}
//# sourceMappingURL=development-service.js.map