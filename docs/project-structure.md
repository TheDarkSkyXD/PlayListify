## Project Structure

```plaintext
playlistify-app/
├── release/              # Packaged application output (git-ignored)
├── assets/               # Static assets like icons for the app installer/builder
└── src/                  # Main source code directory
    ├── backend/          # Backend - Electron Main Process code (Node.js)
    │   ├── db/           # Database schema (schema.sql) and setup scripts
    │   ├── lib/          # Wrappers for external tools (yt-dlp, ffmpeg)
    │   ├── repositories/ # Data access layer (e.g., PlaylistRepository.ts)
    │   ├── services/     # Core backend services (Playlist, Download, HealthCheck)
    │   └── main.ts       # Entry point for the Main Process
    │
    ├── frontend/         # Frontend - Electron Renderer Process code (React)
    │   ├── components/   # Shared/reusable React components
    │   ├── hooks/        # Custom React hooks
    │   ├── lib/          # Frontend-specific utilities
    │   ├── pages/        # Top-level page components (Dashboard, Settings, etc.)
    │   ├── store/        # Zustand state management store
    │   └── index.tsx     # Entry point for the Renderer Process
    │
    └── shared/             # Code shared between Backend and Frontend processes
        ├── ipc-contracts.ts # TypeScript types for IPC communication
        └── types.ts         # Other shared type definitions
```

### Key Directory Descriptions

* **`src/backend`**: Contains all backend logic. This code runs in Node.js and has access to the operating system, filesystem, and database.
* **`src/frontend`**: Contains all frontend UI code. This code runs in a sandboxed Chromium window and is responsible for everything the user sees and interacts with.
* **`src/shared`**: A crucial directory for holding TypeScript types and definitions that are used by *both* the backend and frontend to ensure they communicate correctly.