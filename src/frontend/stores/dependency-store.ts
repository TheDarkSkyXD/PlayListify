/**
 * Dependency management state using Zustand
 * 
 * This store manages the state of external dependencies (yt-dlp, FFmpeg)
 * including installation status, progress, and error handling.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Dependency types
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

// Dependency state interface
export interface DependencyState {
  // Overall status
  isInitialized: boolean;
  isChecking: boolean;
  allReady: boolean;
  
  // Individual dependencies
  dependencies: Record<DependencyName, DependencyInfo>;
  
  // Installation state
  isInstalling: boolean;
  installQueue: DependencyName[];
  currentInstall?: DependencyName;
  installProgress: Record<DependencyName, InstallProgress>;
  
  // Error handling
  globalError?: string;
  installErrors: Record<DependencyName, string>;
  
  // Last update timestamp
  lastStatusUpdate?: Date;
}

// Dependency actions interface
export interface DependencyActions {
  // Status actions
  setInitialized: (initialized: boolean) => void;
  setChecking: (checking: boolean) => void;
  setAllReady: (ready: boolean) => void;
  updateLastStatusUpdate: () => void;
  
  // Dependency info actions
  updateDependency: (name: DependencyName, info: Partial<DependencyInfo>) => void;
  setDependencyInstalled: (name: DependencyName, installed: boolean, version?: string, path?: string) => void;
  setDependencyError: (name: DependencyName, error?: string) => void;
  
  // Installation actions
  startInstallation: (dependencies: DependencyName[]) => void;
  setCurrentInstall: (dependency?: DependencyName) => void;
  updateInstallProgress: (dependency: DependencyName, progress: Partial<InstallProgress>) => void;
  completeInstallation: (dependency: DependencyName, success: boolean, error?: string) => void;
  cancelInstallation: () => void;
  
  // Error actions
  setGlobalError: (error?: string) => void;
  clearErrors: () => void;
  
  // Reset actions
  reset: () => void;
  resetDependency: (name: DependencyName) => void;
}

// Combined store type
export type DependencyStore = DependencyState & DependencyActions;

// Initial dependency info
const createInitialDependencyInfo = (): DependencyInfo => ({
  installed: false,
  installing: false,
  installProgress: 0,
});

// Initial state
const initialState: DependencyState = {
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
export const useDependencyStore = create<DependencyStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,
      
      // Status actions
      setInitialized: (initialized: boolean) => {
        set((state) => {
          state.isInitialized = initialized;
        });
      },
      
      setChecking: (checking: boolean) => {
        set((state) => {
          state.isChecking = checking;
        });
      },
      
      setAllReady: (ready: boolean) => {
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
      updateDependency: (name: DependencyName, info: Partial<DependencyInfo>) => {
        set((state) => {
          Object.assign(state.dependencies[name], info);
          state.dependencies[name].lastChecked = new Date();
        });
      },
      
      setDependencyInstalled: (name: DependencyName, installed: boolean, version?: string, path?: string) => {
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
      
      setDependencyError: (name: DependencyName, error?: string) => {
        set((state) => {
          state.dependencies[name].error = error;
          state.installErrors[name] = error || '';
        });
      },
      
      // Installation actions
      startInstallation: (dependencies: DependencyName[]) => {
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
      
      setCurrentInstall: (dependency?: DependencyName) => {
        set((state) => {
          state.currentInstall = dependency;
        });
      },
      
      updateInstallProgress: (dependency: DependencyName, progress: Partial<InstallProgress>) => {
        set((state) => {
          Object.assign(state.installProgress[dependency], progress);
          state.dependencies[dependency].installProgress = progress.progress || 0;
        });
      },
      
      completeInstallation: (dependency: DependencyName, success: boolean, error?: string) => {
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
          } else {
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
            const dep = key as DependencyName;
            state.dependencies[dep].installing = false;
            state.installProgress[dep].status = 'cancelled';
          });
        });
      },
      
      // Error actions
      setGlobalError: (error?: string) => {
        set((state) => {
          state.globalError = error;
        });
      },
      
      clearErrors: () => {
        set((state) => {
          state.globalError = undefined;
          Object.keys(state.dependencies).forEach(key => {
            const dep = key as DependencyName;
            state.dependencies[dep].error = undefined;
            state.installErrors[dep] = '';
          });
        });
      },
      
      // Reset actions
      reset: () => {
        set(() => ({ ...initialState }));
      },
      
      resetDependency: (name: DependencyName) => {
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
    })),
    {
      name: 'DependencyStore',
    }
  )
);

// Selectors for optimized component subscriptions
export const dependencySelectors = {
  // Overall status
  isInitialized: (state: DependencyStore) => state.isInitialized,
  isChecking: (state: DependencyStore) => state.isChecking,
  allReady: (state: DependencyStore) => state.allReady,
  
  // Installation status
  isInstalling: (state: DependencyStore) => state.isInstalling,
  currentInstall: (state: DependencyStore) => state.currentInstall,
  installQueue: (state: DependencyStore) => state.installQueue,
  
  // Dependency info
  dependency: (name: DependencyName) => (state: DependencyStore) => state.dependencies[name],
  dependencies: (state: DependencyStore) => state.dependencies,
  
  // Progress
  installProgress: (name: DependencyName) => (state: DependencyStore) => state.installProgress[name],
  allInstallProgress: (state: DependencyStore) => state.installProgress,
  
  // Errors
  globalError: (state: DependencyStore) => state.globalError,
  installErrors: (state: DependencyStore) => state.installErrors,
  hasErrors: (state: DependencyStore) => 
    !!state.globalError || Object.values(state.installErrors).some(error => !!error),
};

// Utility hooks for common patterns
export const useDependencyStatus = (name: DependencyName) => 
  useDependencyStore(dependencySelectors.dependency(name));

export const useAllDependenciesReady = () => 
  useDependencyStore(dependencySelectors.allReady);

export const useInstallationProgress = (name: DependencyName) => 
  useDependencyStore(dependencySelectors.installProgress(name));

export const useDependencyErrors = () => 
  useDependencyStore(dependencySelectors.hasErrors);