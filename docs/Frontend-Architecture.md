# Playlistify Frontend Architecture Document

### Introduction

This document details the technical architecture specifically for the frontend of Playlistify. It complements the main Playlistify Architecture Document and the UI/UX Specification. It builds upon the foundational decisions defined in the main Architecture Document and the PRD.

* **Link to Main Architecture Document (to be created):** N/A
* **Link to UI/UX Specification:** `front-end-spec.md` (the document we created)
* **Link to Primary Design Files (Figma, Sketch, etc.):** N/A

### Overall Frontend Philosophy & Patterns

* **Framework & Core Libraries:** The application will be built using **React** and **TypeScript**, based on the `electron-react-boilerplate` foundation.
* **Component Architecture:** We will use **shadcn/ui** as our primary component library, supplemented with icons from **lucide-react**. Our approach will be to compose these base components into larger, feature-specific components. Path aliases (e.g., `@[/frontend]/components/ui` for Shadcn components, `@[/frontend]/lib/utils` for utilities) are configured and should be used for consistent imports. See [`components.json`](components.json:0) for details.
* **Styling Approach:** All styling will be handled by **TailwindCSS**, complemented by **shadcn/ui** for pre-built components. Project-specific conventions for their usage are detailed in [`docs/styling-conventions.md`](docs/styling-conventions.md:0).
* **State Management Strategy:**
    * **TanStack React Query:** Used exclusively for managing *server state* (e.g., YouTube playlist data).
    * **Zustand:** Used for managing global *client state* (e.g., UI settings, download queue status).

### Detailed Frontend Directory Structure

```plaintext
src/frontend/
├── components/          # Shared, reusable React components
│   ├── ui/              # Base UI elements from shadcn/ui (e.g., Button, Card, Dialog)
│   └── features/        # Components composed for specific features
│       ├── playlist/    # e.g., PlaylistHeader.tsx, VideoListItem.tsx
│       └── downloads/   # e.g., DownloadQueue.tsx, DownloadItem.tsx
│
├── hooks/               # Custom reusable React hooks (e.g., useHealthCheck.ts)
│
├── lib/                 # Utility functions, constants, and type definitions
│   ├── utils.ts
│   └── types.ts
│
├── pages/               # Top-level page components
│   ├── Dashboard.tsx
│   ├── MyPlaylists.tsx
│   ├── Downloads.tsx
│   ├── History.tsx
│   └── Settings.tsx
│
├── services/            # For handling external API interactions
│   ├── youtubeService.ts # Functions to fetch playlist/video data
│   └── downloadService.ts# Logic for interacting with yt-dlp-wrap
│
├── store/               # Global client-state management with Zustand
│   ├── downloadStore.ts # State for the download queue
│   └── settingsStore.ts # State for user settings (e.g., health check frequency)
│
├── styles/              # Global styles and TailwindCSS configuration
    └── globals.css      # Main CSS file for Tailwind, Shadcn base styles
```

### Component Breakdown & Implementation Details

* **Component Naming Convention:** All component files will use **PascalCase** (e.g., `VideoListItem.tsx`).
* **Template for Component Specification:** All new components will be documented using the following template.
    #### Component: `VideoListItem`
    * **Purpose:** Displays a single video within a playlist.
    * **Props:** `video: Video`, `status: VideoStatus`, `onDownload: (videoId) => void`.
    * **Key UI Elements:** Status dot, thumbnail, title, channel, duration, view count, and a "more options" button.
    * **Accessibility:** Container has `role="listitem"`, button has a descriptive `aria-label`.

### State Management In-Depth

* **Decision Guide:**
    * **React Query:** For all asynchronous server data.
    * **Zustand:** For all global UI state.
    * **`useState`:** For all single-component, non-shared state.
* **Zustand Store Structure:** State will be organized into separate stores ("slices") by domain, such as `settingsStore.ts` and `downloadStore.ts`.

### API Interaction Layer

* **HTTP Client:** A single, configured **Axios instance** in `src/renderer/services/apiClient.ts` will be used for all requests.
* **Service Definitions:** Logic will be separated into service files (e.g., `youtubeService.ts`, `downloadService.ts`) that use the central client.

### Routing Strategy

* **Routing Library:** **React Router** will be used for navigation.
* **Route Definitions:**
| Path | Page Component |
| :--- | :--- |
| `/` | `Dashboard.tsx` |
| `/my-playlists` | `MyPlaylists.tsx` |
| `/downloads` | `Downloads.tsx` |
| `/history` | `History.tsx` |
| `/settings` | `Settings.tsx` |

### Frontend Testing Strategy

* **Component Testing:** Using **Jest** and **React Testing Library** to test components in isolation.
* **End-to-End (E2E) UI Testing:** Using a framework like **Playwright** to test complete user workflows in a simulated Electron environment.

### Build, Bundling, and Deployment

* **Build Process:** Will leverage the built-in scripts from `electron-react-boilerplate` to compile and package the application for distribution.
* **Optimizations:** The build process automatically handles code splitting and minification.

