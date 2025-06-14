# PlayListify - Implementation Task Plan

This document outlines the step-by-step tasks required to implement the PlayListify application based on the provided feature specifications.

## Task 1: Project Setup & Core Dependencies

### Step 1: Initialize Electron Project with Forge & TypeScript

#### Detailed technical explanation of what we’re accomplishing in this step

Initialize a new Electron project using the Electron Forge CLI with the Webpack + TypeScript template. This sets up the basic project structure, necessary build configurations, and initial dependencies for an Electron application using TypeScript for both main and renderer processes, and Webpack for bundling the renderer code.

#### Task Breakdown

##### SubTask 1: Initialize Project

- Description Of SubTask 1 change: Run Electron Forge init command with the specified template.
- /relative/path/of/changed/file: `.` (Project Root)
- Operation being done (Create): Creates project files and folders (`package.json`, `forge.config.js`, `tsconfig.json`, `src/`, etc.).

##### SubTask 2: Verify Initial Build

- Description Of SubTask 2 change: Run the initial start command to ensure the default template application builds and runs correctly.
- /relative/path/of/changed/file: N/A (Build process verification)
- Operation being done (N/A): Verifies project setup.

#### Other Notes On Step 1: Initialize Electron Project with Forge & TypeScript

- Requires Node.js and npm/yarn installed.
- Command to run: `npx create-electron-app playlistify --template=webpack-typescript` (or equivalent yarn command).
- Follow prompts if any.

### Step 2: Install Core Dependencies

#### Detailed technical explanation of what we’re accomplishing in this step

Install essential libraries required for the application's core functionality, including UI framework (React, shadcn/ui), state management (Zustand), routing (TanStack Router), database (better-sqlite3), utility libraries (yt-dlp-wrap, p-queue, fluent-ffmpeg, fs-extra), settings persistence (electron-store), logging (winston), updates (electron-updater), and validation (zod).

#### Task Breakdown

##### SubTask 1: Install React & Related Dependencies

- Description Of SubTask 1 change: Add React, ReactDOM, and their TypeScript types.
- /relative/path/of/changed/file: `package.json`
- Operation being done (Update): Adds dependencies.

##### SubTask 2: Install UI Framework (shadcn/ui & Tailwind)

- Description Of SubTask 2 change: Initialize Tailwind CSS and shadcn/ui according to their documentation. This involves installing `tailwindcss`, `postcss`, `autoprefixer`, initializing config files, and setting up shadcn/ui CLI.
- /relative/path/of/changed/file: `package.json`, `tailwind.config.js`, `postcss.config.js`, `src/renderer/styles/globals.css`, `components.json`
- Operation being done (Create/Update): Adds dependencies and configuration files.

##### SubTask 3: Install State Management & Routing

- Description Of SubTask 3 change: Add Zustand for state management and TanStack Router for navigation.
- /relative/path/of/changed/file: `package.json`
- Operation being done (Update): Adds dependencies.

##### SubTask 4: Install Backend/Main Process Dependencies

- Description Of SubTask 4 change: Add `better-sqlite3`, `yt-dlp-wrap`, `p-queue`, `fluent-ffmpeg`, `fs-extra`, `electron-store`, `winston`, `electron-updater`, `zod`.
- /relative/path/of/changed/file: `package.json`
- Operation being done (Update): Adds dependencies.

#### Other Notes On Step 2: Install Core Dependencies

- Run `npm install <package-name>` or `yarn add <package-name>` for each dependency.
- Install `@types/<package-name>` for libraries that don't bundle types.
- `better-sqlite3` requires native compilation; ensure build tools are available (node-gyp prerequisites).
- `electron-updater` should be added as a dev dependency if only used for building/packaging.
- Follow shadcn/ui setup guide carefully: https://ui.shadcn.com/docs/installation/vite (adapt for Webpack if necessary, though principles are similar).

### Step 3: Configure TypeScript & ESLint/Prettier

#### Detailed technical explanation of what we’re accomplishing in this step

Configure TypeScript for strict type checking and set up ESLint and Prettier for code linting and formatting consistency, adhering to the provided coding guidelines.

#### Task Breakdown

##### SubTask 1: Configure tsconfig.json

- Description Of SubTask 1 change: Enable `strict` mode and other recommended settings in `tsconfig.json`. Ensure separate configurations or overrides exist if needed for main (`tsconfig.node.json`) and renderer processes.
- /relative/path/of/changed/file: `tsconfig.json`, `tsconfig.node.json` (if exists)
- Operation being done (Update): Modifies TypeScript compiler options.

##### SubTask 2: Setup ESLint & Prettier

- Description Of SubTask 2 change: Install ESLint, Prettier, and relevant plugins/configs (e.g., `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-config-prettier`, `eslint-plugin-react`). Create `.eslintrc.js` and `.prettierrc.js` configuration files.
- /relative/path/of/changed/file: `package.json`, `.eslintrc.js`, `.prettierrc.js`, `.eslintignore`, `.prettierignore`
- Operation being done (Create/Update): Adds dev dependencies and configuration files.

##### SubTask 3: Add Lint/Format Scripts

- Description Of SubTask 3 change: Add scripts to `package.json` for running ESLint and Prettier.
- /relative/path/of/changed/file: `package.json`
- Operation being done (Update): Adds scripts like `"lint"`, `"format"`.

#### Other Notes On Step 3: Configure TypeScript & ESLint/Prettier

- Ensure ESLint rules align with the provided coding guidelines (functional patterns, naming conventions, etc.).
- Configure Prettier for consistent code style (e.g., trailing commas, semi-colons).
- Consider adding a pre-commit hook (e.g., using Husky and lint-staged) to automatically lint and format code.

### Step 4: Establish Basic File Structure

#### Detailed technical explanation of what we’re accomplishing in this step

Create the core directory structure within the `src/` folder as defined in the feature specifications, organizing code for main process, renderer process, preload scripts, shared types, and future modules like database, services, IPC handlers, etc.

#### Task Breakdown

##### SubTask 1: Create Main Process Folders

- Description Of SubTask 1 change: Create `src/main/database/`, `src/main/services/`, `src/main/utils/`.
- /relative/path/of/changed/file: `src/main/`
- Operation being done (Create): Creates directories.

##### SubTask 2: Create Renderer Process Folders

- Description Of SubTask 2 change: Create `src/renderer/assets/`, `src/renderer/components/`, `src/renderer/hooks/`, `src/renderer/layouts/`, `src/renderer/lib/`, `src/renderer/pages/`, `src/renderer/router/`, `src/renderer/services/`, `src/renderer/store/`, `src/renderer/styles/`.
- /relative/path/of/changed/file: `src/renderer/`
- Operation being done (Create): Creates directories.

##### SubTask 3: Create Shared Folder

- Description Of SubTask 3 change: Create `src/shared/` for shared types and constants.
- /relative/path/of/changed/file: `src/`
- Operation being done (Create): Creates directory.

##### SubTask 4: Update Entry Points (if needed)

- Description Of SubTask 4 change: Ensure `src/main/index.ts` and `src/renderer/index.tsx` exist and are correctly referenced by Electron Forge/Webpack config.
- /relative/path/of/changed/file: `src/main/index.ts`, `src/renderer/index.tsx`, `forge.config.js` (potentially)
- Operation being done (Update/Verify): Ensures entry points are correct.

#### Other Notes On Step 4: Establish Basic File Structure

- This step creates empty folders as placeholders for future code.
- The structure should match the `File System` section of the feature specification document.

## Task 2: Database Setup

### Step 5: Define Database Schema

#### Detailed technical explanation of what we’re accomplishing in this step

Define the SQL schema for all necessary tables (`playlists`, `videos`, `playlist_videos`, `watch_history`) based on the feature specifications. This schema will be stored in a `.sql` file for clarity and used during database initialization.

#### Task Breakdown

##### SubTask 1: Create Schema File

- Description Of SubTask 1 change: Create the `schema.sql` file containing `CREATE TABLE IF NOT EXISTS` statements for all required tables, including primary keys, foreign keys, constraints, and indexes as specified.
- /relative/path/of/changed/file: `src/main/database/schema.sql`
- Operation being done (Create): Creates the SQL schema file.

#### Other Notes On Step 5: Define Database Schema

- The schema should match the combined schema definitions from the feature specifications (Features 1, 2, and 3).
- Ensure `ON DELETE CASCADE` is used appropriately for foreign keys to maintain data integrity.
- Include necessary indexes for performance on common query patterns (e.g., fetching videos by playlist ID, fetching history by date).

### Step 6: Implement Database Initialization & Connection

#### Detailed technical explanation of what we’re accomplishing in this step

