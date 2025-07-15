# Constraints & Anti-Goals

This document outlines the key constraints that the Playlistify project must operate within, and defines its "anti-goals"—things the project is explicitly not trying to be or do. This provides clarity and focus for the development process.

---

## 1. Technical Constraints

| ID          | Constraint                                                              | Justification                                                                                                                                                                                                   |
| :---------- | :---------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-1.1**   | **Platform:** The application must be built using the Electron framework. | This is a foundational requirement to ensure a cross-platform desktop application (Windows, macOS, Linux) can be delivered from a single codebase.                                                                |
| **C-1.2**   | **Core Libraries:** The project must adhere to the defined technology stack. | The tech stack (`React`, `TypeScript`, `TailwindCSS`, `better-sqlite3`, `yt-dlp-wrap`) was chosen for its robustness and suitability for this type of application. Adherence ensures consistency and maintainability. |
| **C-1.3**   | **External Tool Dependency:** The application is dependent on the `yt-dlp` and `ffmpeg` command-line tools. | The core functionality of downloading and processing videos relies on these external tools. The application must manage the installation and execution of these dependencies.                                                |
| **C-1.4**   | **Security Model:** The application must operate within Electron's security model. | The renderer process must be sandboxed (`contextIsolation: true`, `nodeIntegration: false`). All privileged operations (file system access, native OS calls) must be handled by the main process via secure IPC channels. |
| **C-1.5**   | **Offline First (for downloaded content):** The application must be able to play downloaded content without an internet connection. | This is a primary value proposition for the user—the ability to archive and access content offline. The application must not require an internet connection to browse or play already downloaded files.                  |

---

## 2. Project & Scope Constraints

| ID          | Constraint                                                              | Justification                                                                                                                                                                                                   |
| :---------- | :---------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-2.1**   | **No Server-Side Component:** The application must be a self-contained, client-only desktop application. | Playlistify is designed as a personal archiving tool. There is no central server, user account system (beyond local OAuth tokens), or cloud storage component. All user data is stored locally on their machine.       |
| **C-2.2**   | **MVP Scope:** The initial release will not require Google Account authentication. | This simplifies the initial development effort and focuses on delivering the core value proposition of importing and downloading public playlists first. Full account integration is a post-MVP feature.            |

---

## 3. Anti-Goals

Anti-goals are things we are explicitly choosing *not* to do, to avoid scope creep and maintain focus.

| ID          | Anti-Goal                                                                | Justification                                                                                                                                                                                                   |
| :---------- | :----------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AG-1**    | **Not a Video Editing Tool:** The application will not include features for trimming, merging, or otherwise editing video files. | The focus is on archiving and playback, not video production. Adding editing features would massively increase scope and complexity. `ffmpeg` is used only for format conversion and metadata embedding.         |
| **AG-2**    | **Not a Social Platform:** There will be no features for sharing playlists with other users, commenting, or any other social interactions. | Playlistify is a personal tool for managing one's own library. Social features are outside the core vision of user sovereignty over their content.                                                              |
| **AG-3**    | **Not a Content Discovery Platform:** The application will not provide features for discovering new YouTube channels or videos. | Users are expected to discover content on YouTube itself. Playlistify's role begins when the user decides they want to archive that content.                                                                      |
| **AG-4**    | **Not a Live Streaming Client:** The application will not support the viewing or recording of live streams from YouTube. | The technical challenges and legal implications of handling live streams are significant and outside the scope of playlist archiving.                                                                                |
| **AG-5**    | **Not a Mobile Application:** For the foreseeable future, Playlistify is a desktop-only application. | A mobile version would require a completely different architecture (e.g., for data storage, background downloads) and is not part of the current project roadmap.                                                     |