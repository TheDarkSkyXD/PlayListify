# Technology Stack

This document outlines the key technologies, libraries, and frameworks chosen for the Playlistify application.

## 1. Core Framework & Build System

-   **Electron & Electron Forge:** The core framework for building the cross-platform desktop app.
    -   `electron`: Main dependency for creating the application shell.
    -   `@electron-forge/cli`: The command-line interface for developing, building, and packaging the application.
    -   `@electron-forge/maker-*`: Packaging tools (`-squirrel`, `-zip`, `-deb`, `-rpm`) to create installers for Windows, macOS, and various Linux distributions.
    -   `@electron-forge/plugin-webpack`: Integrates Webpack into the build process to bundle and optimize frontend code.
    -   `@electron-forge/plugin-auto-unpack-natives`: Handles native Node.js modules during packaging.
    -   `electron-updater`: Manages automatic application updates.

## 2. Language & Environment

-   **TypeScript:** The primary programming language for both the main and renderer processes, providing static typing to improve code quality and maintainability.
-   **Node.js:** The runtime environment for the backend (main process), enabling server-side logic and file system access.

## 3. Frontend (Renderer Process)

-   **UI Framework:**
    -   `react` & `react-dom`: The core library for building the component-based user interface.
-   **Routing:**
    -   `@tanstack/react-router`: A fully type-safe router for managing navigation and application views.
-   **State Management:**
    -   `@tanstack/react-query`: Manages server state, including caching, background refetching, and synchronization of data from the backend.
    -   `zustand`: A lightweight global state management solution for client-side UI state.
-   **UI Components & Styling:**
    -   `tailwindcss`: A utility-first CSS framework for rapid UI development.
    -   `@shadcn/ui`: A collection of beautifully designed, reusable UI components built on top of Radix UI and Tailwind CSS.
    -   `postcss` & `autoprefixer`: Used to process and add vendor prefixes to CSS.
-   **Media:**
    -   `react-player`: A versatile component for playing a variety of media URLs, including file paths.

## 4. Backend (Main Process)

-   **Database:**
    -   `better-sqlite3`: A synchronous driver for SQLite. Chosen for its simplicity and performance in scenarios where database operations are managed within dedicated, controlled workflows.
-   **Configuration & Storage:**
    -   `electron-store`: Simple data persistence for user settings and application configuration.
-   **External API & Services:**
    -   `googleapis`: Node.js client library for accessing Google APIs, specifically for YouTube Data API v3.
    -   `axios`: A promise-based HTTP client for making requests to external services.
-   **Media Handling:**
    -   `yt-dlp-wrap`: A Node.js wrapper for the `yt-dlp` command-line tool to download video/audio content.
    -   `@rse/ffmpeg`: A wrapper for the `ffmpeg` tool for media processing and conversion.
-   **Utilities:**
    -   `winston`: A versatile logging library for capturing application events and errors.
    -   `p-queue`: A promise-based queue for managing concurrent tasks like downloads and API calls.
    -   `fs-extra`: Provides enhanced file system methods, including promises.

## 5. Testing

-   **Jest:** The primary testing framework for running unit and integration tests.
-   `ts-jest`: A TypeScript preprocessor for Jest.
-   `@testing-library/react`: Provides utilities for testing React components in a way that resembles how users interact with them.

## 6. Development & Build Tools

-   **Webpack Toolchain:**
    -   `@vercel/webpack-asset-relocator-loader`, `css-loader`, `node-loader`, `style-loader`: Essential loaders for Webpack to handle various asset types.
-   **Code Quality:**
    -   `eslint`: For static code analysis and enforcing code style.
    -   `prettier`: An opinionated code formatter to ensure consistent style across the codebase.
    -   `prettier-plugin-sort-imports` & `prettier-plugin-tailwindcss`: Prettier plugins for organizing imports and class names.
-   **Utilities:**
    -   `cross-env`: Ensures environment variables work across different platforms.
    -   `electron-rebuild`: For rebuilding native Node modules against the Electron version.