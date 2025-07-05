# Arc 3: Primary Findings - Secure Inter-Process Communication (IPC)

## Finding 2: The Context Bridge as a Secure IPC Gateway

**Source(s):** Electron Docs (Context Isolation, contextBridge, Preload Scripts), Stack Overflow

**Key Insight:** The fundamental principle of modern Electron security is to maintain a strict separation between the privileged main process (Node.js access) and the unprivileged renderer process (UI). This is achieved by enabling `contextIsolation` and using a `preload` script with the `contextBridge` to expose a limited, secure, and well-defined API to the renderer.

**Paraphrased Summary:**
Exposing the full `ipcRenderer` object to the renderer process is a significant security vulnerability, as it would allow any code running in the renderer (including third-party libraries) to send arbitrary messages to the main process. The correct pattern is to treat the `preload` script as a secure gateway.

**Implementation Strategy for Playlistify:**

1.  **Enable Context Isolation:** In the `BrowserWindow` configuration, `contextIsolation` must be set to `true` (this is the default in modern Electron versions). `nodeIntegration` must be `false`.

2.  **Define a Typed API Contract:** A TypeScript interface will be created in the `src/shared/` directory to define the exact shape of the API that will be exposed to the renderer. This ensures type safety across the IPC boundary.

    ```typescript
    // Example: src/shared/ipc-api.ts
    export interface IElectronAPI {
      loadPreferences: () => Promise<void>;
      getPlaylistById: (id: string) => Promise<Playlist | null>;
      // ... other functions
    }
    ```

3.  **Implement the Preload Script (`preload.ts`):** The preload script will use `contextBridge.exposeInMainWorld` to securely expose the defined API. It will not expose `ipcRenderer` directly. Instead, it wraps the necessary `ipcRenderer.invoke` calls.

    ```typescript
    // Example: src/preload.ts
    import { contextBridge, ipcRenderer } from 'electron';
    import { IElectronAPI } from '../shared/ipc-api';

    const api: IElectronAPI = {
      loadPreferences: () => ipcRenderer.invoke('load-prefs'),
      getPlaylistById: (id: string) => ipcRenderer.invoke('playlists:get-by-id', id),
    };

    contextBridge.exposeInMainWorld('electronAPI', api);
    ```

4.  **Type the Renderer's `window` Object:** A declaration file will be created to inform TypeScript that the `electronAPI` object exists on the global `window` object in the renderer process.

    ```typescript
    // Example: src/renderer.d.ts
    import { IElectronAPI } from '../shared/ipc-api';

    declare global {
      interface Window {
        electronAPI: IElectronAPI;
      }
    }
    ```

5.  **Usage in Renderer:** The frontend code can now call the exposed API in a type-safe manner, without ever directly accessing `ipcRenderer`.

    ```typescript
    // Example: MyPlaylists.tsx
    const playlist = await window.electronAPI.getPlaylistById('some-id');
    ```

This pattern ensures that the attack surface of the application is minimized, all communication between processes is explicit and validated, and the developer experience is enhanced through type safety.