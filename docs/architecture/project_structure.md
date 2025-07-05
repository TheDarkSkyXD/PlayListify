# Project File and Folder Structure

This document defines the definitive file and folder structure for the Playlistify application. A clear and logical structure is crucial for maintainability, scalability, and ease of navigation.

## High-Level Directory Tree

```
/
├── build/                 // Compiled output and packaged application
├── dist/                  // Transpiled JavaScript code from TypeScript
├── docs/                  // All project documentation
│   └── architecture/      // Architectural diagrams, decisions, and designs
├── node_modules/          // Project dependencies
├── src/                   // All source code for the application
│   ├── backend/             // Electron main process and backend logic
│   │   ├── adapters/        // Wrappers for external libraries (e.g., sqlite3, yt-dlp)
│   │   ├── repositories/    // Data access layer (e.g., PlaylistRepository)
│   │   ├── services/        // Business logic layer (e.g., PlaylistManager)
│   │   └── main.ts          // Backend entry point
│   ├── frontend/            // Electron renderer process (React UI)
│   │   ├── assets/          // Static assets like images and fonts
│   │   ├── components/      // Reusable React components
│   │   ├── services/        // Frontend-specific services (e.g., IPC abstraction)
│   │   ├── styles/          // Global CSS or styling files
│   │   └── index.tsx        // Frontend entry point
│   ├── shared/              // Code shared between backend and frontend
│   │   ├── data-models.ts   // TypeScript interfaces for data structures
│   │   └── ipc-contract.ts  // Definitions for IPC channels and payloads
│   └── preload.ts           // Electron preload script
├── tests/                 // All automated tests
│   ├── e2e/                 // End-to-end tests (e.g., Playwright)
│   ├── integration/         // Integration tests
│   ├── unit/                // Unit tests
│   └── setup.ts             // Test setup and configuration
├── .eslintrc.js           // ESLint configuration
├── .gitignore             // Git ignore file
├── package.json           // Project metadata and dependencies
├── README.md              // Project overview and setup instructions
└── tsconfig.json          // TypeScript compiler configuration
```

## Key Directory Descriptions

*   **`src/`**: This is the heart of the application, containing all the source code.
    *   **`src/backend/`**: Contains all code that runs in the Electron main process.
        *   **`adapters/`**: This directory isolates third-party dependencies. For example, `SQLiteAdapter.ts` will wrap `better-sqlite3`, and `YtdlpWrapAdapter.ts` will wrap `yt-dlp-wrap`. This makes it easier to mock dependencies for testing or to replace them in the future.
        *   **`repositories/`**: This directory implements the Repository pattern. Each file here is responsible for the data access logic of a single data model (e.g., `PlaylistRepository.ts`). It abstracts the database implementation from the business logic.
        *   **`services/`**: This directory holds the core business logic of the application. Services like `PlaylistManager.ts` orchestrate operations by calling methods on repositories and other services.
    *   **`src/frontend/`**: Contains all the code for the user interface, which runs in the Electron renderer process. This is a standard React application structure.
    *   **`src/shared/`**: This is a critical directory for a robust Electron application. It contains code that is used by *both* the backend and frontend.
        *   **`data-models.ts`**: Defines the TypeScript interfaces (e.g., `Playlist`, `Video`) that are passed between the backend and frontend. This ensures type safety across the IPC boundary.
        *   **`ipc-contract.ts`**: Defines the constants for IPC channel names and the expected data shapes for requests and responses. This creates a strict, self-documenting contract for communication, reducing the risk of integration bugs.
*   **`tests/`**: This directory mirrors the `src` directory structure and contains all automated tests.
    *   **`e2e/`**: End-to-end tests that simulate user interactions with the final, packaged application.
    *   **`integration/`**: Tests that verify the interaction between multiple components (e.g., a service and its repository).
    *   **`unit/`**: Tests that verify the functionality of a single, isolated component (e.g., a single function in a service).
*   **`docs/`**: Contains all non-code documentation for the project, including these architectural documents, user guides, and decision records.