Implement the logic in the main process to connect to the `better-sqlite3` database file located in the user data directory. If the database file doesn't exist, create it and execute the `schema.sql` script to initialize the tables.

#### Task Breakdown

##### SubTask 1: Create Database Service Module

- Description Of SubTask 1 change: Create a module (`index.ts` or `db.ts`) within `src/main/database/` to encapsulate database connection logic.
- /relative/path/of/changed/file: `src/main/database/index.ts`
- Operation being done (Create): Creates the database service module.

##### SubTask 2: Implement Connection Logic

- Description Of SubTask 2 change: Write a function (`initDb` or similar) that:
    - Gets the user data path using `app.getPath("userData")`.
    - Constructs the path to the database file (e.g., `database.sqlite`).
    - Uses `better-sqlite3` to connect to the database file (this creates the file if it doesn't exist).
    - Reads the content of `schema.sql`.
    - Executes the schema SQL using `db.exec()`.
    - Enables WAL mode (`PRAGMA journal_mode = WAL;`) for better concurrency.
    - Exports the connected database instance.
- /relative/path/of/changed/file: `src/main/database/index.ts`
- Operation being done (Update): Adds database connection and initialization logic.

##### SubTask 3: Call Initialization on App Start

- Description Of SubTask 3 change: Import and call the database initialization function early in the main process startup sequence (`src/main/index.ts`) before any database access is needed.
- /relative/path/of/changed/file: `src/main/index.ts`
- Operation being done (Update): Integrates DB initialization into app startup.

#### Other Notes On Step 6: Implement Database Initialization & Connection

- Ensure proper error handling during file reading and database execution.
- The database connection should be synchronous as per `better-sqlite3`'s design.
- The database instance should be a singleton, accessible throughout the main process.

### Step 7: Implement Basic CRUD Helpers

#### Detailed technical explanation of what we’re accomplishing in this step

Create helper functions for common database operations (Create, Read, Update, Delete) for each table. These functions will use prepared statements for security and performance.

#### Task Breakdown

##### SubTask 1: Create Playlist CRUD Helpers

- Description Of SubTask 1 change: Implement functions like `createPlaylist`, `getPlaylistById`, `getAllPlaylists`, `updatePlaylistName`, `deletePlaylist` using prepared statements (`db.prepare(...)`). Define TypeScript interfaces for playlist data.
- /relative/path/of/changed/file: `src/main/database/queries.ts` (or separate files like `src/main/database/playlistQueries.ts`)
- Operation being done (Create/Update): Adds CRUD functions for playlists.

##### SubTask 2: Create Video CRUD Helpers

- Description Of SubTask 2 change: Implement functions like `createOrUpdateVideo`, `getVideoById`, `updateVideoDownloadStatus`, `updateVideoAvailability` using prepared statements. Define TypeScript interfaces for video data.
- /relative/path/of/changed/file: `src/main/database/queries.ts` (or `src/main/database/videoQueries.ts`)
- Operation being done (Create/Update): Adds CRUD functions for videos.

##### SubTask 3: Create PlaylistVideo CRUD Helpers

- Description Of SubTask 3 change: Implement functions like `addVideoToPlaylist`, `getVideosByPlaylistId`, `removeVideoFromPlaylist`, `updateVideoPosition` using prepared statements.
- /relative/path/of/changed/file: `src/main/database/queries.ts` (or `src/main/database/playlistVideoQueries.ts`)
- Operation being done (Create/Update): Adds CRUD functions for the junction table.

##### SubTask 4: Create History CRUD Helpers

- Description Of SubTask 4 change: Implement functions like `addOrUpdateHistory`, `getHistory`, `deleteHistoryItem` using prepared statements. Define TypeScript interfaces for history data.
- /relative/path/of/changed/file: `src/main/database/queries.ts` (or `src/main/database/historyQueries.ts`)
- Operation being done (Create/Update): Adds CRUD functions for watch history.

#### Other Notes On Step 7: Implement Basic CRUD Helpers

- All SQL should be within prepared statements (`db.prepare("SELECT * FROM users WHERE id = ?")`).
- Functions should accept parameters and return data matching the defined TypeScript interfaces.
- Use transactions (`db.transaction(...)`) for operations involving multiple statements (like importing a playlist).
- Validate input data (using Zod) before passing it to these helper functions (validation might occur in the service layer calling these helpers).

### Step 8: Implement Database Migrations (Basic)

#### Detailed technical explanation of what we’re accomplishing in this step

Implement a basic migration system using SQLite's `PRAGMA user_version`. This allows the application to update the database schema in future versions without losing user data.

#### Task Breakdown

##### SubTask 1: Implement Version Check

- Description Of SubTask 1 change: In the database initialization logic, read the current `user_version` using `db.pragma("user_version", { simple: true })`. Define the latest schema version in the code (e.g., `const LATEST_SCHEMA_VERSION = 1`).
- /relative/path/of/changed/file: `src/main/database/index.ts`
- Operation being done (Update): Adds logic to read the current schema version.

##### SubTask 2: Implement Migration Logic

- Description Of SubTask 2 change: Add a loop or conditional structure that checks if `currentVersion < LATEST_SCHEMA_VERSION`. Inside the loop, apply migration scripts based on the `currentVersion` (e.g., if `currentVersion === 0`, apply version 1 migrations; if `currentVersion === 1`, apply version 2 migrations). Update the `user_version` using `db.pragma("user_version = " + newVersion)` after each successful migration step.
- /relative/path/of/changed/file: `src/main/database/index.ts`
- Operation being done (Update): Adds the core migration execution logic.

##### SubTask 3: Create Initial Migration (Set Version 1)

- Description Of SubTask 3 change: Since the schema is created if the DB doesn't exist, ensure the `user_version` is set to `1` after the initial schema creation.
- /relative/path/of/changed/file: `src/main/database/index.ts`
- Operation being done (Update): Sets the initial schema version.

#### Other Notes On Step 8: Implement Database Migrations (Basic)

- Migration scripts (e.g., `ALTER TABLE ...`) can be stored as strings or in separate `.sql` files.
- Wrap migration steps within transactions to ensure atomicity.
- Log migration progress and any errors encountered.
- For this initial setup, the main task is establishing the versioning mechanism; actual migration scripts will be added in future updates when the schema changes.

## Task 3: Core Infrastructure Setup

### Step 9: Implement Secure IPC Bridge (Preload Script)

#### Detailed technical explanation of what we’re accomplishing in this step

Set up a secure bridge between the main process and the renderer process using a preload script. This script runs in a privileged environment before the renderer's web page loads but has access to Node.js APIs. We use `contextBridge` to expose only specific, secure functions (IPC invokers/listeners) to the renderer, preventing direct access to Node.js or Electron APIs from the renderer, which is crucial for security (Context Isolation).

#### Task Breakdown

##### SubTask 1: Create Preload Script

- Description Of SubTask 1 change: Create the `preload.ts` file. Import `contextBridge`, `ipcRenderer`. Define an API object (e.g., `electronAPI`) containing functions like `invoke(channel, ...args)` and `on(channel, listener)` that wrap `ipcRenderer.invoke` and `ipcRenderer.on`/`removeListener` respectively.
- /relative/path/of/changed/file: `src/main/preload.ts`
- Operation being done (Create): Creates the preload script file.

##### SubTask 2: Expose API via contextBridge

- Description Of SubTask 2 change: Use `contextBridge.exposeInMainWorld("electronAPI", electronAPI)` within `preload.ts` to make the defined functions available on the `window` object in the renderer process (as `window.electronAPI`).
- /relative/path/of/changed/file: `src/main/preload.ts`
- Operation being done (Update): Adds the context bridge exposure logic.

##### SubTask 3: Configure Main Process to Use Preload

- Description Of SubTask 3 change: Update the `BrowserWindow` creation options in `src/main/index.ts` to specify the path to the preload script (`webPreferences: { preload: path.join(__dirname, "preload.js") }`). Ensure `contextIsolation` is true (default) and `nodeIntegration` is false.
- /relative/path/of/changed/file: `src/main/index.ts`
- Operation being done (Update): Configures the browser window to load the preload script.

##### SubTask 4: Update Build Configuration (if needed)

- Description Of SubTask 4 change: Ensure the Webpack configuration (managed by Electron Forge) correctly bundles or copies the preload script to the expected location (e.g., `.webpack/main/preload.js`). This is usually handled by the template but should be verified.
- /relative/path/of/changed/file: `forge.config.js` (or related Webpack config)
- Operation being done (Verify/Update): Ensures build process handles preload script.

#### Other Notes On Step 9: Implement Secure IPC Bridge (Preload Script)

- The exposed API should be minimal and only include necessary communication functions.
- Type definitions for the exposed API should be created (e.g., in `src/shared/types.ts`) and used in the renderer for type safety.

### Step 10: Setup Basic IPC Handlers

#### Detailed technical explanation of what we’re accomplishing in this step

Establish the basic mechanism for handling Inter-Process Communication (IPC) requests from the renderer in the main process. We will implement a simple "ping" handler to verify that the IPC bridge set up in the previous step is working correctly.

#### Task Breakdown

##### SubTask 1: Create IPC Directory

- Description Of SubTask 1 change: Create a dedicated directory for organizing IPC handlers in the main process.
- /relative/path/of/changed/file: `src/main/ipc/`
- Operation being done (Create): Creates the IPC handler directory.

##### SubTask 2: Implement Ping Handler

- Description Of SubTask 2 change: In `src/main/index.ts` (or a new file like `src/main/ipc/appHandlers.ts`), import `ipcMain`. Use `ipcMain.handle("app:ping", async () => { return "pong"; });` to register a handler for the `app:ping` channel.
- /relative/path/of/changed/file: `src/main/index.ts` (or `src/main/ipc/appHandlers.ts`)
- Operation being done (Update/Create): Adds the ping IPC handler.

##### SubTask 3: Register Handlers (if separate file)

- Description Of SubTask 3 change: If handlers are in separate files, ensure they are imported and registered in the main process entry point (`src/main/index.ts`) after the app is ready.
- /relative/path/of/changed/file: `src/main/index.ts`
- Operation being done (Update): Imports and registers IPC handlers.

##### SubTask 4: Test Handler from Renderer

- Description Of SubTask 4 change: In the renderer process (e.g., within a React component in `App.tsx`), use the exposed preload API (`window.electronAPI.invoke("app:ping")`) to call the handler and log the result (`"pong"`) to the console to verify communication.
- /relative/path/of/changed/file: `src/renderer/App.tsx` (or similar test location)
- Operation being done (Update): Adds test code to invoke the IPC handler.

#### Other Notes On Step 10: Setup Basic IPC Handlers

- This confirms the end-to-end IPC setup (Renderer -> Preload -> Main -> Renderer).
- Future handlers should be organized into modules within `src/main/ipc/` based on features (e.g., `playlistHandlers.ts`, `downloadHandlers.ts`).

### Step 11: Implement Settings Management (Electron Store)

#### Detailed technical explanation of what we’re accomplishing in this step

Set up `electron-store` to persist application settings (like default download path) in a JSON file within the user data directory. Create a service and IPC handlers to manage these settings.

#### Task Breakdown

##### SubTask 1: Create Settings Service

- Description Of SubTask 1 change: Create `settingsService.ts`. Import `Store` from `electron-store`. Define a schema for the settings. Instantiate the store (`new Store({ schema })`). Implement functions like `getSetting(key)` and `setSetting(key, value)` that wrap `store.get()` and `store.set()`.
- /relative/path/of/changed/file: `src/main/services/settingsService.ts`
- Operation being done (Create): Creates the settings service module.

##### SubTask 2: Define Default Settings

- Description Of SubTask 2 change: Define default values for settings (e.g., default download path derived from `app.getPath("downloads")`) within the schema passed to the `Store` constructor.
- /relative/path/of/changed/file: `src/main/services/settingsService.ts`
- Operation being done (Update): Adds default settings configuration.

##### SubTask 3: Create Settings IPC Handlers

- Description Of SubTask 3 change: Create `settingsHandlers.ts`. Implement handlers for `settings:get` (returns all settings or a specific one) and `settings:set` (updates a setting), using the `SettingsService`.
- /relative/path/of/changed/file: `src/main/ipc/settingsHandlers.ts`
- Operation being done (Create): Creates IPC handlers for settings.

##### SubTask 4: Register Settings Handlers

- Description Of SubTask 4 change: Import and register the settings handlers in `src/main/index.ts`.
- /relative/path/of/changed/file: `src/main/index.ts`
- Operation being done (Update): Registers settings IPC handlers.

#### Other Notes On Step 11: Implement Settings Management (Electron Store)

- The `electron-store` instance should be initialized early in the main process.
- Consider defining a TypeScript interface for the settings object in `src/shared/types.ts`.

### Step 12: Implement Logging (Winston)

#### Detailed technical explanation of what we’re accomplishing in this step

Configure the `winston` library to provide structured logging to a file. This helps in debugging issues during development and in production. Implement a global error handler to catch uncaught exceptions.

#### Task Breakdown

##### SubTask 1: Create Log Service

- Description Of SubTask 1 change: Create `logService.ts`. Import `winston`. Configure a logger instance with:
    - A file transport (`winston.transports.File`) pointing to a log file in `app.getPath("userData")/logs/app.log`.
    - JSON format (`winston.format.json()`).
    - Timestamp (`winston.format.timestamp()`).
    - Log rotation options (e.g., max size, max files).
    - Export logger functions (`info`, `warn`, `error`).
- /relative/path/of/changed/file: `src/main/services/logService.ts`
- Operation being done (Create): Creates the logging service module.

##### SubTask 2: Initialize Logger

- Description Of SubTask 2 change: Import and initialize the logger early in `src/main/index.ts`. Ensure the logs directory exists.
- /relative/path/of/changed/file: `src/main/index.ts`
- Operation being done (Update): Integrates logger initialization.

##### SubTask 3: Implement Global Error Handler

- Description Of SubTask 3 change: In `src/main/index.ts`, use `process.on("uncaughtException", (error) => { ... });` to catch unhandled errors, log them using the LogService, and potentially exit the application gracefully.
- /relative/path/of/changed/file: `src/main/index.ts`
- Operation being done (Update): Adds global error catching and logging.

#### Other Notes On Step 12: Implement Logging (Winston)

- Also consider adding a console transport during development for easier debugging.
- Use the logger consistently throughout the main process code, especially in `catch` blocks.

### Step 13: Configure Application Updates (electron-updater)

#### Detailed technical explanation of what we’re accomplishing in this step

Set up `electron-updater` to automatically check for and download application updates from GitHub Releases. Provide mechanisms for the user to be notified and install updates.

#### Task Breakdown

##### SubTask 1: Configure Publisher (GitHub)

- Description Of SubTask 1 change: Configure the `publish` section in `forge.config.js` or `package.json` for Electron Forge's publisher (e.g., `@electron-forge/publisher-github`) with the repository owner and name.
- /relative/path/of/changed/file: `forge.config.js` or `package.json`
- Operation being done (Update): Configures the update publisher.

##### SubTask 2: Create Update Service

- Description Of SubTask 2 change: Create `updateService.ts`. Import `autoUpdater` from `electron-updater`. Implement a function `checkForUpdates` that calls `autoUpdater.checkForUpdatesAndNotify()` or `autoUpdater.checkForUpdates()`. Set up listeners for `autoUpdater` events (`update-available`, `update-downloaded`, `error`, `download-progress`).
- /relative/path/of/changed/file: `src/main/services/updateService.ts`
- Operation being done (Create): Creates the update service module.

##### SubTask 3: Handle Update Events

- Description Of SubTask 3 change: Within the `UpdateService`, when events occur (e.g., `update-downloaded`), use `BrowserWindow.getAllWindows()[0].webContents.send(...)` to notify the renderer process via specific IPC channels (e.g., `app:update-downloaded`). Log errors.
- /relative/path/of/changed/file: `src/main/services/updateService.ts`
- Operation being done (Update): Adds event handling and renderer notification logic.

##### SubTask 4: Create Update IPC Handlers

- Description Of SubTask 4 change: Create `appHandlers.ts` (or similar). Implement handlers for `app:check-for-updates` (calls `UpdateService.checkForUpdates`) and `app:quit-and-install-update` (calls `autoUpdater.quitAndInstall()`).
- /relative/path/of/changed/file: `src/main/ipc/appHandlers.ts`
- Operation being done (Create/Update): Adds IPC handlers for updates.

##### SubTask 5: Initialize Update Checks

- Description Of SubTask 5 change: Call `UpdateService.checkForUpdates` (or similar initialization) in `src/main/index.ts` after the app is ready, potentially after a short delay.
- /relative/path/of/changed/file: `src/main/index.ts`
- Operation being done (Update): Integrates update checking into app startup.

#### Other Notes On Step 13: Configure Application Updates (electron-updater)

- Requires creating releases on GitHub for updates to be found.
- Code signing for macOS and Windows is recommended for smooth updates and is often configured alongside the publisher settings.
- The renderer process will need to listen for the IPC events (`app:update-available`, `app:update-downloaded`) and display UI notifications.

### Step 14: Setup Dependency Handling (yt-dlp/ffmpeg)

#### Detailed technical explanation of what we’re accomplishing in this step

Implement a strategy to locate the `yt-dlp` and `ffmpeg` executables. This might involve bundling them with the application or attempting to find them on the user's system PATH.

#### Task Breakdown

##### SubTask 1: Decide on Strategy (Bundle vs. System)

- Description Of SubTask 1 change: Determine whether to bundle `yt-dlp`/`ffmpeg` binaries for each platform within the application package or rely on the user having them installed and available in their system PATH. Bundling is generally more reliable but increases application size.
- /relative/path/of/changed/file: N/A (Decision)
- Operation being done (N/A): Architectural decision.

##### SubTask 2: Create Dependency Service

- Description Of SubTask 2 change: Create `dependencyService.ts`. Implement functions like `getYtdlpPath()` and `getFfmpegPath()`.
- /relative/path/of/changed/file: `src/main/services/dependencyService.ts`
- Operation being done (Create): Creates the dependency service module.

##### SubTask 3: Implement Path Resolution Logic

- Description Of SubTask 3 change: Inside the service functions:
    - If bundling: Determine the path to the bundled binaries relative to the application resources path (`process.resourcesPath`).
    - If system: Attempt to find the executables using libraries like `which` or by checking common installation paths and the system PATH environment variable.
    - Return the resolved path or throw an error if not found.
- /relative/path/of/changed/file: `src/main/services/dependencyService.ts`
- Operation being done (Update): Adds logic to find executable paths.

##### SubTask 4: Integrate with Wrappers

- Description Of SubTask 4 change: Ensure that `yt-dlp-wrap` and `fluent-ffmpeg` are configured to use the paths provided by the `DependencyService`.
- /relative/path/of/changed/file: `src/main/services/downloadService.ts` (likely location where wrappers are used)
- Operation being done (Update): Configures wrapper libraries with correct paths.

#### Other Notes On Step 14: Setup Dependency Handling (yt-dlp/ffmpeg)

- If bundling, binaries need to be added to the project and included in the build process (e.g., via Electron Forge's `extraResources` config).
- Provide clear error messages to the user if dependencies cannot be found, potentially guiding them on how to install them if using the system path strategy.
- Ensure bundled binaries have the correct executable permissions after packaging.

## Task 4: Playlist Management Implementation

### Step 15: Implement Playlist Service Logic

#### Detailed technical explanation of what we’re accomplishing in this step

Create the service layer (`playlistService.ts`) in the main process to handle the business logic for playlist management. This service will use the database CRUD helpers (from Step 7) and interact with `yt-dlp-wrap` for importing YouTube playlists.

#### Task Breakdown

##### SubTask 1: Create Playlist Service File

- Description Of SubTask 1 change: Create the `playlistService.ts` file.
- /relative/path/of/changed/file: `src/main/services/playlistService.ts`
- Operation being done (Create): Creates the service file.

##### SubTask 2: Implement `createCustomPlaylist`

- Description Of SubTask 2 change: Implement a function that takes a playlist name, generates a UUID, validates the name, and calls the `createPlaylist` DB helper.
- /relative/path/of/changed/file: `src/main/services/playlistService.ts`
- Operation being done (Update): Adds the create custom playlist logic.

##### SubTask 3: Implement `importYouTubePlaylist`

- Description Of SubTask 3 change: Implement a function that takes a YouTube playlist URL:
    - Validates the URL.
    - Uses `yt-dlp-wrap` to fetch playlist metadata (title, videos with ID, title, channel, duration, thumbnail).
    - Uses a DB transaction (`db.transaction(...)`).
    - Calls `createOrUpdateVideo` DB helper for each video.
    - Calls `createPlaylist` or `updatePlaylist` DB helper for the playlist record.
    - Calls `addVideoToPlaylist` DB helper to link videos to the playlist, handling positions.
    - Handles errors from `yt-dlp` or DB operations.
- /relative/path/of/changed/file: `src/main/services/playlistService.ts`
- Operation being done (Update): Adds the import YouTube playlist logic.

##### SubTask 4: Implement `getAllPlaylists`

- Description Of SubTask 4 change: Implement a function that calls the `getAllPlaylists` DB helper.
- /relative/path/of/changed/file: `src/main/services/playlistService.ts`
- Operation being done (Update): Adds logic to fetch all playlists.

##### SubTask 5: Implement `getPlaylistDetails`

- Description Of SubTask 5 change: Implement a function that takes a playlist ID and calls the `getVideosByPlaylistId` DB helper.
- /relative/path/of/changed/file: `src/main/services/playlistService.ts`
- Operation being done (Update): Adds logic to fetch videos for a playlist.

##### SubTask 6: Implement `deletePlaylist`

- Description Of SubTask 6 change: Implement a function that takes a playlist ID and calls the `deletePlaylist` DB helper.
- /relative/path/of/changed/file: `src/main/services/playlistService.ts`
- Operation being done (Update): Adds playlist deletion logic.

##### SubTask 7: Implement `refreshPlaylist`

- Description Of SubTask 7 change: Implement a function for YouTube playlists that:
    - Fetches current video list from YouTube using `yt-dlp`.
    - Compares with videos stored in DB for that playlist.
    - Adds new videos, removes deleted videos (from `playlist_videos` junction table), potentially updates metadata/availability of existing videos.
    - Uses DB transaction.
- /relative/path/of/changed/file: `src/main/services/playlistService.ts`
- Operation being done (Update): Adds playlist refresh logic.

##### SubTask 8: Implement `exportPlaylist` / `importPlaylistFromJson`

- Description Of SubTask 8 change: Implement functions to handle exporting playlist data (fetch from DB, format as JSON) and importing (parse JSON, validate, use DB helpers within a transaction).
- /relative/path/of/changed/file: `src/main/services/playlistService.ts`
- Operation being done (Update): Adds JSON export/import logic.

#### Other Notes On Step 15: Implement Playlist Service Logic

- Use Zod for validating input parameters (e.g., playlist name, URL).
- Inject database helpers/instance into the service.
- Ensure proper error handling and logging.

### Step 16: Implement Playlist IPC Handlers

#### Detailed technical explanation of what we’re accomplishing in this step

Create the IPC handlers in the main process that will be invoked by the renderer process for playlist-related actions. These handlers will primarily call the corresponding functions in the `PlaylistService`.

#### Task Breakdown

##### SubTask 1: Create Playlist Handlers File

- Description Of SubTask 1 change: Create `playlistHandlers.ts`.
- /relative/path/of/changed/file: `src/main/ipc/playlistHandlers.ts`
- Operation being done (Create): Creates the IPC handler file for playlists.

##### SubTask 2: Implement Handlers

- Description Of SubTask 2 change: Implement `ipcMain.handle` calls for each playlist action defined in the feature specification (e.g., `playlist:create`, `playlist:import`, `playlist:get-all`, `playlist:get-details`, `playlist:delete`, `playlist:refresh`, `playlist:export`, `playlist:import-json`). Each handler should:
    - Validate incoming arguments using Zod.
    - Call the appropriate `PlaylistService` function.
    - Wrap the call in `try...catch` for error handling.
    - Return a structured response `{ success, data?, error? }`.
- /relative/path/of/changed/file: `src/main/ipc/playlistHandlers.ts`
- Operation being done (Update): Adds IPC handler implementations.

##### SubTask 3: Register Playlist Handlers

- Description Of SubTask 3 change: Import and register the playlist handlers in `src/main/index.ts`.
- /relative/path/of/changed/file: `src/main/index.ts`
- Operation being done (Update): Registers playlist IPC handlers.

#### Other Notes On Step 16: Implement Playlist IPC Handlers

- Ensure channel names match exactly between handlers and renderer calls.
- Use the shared TypeScript types for request/response payloads.

### Step 17: Implement Frontend Playlist State Management

#### Detailed technical explanation of what we’re accomplishing in this step

Set up state management in the renderer process (React app) for handling playlist data. Use `React Query` for fetching and caching the list of playlists and the details of the selected playlist. Use `Zustand` for managing UI state related to playlists (e.g., selected playlist ID, modal visibility).

#### Task Breakdown

##### SubTask 1: Setup React Query Client

- Description Of SubTask 1 change: Configure `QueryClient` and `QueryClientProvider` in the main React app component (`App.tsx` or `index.tsx`).
- /relative/path/of/changed/file: `src/renderer/App.tsx` (or `src/renderer/index.tsx`)
- Operation being done (Update): Adds React Query setup.

##### SubTask 2: Create Playlist Queries/Mutations

- Description Of SubTask 2 change: Create custom hooks using `useQuery` and `useMutation` (from React Query) that utilize the preload API (`window.electronAPI.invoke`) to call the playlist IPC handlers (`playlist:get-all`, `playlist:get-details`, `playlist:create`, `playlist:import`, `playlist:delete`, etc.). Define query keys.
- /relative/path/of/changed/file: `src/renderer/hooks/usePlaylistQueries.ts` (or similar)
- Operation being done (Create): Creates React Query hooks for playlists.

##### SubTask 3: Create Playlist UI Store (Zustand)

- Description Of SubTask 3 change: Create a Zustand store (`playlistStore.ts`) to manage UI state like `selectedPlaylistId`, `isCreateModalOpen`, `isImportModalOpen`.
- /relative/path/of/changed/file: `src/renderer/store/playlistStore.ts`
- Operation being done (Create): Creates Zustand store for playlist UI state.

#### Other Notes On Step 17: Implement Frontend Playlist State Management

- Configure React Query mutations to invalidate relevant queries upon success (e.g., invalidate `playlist:get-all` after `playlist:create`).
- Use shared TypeScript types for data consistency.

### Step 18: Implement Playlist List UI

#### Detailed technical explanation of what we’re accomplishing in this step

Create the React components necessary to display the list of playlists fetched from the main process. Allow users to select a playlist.

#### Task Breakdown

##### SubTask 1: Create Playlist List Component

- Description Of SubTask 1 change: Create `PlaylistList.tsx`. Use the `useQuery` hook (from Step 17) to fetch all playlists (`playlist:get-all`). Render a list of playlist items.
- /relative/path/of/changed/file: `src/renderer/components/PlaylistList/PlaylistList.tsx`
- Operation being done (Create): Creates the main list component.

##### SubTask 2: Create Playlist Item Component

- Description Of SubTask 2 change: Create `PlaylistItem.tsx`. Display playlist name, source, video count. Handle click events to update the `selectedPlaylistId` in the Zustand store.
- /relative/path/of/changed/file: `src/renderer/components/PlaylistList/PlaylistItem.tsx`
- Operation being done (Create): Creates the individual item component.

##### SubTask 3: Integrate into Page

- Description Of SubTask 3 change: Add the `PlaylistList` component to the `MyPlaylists.tsx` (likely in a sidebar or left panel).
- /relative/path/of/changed/file: `src/renderer/pages/MyPlaylists.tsx`
- Operation being done (Update): Integrates the list component into the page layout.

#### Other Notes On Step 18: Implement Playlist List UI

- Handle loading and error states from the `useQuery` hook.
- Style components using Tailwind CSS / shadcn/ui.

### Step 19: Implement Playlist Details UI

#### Detailed technical explanation of what we’re accomplishing in this step

Create the React components to display the videos within the currently selected playlist. Include a search/filter bar.

#### Task Breakdown

##### SubTask 1: Create Playlist View Component

- Description Of SubTask 1 change: Create `PlaylistView.tsx`. Get `selectedPlaylistId` from the Zustand store. Use `useQuery` (from Step 17) with the `selectedPlaylistId` to fetch playlist details (`playlist:get-details`).
- /relative/path/of/changed/file: `src/renderer/components/PlaylistView/PlaylistView.tsx`
- Operation being done (Create): Creates the details view component.

##### SubTask 2: Create Video Item Component

- Description Of SubTask 2 change: Create `VideoItem.tsx`. Display video thumbnail, title, channel, duration, and availability status. Include placeholders for future actions (download button).
- /relative/path/of/changed/file: `src/renderer/components/PlaylistView/VideoItem.tsx`
- Operation being done (Create): Creates the individual video item component.

##### SubTask 3: Implement Video List Rendering

- Description Of SubTask 3 change: In `PlaylistView.tsx`, map over the fetched video data and render `VideoItem` components. Implement virtualization (`react-window` or similar) if playlists can be very large.
- /relative/path/of/changed/file: `src/renderer/components/PlaylistView/PlaylistView.tsx`
- Operation being done (Update): Adds video list rendering logic.

##### SubTask 4: Implement Search/Filter Bar

- Description Of SubTask 4 change: Add an input field to `PlaylistView.tsx`. Implement client-side filtering logic based on the input value (filtering the fetched video list).
- /relative/path/of/changed/file: `src/renderer/components/PlaylistView/PlaylistView.tsx`
- Operation being done (Update): Adds search functionality.

##### SubTask 5: Integrate into Page

- Description Of SubTask 5 change: Add the `PlaylistView` component to the `MyPlaylists.tsx` (likely in the main content area).
- /relative/path/of/changed/file: `src/renderer/pages/MyPlaylists.tsx`
- Operation being done (Update): Integrates the details view component.

#### Other Notes On Step 19: Implement Playlist Details UI

- Handle loading/error states for the details query.
- Display a message if no playlist is selected or if the selected playlist is empty.

### Step 20: Implement Create/Import Playlist UI

#### Detailed technical explanation of what we’re accomplishing in this step

Create modal dialogs using shadcn/ui components for creating a new custom playlist and importing a playlist from a YouTube URL.

#### Task Breakdown

##### SubTask 1: Create Playlist Actions Bar

- Description Of SubTask 1 change: Add buttons (e.g., "New Playlist", "Import Playlist") to the `MyPlaylists` or `PlaylistList` component.
- /relative/path/of/changed/file: `src/renderer/pages/MyPlaylists.tsx` (or `src/renderer/components/PlaylistList/PlaylistList.tsx`)
- Operation being done (Update): Adds UI elements to trigger modals.

##### SubTask 2: Create "New Playlist" Modal

- Description Of SubTask 2 change: Create `CreatePlaylistModal.tsx`. Use shadcn/ui `Dialog` components. Include an input field for the playlist name and a submit button. Control visibility using the Zustand store (`isCreateModalOpen`). On submit, call the `playlist:create` mutation hook (from Step 17).
- /relative/path/of/changed/file: `src/renderer/components/Modals/CreatePlaylistModal.tsx`
- Operation being done (Create): Creates the new playlist modal component.

##### SubTask 3: Create "Import Playlist" Modal

- Description Of SubTask 3 change: Create `ImportPlaylistModal.tsx`. Use shadcn/ui `Dialog`. Include an input field for the YouTube URL and a submit button. Control visibility using Zustand store (`isImportModalOpen`). On submit, call the `playlist:import` mutation hook.
- /relative/path/of/changed/file: `src/renderer/components/Modals/ImportPlaylistModal.tsx`
- Operation being done (Create): Creates the import playlist modal component.

##### SubTask 4: Connect Buttons to Modals

- Description Of SubTask 4 change: Add `onClick` handlers to the buttons created in SubTask 1 to update the Zustand store and open the corresponding modals.
- /relative/path/of/changed/file: `src/renderer/pages/MyPlaylists.tsx` (or `src/renderer/components/PlaylistList/PlaylistList.tsx`)
- Operation being done (Update): Connects buttons to modal state.

#### Other Notes On Step 20: Implement Create/Import Playlist UI

- Handle loading states and display success/error messages (e.g., using toasts) after mutation calls.
- Close modals on successful submission or cancellation.

### Step 21: Implement Playlist Actions (Rename, Delete, Duplicate, Refresh)

#### Detailed technical explanation of what we’re accomplishing in this step

Add UI elements (buttons, context menus) to allow users to rename, delete, duplicate, and refresh playlists. Connect these UI elements to the corresponding IPC handlers via React Query mutations.

#### Task Breakdown

##### SubTask 1: Add Action Buttons/Menu

- Description Of SubTask 1 change: Add buttons or a context menu (e.g., on right-click) to the `PlaylistItem` component for actions like Rename, Delete, Duplicate, Refresh (Refresh only for YouTube playlists).
- /relative/path/of/changed/file: `src/renderer/components/PlaylistList/PlaylistItem.tsx`
- Operation being done (Update): Adds UI elements for playlist actions.

##### SubTask 2: Implement Rename Logic

- Description Of SubTask 2 change: Implement rename functionality (e.g., inline editing or a modal). Call the `playlist:rename` mutation hook (requires adding service/handler/mutation).
- /relative/path/of/changed/file: `src/renderer/components/PlaylistList/PlaylistItem.tsx` (and potentially new modal/service/handler)
- Operation being done (Update): Adds rename functionality.

##### SubTask 3: Implement Delete Logic

- Description Of SubTask 3 change: Add a confirmation dialog. On confirmation, call the `playlist:delete` mutation hook.
- /relative/path/of/changed/file: `src/renderer/components/PlaylistList/PlaylistItem.tsx` (and potentially confirmation modal)
- Operation being done (Update): Adds delete functionality.

##### SubTask 4: Implement Duplicate Logic

- Description Of SubTask 4 change: Call the `playlist:duplicate` mutation hook (requires adding service/handler/mutation).
- /relative/path/of/changed/file: `src/renderer/components/PlaylistList/PlaylistItem.tsx` (and potentially new service/handler)
- Operation being done (Update): Adds duplicate functionality.

##### SubTask 5: Implement Refresh Logic

- Description Of SubTask 5 change: Call the `playlist:refresh` mutation hook. Display loading indicator during refresh.
- /relative/path/of/changed/file: `src/renderer/components/PlaylistList/PlaylistItem.tsx`
- Operation being done (Update): Adds refresh functionality.

#### Other Notes On Step 21: Implement Playlist Actions (Rename, Delete, Duplicate, Refresh)

- Ensure mutations invalidate the `playlist:get-all` query to update the list.
- Provide user feedback (toasts) on success/failure.

### Step 22: Implement Playlist Export/Import (JSON)

#### Detailed technical explanation of what we’re accomplishing in this step

Add UI elements to trigger the export of a selected playlist to a JSON file and import a playlist from a JSON file, utilizing the main process dialogs via IPC.

#### Task Breakdown

##### SubTask 1: Add Export Button/Menu Item

- Description Of SubTask 1 change: Add an "Export Playlist" button/menu item, likely near the playlist actions or in a general menu.
- /relative/path/of/changed/file: `src/renderer/components/PlaylistList/PlaylistItem.tsx` (or other relevant location)
- Operation being done (Update): Adds export UI element.

##### SubTask 2: Implement Export Logic

- Description Of SubTask 2 change: On click, call the `playlist:export` IPC handler (via mutation or direct invoke). This handler uses `dialog.showSaveDialog` in the main process.
- /relative/path/of/changed/file: Component containing the export button.
- Operation being done (Update): Adds export invocation logic.

##### SubTask 3: Add Import Button/Menu Item

- Description Of SubTask 3 change: Add an "Import from File" button/menu item, likely near the "Import Playlist" button.
- /relative/path/of/changed/file: `src/renderer/pages/MyPlaylists.tsx` (or `src/renderer/components/PlaylistList/PlaylistList.tsx`)
- Operation being done (Update): Adds import UI element.

##### SubTask 4: Implement Import Logic

- Description Of SubTask 4 change: On click, call the `playlist:import-json` IPC handler (via mutation or direct invoke). This handler uses `dialog.showOpenDialog` in the main process.
- /relative/path/of/changed/file: Component containing the import button.
- Operation being done (Update): Adds import invocation logic.

#### Other Notes On Step 22: Implement Playlist Export/Import (JSON)

- Provide user feedback (toasts) on successful export/import or if an error occurs (e.g., invalid file format).
- Ensure the `playlist:get-all` query is invalidated after successful import.

## Task 5: Video Download Implementation

### Step 23: Implement Download Service Logic

#### Detailed technical explanation of what we’re accomplishing in this step

Create the service layer (`downloadService.ts`) in the main process to handle the business logic for video downloads. This service will manage a download queue (`P-Queue`), interact with `yt-dlp-wrap` to perform downloads, use `DependencyService` to get executable paths, update the database via helpers, and emit progress events.

#### Task Breakdown

##### SubTask 1: Create Download Service File

- Description Of SubTask 1 change: Create the `downloadService.ts` file.
- /relative/path/of/changed/file: `src/main/services/downloadService.ts`
- Operation being done (Create): Creates the service file.

##### SubTask 2: Initialize Download Queue

- Description Of SubTask 2 change: Import `PQueue`. Instantiate a queue with a configurable concurrency limit (e.g., from settings, default to 2-3).
- /relative/path/of/changed/file: `src/main/services/downloadService.ts`
- Operation being done (Update): Adds queue initialization.

##### SubTask 3: Implement `getFormats`

- Description Of SubTask 3 change: Implement a function that takes a video URL, uses `yt-dlp-wrap` with the `--list-formats` flag, parses the output, and returns a structured list of available formats.
- /relative/path/of/changed/file: `src/main/services/downloadService.ts`
- Operation being done (Update): Adds format fetching logic.

##### SubTask 4: Implement `addDownload` (Core Logic)

- Description Of SubTask 4 change: Implement a core function (e.g., `_performDownload`) that will be added to the `P-Queue`. This function takes video ID, quality selection, download path, and the `webContents` object (for sending events):
    - Updates DB status to `queued` (via DB helper) and sends `download:progress` event.
    - When the queue starts the job: Updates DB status to `downloading`, sends event.
    - Gets `yt-dlp` path from `DependencyService`.
    - Constructs `yt-dlp` arguments (URL, format selection `-f`, output path `-o`, potentially `--ffmpeg-location`).
    - Creates a `YtDlpProcess` instance from `yt-dlp-wrap`.
    - Attaches listeners for `progress` events (parse percentage, total size, etc.). Send `download:progress` events to renderer via `webContents.send`.
    - Attaches listeners for `ytDlpEvent` (e.g., `Metadata`, `Completed`, `Error`).
    - On `Completed`: Update DB status to `completed`, store file path, timestamp. Send `download:complete` event.
    - On `Error`: Update DB status to `failed`. Log the error. Send `download:complete` event with error details.
    - Handles file system errors (e.g., disk full during download).
- /relative/path/of/changed/file: `src/main/services/downloadService.ts`
- Operation being done (Update): Adds the core download execution logic.

##### SubTask 5: Implement `startVideoDownload` / `startPlaylistDownload`

- Description Of SubTask 5 change: Implement functions exposed to IPC handlers:
    - `startVideoDownload`: Takes video ID, quality, optional path. Adds a single call to `_performDownload` to the `P-Queue`.
    - `startPlaylistDownload`: Takes playlist ID, quality, optional path. Fetches video IDs for the playlist (via `PlaylistService` or DB helper). Adds multiple calls to `_performDownload` (one per video) to the `P-Queue`.
    - These functions determine the final download path (using default from settings or provided path, creating playlist subfolders).
- /relative/path/of/changed/file: `src/main/services/downloadService.ts`
- Operation being done (Update): Adds functions to initiate downloads and add them to the queue.

##### SubTask 6: Implement `getQueueStatus`

- Description Of SubTask 6 change: Implement a function that returns the current state of the download queue (e.g., pending count, active count, potentially list of active/pending items by querying DB status).
- /relative/path/of/changed/file: `src/main/services/downloadService.ts`
- Operation being done (Update): Adds queue status retrieval logic.

#### Other Notes On Step 23: Implement Download Service Logic

- Inject DB helpers, `DependencyService`, and potentially `SettingsService`.
- Pass the `event.sender` (webContents) from the IPC handler to the service function so it can send progress events back to the correct window.
- Ensure robust error handling for `yt-dlp` execution and file system operations.

### Step 24: Implement Download IPC Handlers & Events

#### Detailed technical explanation of what we’re accomplishing in this step

Create the IPC handlers for download-related actions and ensure the main process correctly sends progress and completion events back to the renderer.

#### Task Breakdown

##### SubTask 1: Create Download Handlers File

- Description Of SubTask 1 change: Create `downloadHandlers.ts`.
- /relative/path/of/changed/file: `src/main/ipc/downloadHandlers.ts`
- Operation being done (Create): Creates the IPC handler file for downloads.

##### SubTask 2: Implement Handlers

- Description Of SubTask 2 change: Implement `ipcMain.handle` calls for `download:start-video`, `download:start-playlist`, `download:get-formats`, `download:get-queue`. Each handler should:
    - Validate arguments using Zod.
    - Call the appropriate `DownloadService` function, passing `event.sender` if needed for progress updates.
    - Handle errors and return structured responses.
- /relative/path/of/changed/file: `src/main/ipc/downloadHandlers.ts`
- Operation being done (Update): Adds IPC handler implementations.

##### SubTask 3: Register Download Handlers

- Description Of SubTask 3 change: Import and register the download handlers in `src/main/index.ts`.
- /relative/path/of/changed/file: `src/main/index.ts`
- Operation being done (Update): Registers download IPC handlers.

##### SubTask 4: Verify Event Sending

- Description Of SubTask 4 change: Ensure the `DownloadService` correctly uses the `webContents` object (passed from the handler via `event.sender`) to send `download:progress` and `download:complete` events.
- /relative/path/of/changed/file: `src/main/services/downloadService.ts`
- Operation being done (Verify): Confirms event sending mechanism is used.

#### Other Notes On Step 24: Implement Download IPC Handlers & Events

- The renderer needs corresponding listeners (`window.electronAPI.on(...)`) for the progress and completion events.

### Step 25: Implement Frontend Download State Management

#### Detailed technical explanation of what we’re accomplishing in this step

Set up state management in the renderer for the download queue and related UI state. Use Zustand to store the download queue status received via IPC events. Use React Query to fetch available formats when needed.

#### Task Breakdown

##### SubTask 1: Create Download Store (Zustand)

- Description Of SubTask 1 change: Create `downloadStore.ts`. Define state to hold the download queue (e.g., an array or map of `DownloadQueueItem`). Include actions to update the queue based on `download:progress` and `download:complete` events.
- /relative/path/of/changed/file: `src/renderer/store/downloadStore.ts`
- Operation being done (Create): Creates Zustand store for download state.

##### SubTask 2: Implement IPC Event Listeners

- Description Of SubTask 2 change: In a central place in the React app (e.g., `App.tsx` or a dedicated effect hook), set up listeners using `window.electronAPI.on("download:progress", ...)` and `window.electronAPI.on("download:complete", ...)`. These listeners should call the update actions in the Zustand store.
- /relative/path/of/changed/file: `src/renderer/App.tsx` (or similar)
- Operation being done (Update): Adds listeners for download events.

##### SubTask 3: Create Format Query Hook

- Description Of SubTask 3 change: Create a `useQuery` hook (`useVideoFormats`) that calls the `download:get-formats` IPC handler.
- /relative/path/of/changed/file: `src/renderer/hooks/useDownloadQueries.ts` (or similar)
- Operation being done (Create): Creates React Query hook for fetching formats.

#### Other Notes On Step 25: Implement Frontend Download State Management

- Ensure listeners are properly cleaned up on component unmount to avoid memory leaks.
- The Zustand store provides the reactive state for the Downloads Page UI.

### Step 26: Implement Download Button & Options UI

#### Detailed technical explanation of what we’re accomplishing in this step

Implement the UI element (e.g., a button or icon) on video items to initiate downloads. Include logic to fetch formats, display quality/location options (likely in a modal), and trigger the download IPC handler.

#### Task Breakdown

##### SubTask 1: Create Download Button Component

- Description Of SubTask 1 change: Create `DownloadButton.tsx`. This component will display different states (e.g., download icon, queued, progress percentage, completed checkmark, error icon) based on the video's `download_status` from the fetched playlist details.
- /relative/path/of/changed/file: `src/renderer/components/DownloadButton/DownloadButton.tsx`
- Operation being done (Create): Creates the download button component.

##### SubTask 2: Add Button to Video Item

- Description Of SubTask 2 change: Integrate the `DownloadButton` into the `VideoItem.tsx` component.
- /relative/path/of/changed/file: `src/renderer/components/PlaylistView/VideoItem.tsx`
- Operation being done (Update): Adds the download button to video items.

##### SubTask 3: Create Download Options Modal

- Description Of SubTask 3 change: Create `DownloadOptionsModal.tsx`. When the download button (in its initial state) is clicked:
    - Trigger fetching formats using the `useVideoFormats` hook.
    - Display available formats (e.g., in a dropdown).
    - Provide an option to choose download location (default or custom via `dialog:open-directory` IPC call).
    - On confirmation, call the `download:start-video` IPC handler with selected options.
- /relative/path/of/changed/file: `src/renderer/components/Modals/DownloadOptionsModal.tsx`
- Operation being done (Create): Creates the modal for download options.

##### SubTask 4: Connect Button to Modal

- Description Of SubTask 4 change: Add logic to the `DownloadButton` (or `VideoItem`) to open the `DownloadOptionsModal` when clicked in the initial download state.
- /relative/path/of/changed/file: `src/renderer/components/DownloadButton/DownloadButton.tsx`
- Operation being done (Update): Connects the button click to opening the modal.

#### Other Notes On Step 26: Implement Download Button & Options UI

- Handle loading state while fetching formats.
- Persist the user's last selected quality preference (e.g., in local storage or settings) as a default for the next download.
- The button's appearance should react to changes in the download status received via IPC events and reflected in the Zustand store or refetched playlist details.

### Step 27: Implement Downloads Page UI

#### Detailed technical explanation of what we’re accomplishing in this step

Create a dedicated page in the renderer process to display the list of active, queued, completed, and failed downloads, using the state managed by the Zustand download store.

#### Task Breakdown

##### SubTask 1: Create Downloads Page Component

- Description Of SubTask 1 change: Create `DownloadsPage.tsx`.
- /relative/path/of/changed/file: `src/renderer/pages/Downloads.tsx`
- Operation being done (Create): Creates the downloads page component.

##### SubTask 2: Access Download Queue State

- Description Of SubTask 2 change: Inside `DownloadsPage.tsx`, access the download queue state from the Zustand store created in Step 25.
- /relative/path/of/changed/file: `src/renderer/pages/Downloads.tsx`
- Operation being done (Update): Connects page to Zustand store.

##### SubTask 3: Render Download Items

- Description Of SubTask 3 change: Map over the download queue state and render items showing video title, status (Queued, Downloading X%, Completed, Failed), and potentially progress bars.
- /relative/path/of/changed/file: `src/renderer/pages/Downloads.tsx`
- Operation being done (Update): Adds rendering logic for download items.

##### SubTask 4: Add Page to Router

- Description Of SubTask 4 change: Add a route (e.g., `/downloads`) for the `DownloadsPage` in the TanStack Router configuration.
- /relative/path/of/changed/file: `src/renderer/router/index.ts`
- Operation being done (Update): Adds routing for the downloads page.

#### Other Notes On Step 27: Implement Downloads Page UI

- Consider adding filtering or sorting options (e.g., show only active, show only failed).
- Add buttons for potential actions like clearing completed/failed downloads or retrying failed ones (Post-MVP).

## Task 6: User Experience & Core UI Implementation

### Step 28: Implement Main Layout & Navigation

#### Detailed technical explanation of what we’re accomplishing in this step

Create the main application layout structure, including a persistent sidebar for navigation between different sections (Dashboard, Playlists, Downloads, History, Settings) using the TanStack Router.

#### Task Breakdown

##### SubTask 1: Create Main Layout Component

- Description Of SubTask 1 change: Create `MainLayout.tsx`. This component will contain the overall structure, likely a flex container with a `Sidebar` component and a main content area where the router outlet will render pages.
- /relative/path/of/changed/file: `src/renderer/layouts/MainLayout.tsx`
- Operation being done (Create): Creates the main layout component.

##### SubTask 2: Create Sidebar Component

- Description Of SubTask 2 change: Create `Sidebar.tsx`. Include navigation links (using TanStack Router's `Link` component) for Dashboard, My Playlists, Downloads, History, and Settings. Use icons and text for links.
- /relative/path/of/changed/file: `src/renderer/components/Sidebar/Sidebar.tsx`
- Operation being done (Create): Creates the sidebar navigation component.

##### SubTask 3: Configure Router

- Description Of SubTask 3 change: Set up TanStack Router in `src/renderer/router/index.ts`. Define routes for `/`, `/playlists`, `/downloads`, `/history`, `/settings`, associating each route with its corresponding page component (create placeholder page components if they don't exist yet). Configure the router to use the `MainLayout` for these routes.
- /relative/path/of/changed/file: `src/renderer/router/index.ts`, `src/renderer/pages/Dashboard.tsx`, `src/renderer/pages/MyPlaylists.tsx`, `src/renderer/pages/Downloads.tsx`, `src/renderer/pages/History.tsx`, `src/renderer/pages/Settings.tsx`
- Operation being done (Create/Update): Configures routing and creates placeholder page components.

##### SubTask 4: Integrate Router in App

- Description Of SubTask 4 change: In `App.tsx`, render the `RouterProvider` from TanStack Router, providing the configured router instance.
- /relative/path/of/changed/file: `src/renderer/App.tsx`
- Operation being done (Update): Integrates the router into the application root.

#### Other Notes On Step 28: Implement Main Layout & Navigation

- Style the layout and sidebar using Tailwind CSS / shadcn/ui.
- Ensure active navigation links are highlighted.

### Step 29: Implement Settings Page UI & Logic

#### Detailed technical explanation of what we’re accomplishing in this step

Create the UI for the Settings page, allowing users to view and modify application settings (like the default download path) persisted using Electron Store.

#### Task Breakdown

##### SubTask 1: Create Settings Page Component

- Description Of SubTask 1 change: Flesh out `SettingsPage.tsx`. Use a `useQuery` hook to fetch current settings via the `settings:get` IPC handler.
- /relative/path/of/changed/file: `src/renderer/pages/Settings.tsx`
- Operation being done (Update): Implements the basic settings page structure.

##### SubTask 2: Create Setting Item Component (e.g., Directory Selector)

- Description Of SubTask 2 change: Create a reusable component (`DirectorySelector.tsx` or similar) for selecting a directory. It should display the current path and have a "Change" button. Clicking "Change" invokes the `dialog:open-directory` IPC handler.
- /relative/path/of/changed/file: `src/renderer/components/Settings/DirectorySelector.tsx`
- Operation being done (Create): Creates a directory selection component.

##### SubTask 3: Implement Setting Update Logic

- Description Of SubTask 3 change: When a setting is changed (e.g., a new directory is selected via the `DirectorySelector`), use a `useMutation` hook to call the `settings:set` IPC handler to save the new value. Update the local state/refetch settings on success.
- /relative/path/of/changed/file: `src/renderer/pages/Settings.tsx`, `src/renderer/components/Settings/DirectorySelector.tsx`
- Operation being done (Update): Adds logic to update settings.

##### SubTask 4: Display Settings

- Description Of SubTask 4 change: In `SettingsPage.tsx`, render the setting items (e.g., `DirectorySelector` for the default download path) using the fetched settings data.
- /relative/path/of/changed/file: `src/renderer/pages/Settings.tsx`
- Operation being done (Update): Renders the settings UI elements.

#### Other Notes On Step 29: Implement Settings Page UI & Logic

- Handle loading and error states for fetching settings.
- Provide user feedback (e.g., toast) when settings are saved.

### Step 30: Implement History Service & UI

#### Detailed technical explanation of what we’re accomplishing in this step

Implement the backend service and frontend UI to track and display recently watched videos.

#### Task Breakdown

##### SubTask 1: Implement History Service Logic

- Description Of SubTask 1 change: Create `historyService.ts`. Implement functions `addOrUpdateHistory` and `getHistory` that use the corresponding DB helpers (from Step 7).
- /relative/path/of/changed/file: `src/main/services/historyService.ts`
- Operation being done (Create): Creates the history service module.

##### SubTask 2: Implement History IPC Handlers

- Description Of SubTask 2 change: Create `historyHandlers.ts`. Implement handlers for `history:add-or-update` and `history:get`, calling the `HistoryService` functions.
- /relative/path/of/changed/file: `src/main/ipc/historyHandlers.ts`
- Operation being done (Create): Creates IPC handlers for history.

##### SubTask 3: Register History Handlers

- Description Of SubTask 3 change: Import and register the history handlers in `src/main/index.ts`.
- /relative/path/of/changed/file: `src/main/index.ts`
- Operation being done (Update): Registers history IPC handlers.

##### SubTask 4: Implement History Page UI

- Description Of SubTask 4 change: Flesh out `HistoryPage.tsx`. Use a `useQuery` hook to fetch history data via `history:get`. Render a list of `HistoryItem` components.
- /relative/path/of/changed/file: `src/renderer/pages/History.tsx`
- Operation being done (Update): Implements the history page UI.

##### SubTask 5: Create History Item Component

- Description Of SubTask 5 change: Create `HistoryItem.tsx`. Display video thumbnail, title, watch progress (potentially as a progress bar under the thumbnail), and watched date.
- /relative/path/of/changed/file: `src/renderer/components/History/HistoryItem.tsx`
- Operation being done (Create): Creates the individual history item component.

#### Other Notes On Step 30: Implement History Service & UI

- The `history:add-or-update` handler will be called later during video playback implementation (Step 31).
- Consider adding pagination or infinite scrolling to the history page if it can grow large.

### Step 31: Implement Video Player Integration

#### Detailed technical explanation of what we’re accomplishing in this step

Integrate the `react-player` component to allow playback of downloaded video files. Track playback progress and update the watch history.

#### Task Breakdown

##### SubTask 1: Create Player Component/Modal

- Description Of SubTask 1 change: Create a component (`VideoPlayer.tsx` or similar) that wraps `ReactPlayer`. This component will receive the local file path of the video to play. It could be rendered in a modal or a dedicated view.
- /relative/path/of/changed/file: `src/renderer/components/VideoPlayer/VideoPlayer.tsx`
- Operation being done (Create): Creates the video player component.

##### SubTask 2: Add Play Button/Action

- Description Of SubTask 2 change: Add a "Play" button or action to `VideoItem.tsx` that is enabled only if the video is downloaded (`local_file_path` is set).
- /relative/path/of/changed/file: `src/renderer/components/PlaylistView/VideoItem.tsx`
- Operation being done (Update): Adds a play button for downloaded videos.

##### SubTask 3: Trigger Player

- Description Of SubTask 3 change: When the Play button is clicked, open the `VideoPlayer` component/modal, passing the `local_file_path`.
- /relative/path/of/changed/file: `src/renderer/components/PlaylistView/VideoItem.tsx` (or parent component managing modal state)
- Operation being done (Update): Adds logic to open the player.

##### SubTask 4: Implement Progress Tracking

- Description Of SubTask 4 change: Use `ReactPlayer`'s `onProgress` callback. In the callback, periodically (e.g., every 5-10 seconds) call the `history:add-or-update` IPC handler (via a mutation hook) with the current video ID, progress percentage (`played`), and position (`playedSeconds`).
- /relative/path/of/changed/file: `src/renderer/components/VideoPlayer/VideoPlayer.tsx`
- Operation being done (Update): Adds history tracking during playback.

#### Other Notes On Step 31: Implement Video Player Integration

- Ensure the `local_file_path` stored in the database is correctly formatted as a `file://` URL for `ReactPlayer`.
- Handle potential errors during playback (e.g., file not found).

### Step 32: Implement Accessibility & Tooltips

#### Detailed technical explanation of what we’re accomplishing in this step

Enhance the application's accessibility by ensuring proper keyboard navigation, ARIA attributes, focus management, and adding informative tooltips to icon buttons and potentially complex UI elements.

#### Task Breakdown

##### SubTask 1: Review Keyboard Navigation

- Description Of SubTask 1 change: Manually test navigating through all interactive elements (sidebar links, buttons, list items, inputs, player controls) using the Tab key. Ensure logical focus order.
- /relative/path/of/changed/file: Various components.
- Operation being done (Verify/Update): Ensures keyboard accessibility.

##### SubTask 2: Add ARIA Attributes

- Description Of SubTask 2 change: Add appropriate ARIA attributes (e.g., `aria-label` for icon buttons, `role` attributes for custom components) where needed to improve screen reader compatibility.
- /relative/path/of/changed/file: Various components.
- Operation being done (Update): Adds ARIA attributes.

##### SubTask 3: Implement Tooltips

- Description Of SubTask 3 change: Use shadcn/ui `Tooltip` component to add descriptive tooltips to all icon buttons (e.g., download, delete, refresh, play, settings change) and potentially other elements where the purpose might not be immediately obvious.
- /relative/path/of/changed/file: Various components (`PlaylistItem.tsx`, `VideoItem.tsx`, `SettingsPage.tsx`, etc.)
- Operation being done (Update): Adds tooltips.

##### SubTask 4: Ensure Focus Indicators

- Description Of SubTask 4 change: Verify that all focusable elements have clear visual focus indicators (usually handled by Tailwind/shadcn defaults, but verify).
- /relative/path/of/changed/file: N/A (Verification)
- Operation being done (Verify): Checks focus visibility.

#### Other Notes On Step 32: Implement Accessibility & Tooltips

- Use accessibility testing tools (e.g., Axe DevTools browser extension) during development.
- Follow WCAG guidelines.

### Step 33: Implement General UI Polish

#### Detailed technical explanation of what we’re accomplishing in this step

Refine the user experience by adding consistent loading states, empty states, and user feedback mechanisms like toasts for success or error messages.

#### Task Breakdown

##### SubTask 1: Implement Loading States

- Description Of SubTask 1 change: Use the `isLoading` status from React Query hooks (`useQuery`, `useMutation`) to display loading indicators (e.g., spinners, skeletons) while data is being fetched or actions are being processed (e.g., importing playlist, refreshing, downloading).
- /relative/path/of/changed/file: Various components using React Query hooks.
- Operation being done (Update): Adds loading state indicators.

##### SubTask 2: Implement Empty States

- Description Of SubTask 2 change: Display informative messages when lists are empty (e.g., "No playlists found. Import one to get started.", "No videos in this playlist.", "No download history.").
- /relative/path/of/changed/file: `PlaylistList.tsx`, `PlaylistView.tsx`, `DownloadsPage.tsx`, `HistoryPage.tsx`.
- Operation being done (Update): Adds empty state messages.

##### SubTask 3: Implement Toast Notifications

- Description Of SubTask 3 change: Set up shadcn/ui `Toast` component (`useToast` hook and `Toaster`). Call the `toast` function from mutation `onSuccess` or `onError` callbacks to provide feedback for actions like creating/importing/deleting playlists, starting downloads, saving settings, etc.
- /relative/path/of/changed/file: `App.tsx` (for Toaster), various components triggering mutations.
- Operation being done (Update): Integrates toast notifications.

#### Other Notes On Step 33: Implement General UI Polish

- Ensure error messages shown to the user are user-friendly and avoid technical jargon where possible.
- Provide clear visual distinction between different states (loading, error, success, empty).


