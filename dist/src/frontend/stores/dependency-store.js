"use strict";
/**
 * Dependency management state using Zustand
 *
 * This store manages the state of external dependencies (yt-dlp, FFmpeg)
 * including installation status, progress, and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDependencyErrors = exports.useInstallationProgress = exports.useAllDependenciesReady = exports.useDependencyStatus = exports.dependencySelectors = exports.useDependencyStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
const immer_1 = require("zustand/middleware/immer");
// Initial dependency info
const createInitialDependencyInfo = () => ({
    installed: false,
    installing: false,
    installProgress: 0,
});
// Initial state
const initialState = {
    // Overall status
    isInitialized: false,
    isChecking: false,
    allReady: false,
    // Individual dependencies
    dependencies: {
        ytdlp: createInitialDependencyInfo(),
        ffmpeg: createInitialDependencyInfo(),
    },
    // Installation state
    isInstalling: false,
    installQueue: [],
    installProgress: {
        ytdlp: { dependency: 'ytdlp', progress: 0, status: 'idle' },
        ffmpeg: { dependency: 'ffmpeg', progress: 0, status: 'idle' },
    },
    // Error handling
    installErrors: {
        ytdlp: '',
        ffmpeg: '',
    },
};
// Create the store
exports.useDependencyStore = (0, zustand_1.create)()((0, middleware_1.devtools)((0, immer_1.immer)((set, get) => ({
    ...initialState,
    // Status actions
    setInitialized: (initialized) => {
        set((state) => {
            state.isInitialized = initialized;
        });
    },
    setChecking: (checking) => {
        set((state) => {
            state.isChecking = checking;
        });
    },
    setAllReady: (ready) => {
        set((state) => {
            state.allReady = ready;
        });
    },
    updateLastStatusUpdate: () => {
        set((state) => {
            state.lastStatusUpdate = new Date();
        });
    },
    // Dependency info actions
    updateDependency: (name, info) => {
        set((state) => {
            Object.assign(state.dependencies[name], info);
            state.dependencies[name].lastChecked = new Date();
        });
    },
    setDependencyInstalled: (name, installed, version, path) => {
        set((state) => {
            state.dependencies[name].installed = installed;
            state.dependencies[name].version = version;
            state.dependencies[name].path = path;
            state.dependencies[name].installing = false;
            state.dependencies[name].installProgress = installed ? 100 : 0;
            state.dependencies[name].error = undefined;
            state.dependencies[name].lastChecked = new Date();
        });
    },
    setDependencyError: (name, error) => {
        set((state) => {
            state.dependencies[name].error = error;
            state.installErrors[name] = error || '';
        });
    },
    // Installation actions
    startInstallation: (dependencies) => {
        set((state) => {
            state.isInstalling = true;
            state.installQueue = [...dependencies];
            state.currentInstall = dependencies[0];
            // Reset progress for all dependencies being installed
            dependencies.forEach(dep => {
                state.dependencies[dep].installing = true;
                state.dependencies[dep].installProgress = 0;
                state.dependencies[dep].error = undefined;
                state.installProgress[dep] = {
                    dependency: dep,
                    progress: 0,
                    status: 'starting',
                };
                state.installErrors[dep] = '';
            });
        });
    },
    setCurrentInstall: (dependency) => {
        set((state) => {
            state.currentInstall = dependency;
        });
    },
    updateInstallProgress: (dependency, progress) => {
        set((state) => {
            Object.assign(state.installProgress[dependency], progress);
            state.dependencies[dependency].installProgress = progress.progress || 0;
        });
    },
    completeInstallation: (dependency, success, error) => {
        set((state) => {
            // Update dependency status
            state.dependencies[dependency].installing = false;
            state.dependencies[dependency].installed = success;
            state.dependencies[dependency].installProgress = success ? 100 : 0;
            state.dependencies[dependency].error = error;
            // Update install progress
            state.installProgress[dependency].progress = success ? 100 : 0;
            state.installProgress[dependency].status = success ? 'completed' : 'failed';
            // Update errors
            state.installErrors[dependency] = error || '';
            // Remove from queue
            state.installQueue = state.installQueue.filter(dep => dep !== dependency);
            // Set next install or complete
            if (state.installQueue.length > 0) {
                state.currentInstall = state.installQueue[0];
            }
            else {
                state.isInstalling = false;
                state.currentInstall = undefined;
                // Check if all dependencies are ready
                const allInstalled = Object.values(state.dependencies).every(dep => dep.installed);
                state.allReady = allInstalled;
            }
        });
    },
    cancelInstallation: () => {
        set((state) => {
            state.isInstalling = false;
            state.installQueue = [];
            state.currentInstall = undefined;
            // Reset installing status for all dependencies
            Object.keys(state.dependencies).forEach(key => {
                const dep = key;
                state.dependencies[dep].installing = false;
                state.installProgress[dep].status = 'cancelled';
            });
        });
    },
    // Error actions
    setGlobalError: (error) => {
        set((state) => {
            state.globalError = error;
        });
    },
    clearErrors: () => {
        set((state) => {
            state.globalError = undefined;
            Object.keys(state.dependencies).forEach(key => {
                const dep = key;
                state.dependencies[dep].error = undefined;
                state.installErrors[dep] = '';
            });
        });
    },
    // Reset actions
    reset: () => {
        set(() => ({ ...initialState }));
    },
    resetDependency: (name) => {
        set((state) => {
            state.dependencies[name] = createInitialDependencyInfo();
            state.installProgress[name] = {
                dependency: name,
                progress: 0,
                status: 'idle',
            };
            state.installErrors[name] = '';
        });
    },
})), {
    name: 'DependencyStore',
}));
// Selectors for optimized component subscriptions
exports.dependencySelectors = {
    // Overall status
    isInitialized: (state) => state.isInitialized,
    isChecking: (state) => state.isChecking,
    allReady: (state) => state.allReady,
    // Installation status
    isInstalling: (state) => state.isInstalling,
    currentInstall: (state) => state.currentInstall,
    installQueue: (state) => state.installQueue,
    // Dependency info
    dependency: (name) => (state) => state.dependencies[name],
    dependencies: (state) => state.dependencies,
    // Progress
    installProgress: (name) => (state) => state.installProgress[name],
    allInstallProgress: (state) => state.installProgress,
    // Errors
    globalError: (state) => state.globalError,
    installErrors: (state) => state.installErrors,
    hasErrors: (state) => !!state.globalError || Object.values(state.installErrors).some(error => !!error),
};
// Utility hooks for common patterns
const useDependencyStatus = (name) => (0, exports.useDependencyStore)(exports.dependencySelectors.dependency(name));
exports.useDependencyStatus = useDependencyStatus;
const useAllDependenciesReady = () => (0, exports.useDependencyStore)(exports.dependencySelectors.allReady);
exports.useAllDependenciesReady = useAllDependenciesReady;
const useInstallationProgress = (name) => (0, exports.useDependencyStore)(exports.dependencySelectors.installProgress(name));
exports.useInstallationProgress = useInstallationProgress;
const useDependencyErrors = () => (0, exports.useDependencyStore)(exports.dependencySelectors.hasErrors);
exports.useDependencyErrors = useDependencyErrors;
//# sourceMappingURL=dependency-store.js.map