/**
 * Dependency management state using Zustand
 *
 * This store manages the state of external dependencies (yt-dlp, FFmpeg)
 * including installation status, progress, and error handling.
 */
export type DependencyName = 'ytdlp' | 'ffmpeg';
export interface DependencyInfo {
    installed: boolean;
    version?: string;
    path?: string;
    installing: boolean;
    installProgress: number;
    error?: string;
    lastChecked?: Date;
}
export interface InstallProgress {
    dependency: DependencyName;
    progress: number;
    status: string;
    speed?: string;
    eta?: string;
}
export interface DependencyState {
    isInitialized: boolean;
    isChecking: boolean;
    allReady: boolean;
    dependencies: Record<DependencyName, DependencyInfo>;
    isInstalling: boolean;
    installQueue: DependencyName[];
    currentInstall?: DependencyName;
    installProgress: Record<DependencyName, InstallProgress>;
    globalError?: string;
    installErrors: Record<DependencyName, string>;
    lastStatusUpdate?: Date;
}
export interface DependencyActions {
    setInitialized: (initialized: boolean) => void;
    setChecking: (checking: boolean) => void;
    setAllReady: (ready: boolean) => void;
    updateLastStatusUpdate: () => void;
    updateDependency: (name: DependencyName, info: Partial<DependencyInfo>) => void;
    setDependencyInstalled: (name: DependencyName, installed: boolean, version?: string, path?: string) => void;
    setDependencyError: (name: DependencyName, error?: string) => void;
    startInstallation: (dependencies: DependencyName[]) => void;
    setCurrentInstall: (dependency?: DependencyName) => void;
    updateInstallProgress: (dependency: DependencyName, progress: Partial<InstallProgress>) => void;
    completeInstallation: (dependency: DependencyName, success: boolean, error?: string) => void;
    cancelInstallation: () => void;
    setGlobalError: (error?: string) => void;
    clearErrors: () => void;
    reset: () => void;
    resetDependency: (name: DependencyName) => void;
}
export type DependencyStore = DependencyState & DependencyActions;
export declare const useDependencyStore: import("zustand").UseBoundStore<Omit<Omit<import("zustand").StoreApi<DependencyStore>, "setState" | "devtools"> & {
    setState(partial: DependencyStore | Partial<DependencyStore> | ((state: DependencyStore) => DependencyStore | Partial<DependencyStore>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: DependencyStore | ((state: DependencyStore) => DependencyStore), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}, "setState"> & {
    setState(nextStateOrUpdater: DependencyStore | Partial<DependencyStore> | ((state: import("immer").WritableDraft<DependencyStore>) => void), shouldReplace?: false, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(nextStateOrUpdater: DependencyStore | ((state: import("immer").WritableDraft<DependencyStore>) => void), shouldReplace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
}>;
export declare const dependencySelectors: {
    isInitialized: (state: DependencyStore) => boolean;
    isChecking: (state: DependencyStore) => boolean;
    allReady: (state: DependencyStore) => boolean;
    isInstalling: (state: DependencyStore) => boolean;
    currentInstall: (state: DependencyStore) => DependencyName | undefined;
    installQueue: (state: DependencyStore) => DependencyName[];
    dependency: (name: DependencyName) => (state: DependencyStore) => DependencyInfo;
    dependencies: (state: DependencyStore) => Record<DependencyName, DependencyInfo>;
    installProgress: (name: DependencyName) => (state: DependencyStore) => InstallProgress;
    allInstallProgress: (state: DependencyStore) => Record<DependencyName, InstallProgress>;
    globalError: (state: DependencyStore) => string | undefined;
    installErrors: (state: DependencyStore) => Record<DependencyName, string>;
    hasErrors: (state: DependencyStore) => boolean;
};
export declare const useDependencyStatus: (name: DependencyName) => DependencyInfo;
export declare const useAllDependenciesReady: () => boolean;
export declare const useInstallationProgress: (name: DependencyName) => InstallProgress;
export declare const useDependencyErrors: () => boolean;
//# sourceMappingURL=dependency-store.d.ts.map