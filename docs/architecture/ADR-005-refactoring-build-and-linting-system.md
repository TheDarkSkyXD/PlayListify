# ADR-005: Refactoring the Build & Linting System for Improved Developer Experience and Robustness

**Status:** Proposed

## 1. Context

This project's `package.json` already includes `electron-forge`, `@electron-forge/plugin-webpack`, `eslint`, and `prettier`. This indicates that a build and linting system exists. However, the current developer experience suffers from potential pain points including slow build/reload times, configuration complexity, and a lack of automated quality enforcement.

The previous ADR (ADR-004) incorrectly proposed introducing these tools as new, failing to recognize the core problem: the *existing integration* is not optimized for an Electron application's specific needs. An Electron application is a dual-process environment with a **main process** (Node.js) and one or more **renderer processes** (Chromium), which require distinct build configurations.

This ADR supersedes ADR-004. Its purpose is not to introduce new tools, but to **refactor the existing build and linting system** to be more robust, performant, and developer-friendly, fully acknowledging the Electron architecture.

## 2. Decision

We will overhaul the project's build, development, and quality-enforcement workflows. This decision is broken down into three key areas: evaluating the core bundler, defining an Electron-aware build architecture, and automating quality gates.

### 2.1. Formal Evaluation of Bundler Alternatives

We will not assume Webpack is the best choice. A formal, data-driven comparison will be conducted between two primary options:

1.  **Option A: Refine the existing Electron Forge/Webpack Setup.** This involves a deep dive into the existing configuration to optimize it for performance and clarity.
2.  **Option B: Migrate to Vite.** This involves replacing Webpack with Vite and `vite-plugin-electron`, a modern alternative known for significantly faster build times and simpler configuration.

A proof-of-concept will be developed for each option, and the final choice will be based on build times, Hot-Module Replacement (HMR) performance for both main and renderer processes, and overall configuration complexity.

### 2.2. An Electron-Aware Build Architecture

Regardless of the chosen bundler, the build system will be architected to handle Electron's dual-process model correctly.

If **Webpack** is retained, the single `webpack.config.js` will be replaced with a multi-configuration setup:
*   `webpack.main.config.js`: Configured with `target: 'electron-main'` to correctly bundle code for the Node.js environment, handling native modules appropriately.
*   `webpack.renderer.config.js`: Configured with `target: 'electron-renderer'` to bundle code for the browser environment.
*   `webpack.common.config.js`: A shared configuration to reduce duplication between the main and renderer configs.

If **Vite** is chosen, its configuration will inherently manage this separation through `vite-plugin-electron`.

### 2.3. Automated Quality Gates with Pre-commit Hooks

Code quality and consistency will be enforced automatically. We will use **Husky** to install pre-commit hooks into Git.

Before any commit is finalized, the following commands will be executed automatically:
*   `npm run lint:fix`: To catch and auto-fix linting errors.
*   `npm run format`: To ensure all code adheres to Prettier's formatting rules.

This moves quality enforcement from a manual, optional step to a mandatory, automated part of the development workflow, preventing inconsistent code from ever entering the repository.

### 2.4. A Concrete Development Workflow

The `npm start` script will provide a seamless development experience with hot-reloading for both main and renderer processes.

*   The practice of using `webpack-dev-server` is incorrect for this context and will be abandoned.
*   The development workflow will be handled either by **Electron Forge's built-in HMR** (if properly configured) or by a custom script using tools like `concurrently` to run the bundler in watch mode alongside an `electron-reloader` process.

## 3. Consequences

### Positive

*   **Improved Developer Experience**: Faster build and HMR times will significantly boost productivity.
*   **Increased Code Quality**: Automated linting and formatting will ensure a consistent and high-quality codebase.
*   **Reduced Architectural Complexity**: A clear, Electron-aware build configuration will be easier to understand and maintain.
*   **Enhanced Robustness**: The new system will be less prone to the configuration errors and brittleness of the previous setup.

### Negative

*   **Initial Setup Cost**: Time must be invested to conduct the Webpack vs. Vite evaluation and to refactor the chosen configuration.
*   **Learning Curve**: If Vite is chosen, developers will need to familiarize themselves with a new toolchain.

### Dependencies

The implementation will require a complete and explicit set of dependencies. The final list depends on the bundler evaluation, but the core toolchain for quality automation is:

*   **Quality & Hooks**: `husky`, `eslint`, `prettier`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-prettier`, `eslint-config-prettier`.
*   **Bundling & Transpiling**: `typescript` and necessary loaders for the chosen bundler (e.g., `ts-loader`, `css-loader`, `style-loader` for Webpack).

A complete list will be finalized upon the conclusion of the bundler evaluation.