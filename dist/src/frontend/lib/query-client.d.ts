/**
 * TanStack React Query configuration with optimal defaults for Playlistify
 *
 * This configuration provides:
 * - 5 minute stale time for most queries
 * - No refetch on window focus (desktop app behavior)
 * - Proper error handling and retry logic
 * - Optimized caching strategies
 */
import { QueryClient } from '@tanstack/react-query';
export declare const queryClient: QueryClient;
export declare const queryKeys: {
    readonly app: {
        readonly all: readonly ["app"];
        readonly version: () => readonly ["app", "version"];
    };
    readonly settings: {
        readonly all: readonly ["settings"];
        readonly get: (key: string) => readonly ["settings", "get", string];
        readonly getAll: () => readonly ["settings", "getAll"];
    };
    readonly dependencies: {
        readonly all: readonly ["dependencies"];
        readonly status: () => readonly ["dependencies", "status"];
        readonly version: (name: string) => readonly ["dependencies", "version", string];
    };
    readonly fileSystem: {
        readonly all: readonly ["fileSystem"];
        readonly exists: (path: string) => readonly ["fileSystem", "exists", string];
        readonly stats: (path: string) => readonly ["fileSystem", "stats", string];
        readonly list: (path: string, type: "files" | "directories") => readonly ["fileSystem", "list", "files" | "directories", string];
    };
    readonly playlists: {
        readonly all: readonly ["playlists"];
        readonly list: () => readonly ["playlists", "list"];
        readonly detail: (id: number) => readonly ["playlists", "detail", number];
        readonly videos: (id: number) => readonly ["playlists", "videos", number];
        readonly stats: (id: number) => readonly ["playlists", "stats", number];
    };
    readonly videos: {
        readonly all: readonly ["videos"];
        readonly detail: (id: string) => readonly ["videos", "detail", string];
        readonly qualities: (id: string) => readonly ["videos", "qualities", string];
    };
    readonly youtube: {
        readonly all: readonly ["youtube"];
        readonly metadata: (url: string) => readonly ["youtube", "metadata", string];
        readonly availability: () => readonly ["youtube", "availability"];
    };
};
export declare const invalidateQueries: {
    app: () => Promise<void>;
    settings: () => Promise<void>;
    setting: (key: string) => Promise<void>;
    dependencies: () => Promise<void>;
    fileSystem: () => Promise<void>;
    fileSystemPath: (path: string) => Promise<void>;
    playlists: () => Promise<void>;
    playlist: (id: number) => Promise<void>;
    videos: () => Promise<void>;
    video: (id: string) => Promise<void>;
};
export declare const prefetchQueries: {
    appVersion: () => Promise<void>;
    dependencyStatus: () => Promise<void>;
    allSettings: () => Promise<void>;
};
export declare const queryUtils: {
    clear: () => void;
    removeQueries: () => void;
    getQueryData: <T>(queryKey: readonly unknown[]) => T | undefined;
    setQueryData: <T>(queryKey: readonly unknown[], data: T) => unknown;
    cancelQueries: (queryKey?: readonly unknown[]) => Promise<void>;
};
//# sourceMappingURL=query-client.d.ts.map