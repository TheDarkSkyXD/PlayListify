# ADR-002: Bundling External CLI Dependencies with the Application

*   **Status:** Accepted
*   **Date:** 2025-07-05
*   **Deciders:** Playlistify Development Team

## Context and Problem Statement

Playlistify relies on the `yt-dlp` command-line tool to function. This dependency is not an npm package but a standalone executable. We need to decide how to manage this dependency to ensure the application works reliably for all users on all supported platforms (Windows, macOS, Linux).

## Decision Drivers

*   **User Experience:** The installation and setup process should be as seamless as possible. Users should not be required to perform complex manual setup steps.
*   **Reliability & Consistency:** The application must use a specific, tested version of `yt-dlp`. Allowing users to provide their own version could lead to unpredictable behavior and bugs due to breaking changes in the dependency.
*   **Maintainability:** The process for updating the dependency should be straightforward for the development team.
*   **Cross-Platform Support:** The solution must work across all target operating systems.

## Considered Options

1.  **Require Manual Installation:** Document that users must install `yt-dlp` themselves and ensure it is available in their system's `PATH`. The application would then attempt to call `yt-dlp` from the `PATH`.
2.  **Bundle the Dependency:** Package the `yt-dlp` executables for all supported platforms directly within the Electron application. The application would then use the bundled executable, ignoring any system-wide installation.
3.  **Automatic Downloader:** Build a feature into the application that automatically downloads the latest version of `yt-dlp` on first run.

## Decision Outcome

**Chosen Option:** **Bundle the Dependency.**

We will package the pre-compiled `yt-dlp` executables for Windows (`yt-dlp.exe`), macOS (`yt-dlp_macos`), and Linux (`yt-dlp_linux`) inside the application bundle. The `yt-dlp-wrap` library will be configured to point to the path of these bundled executables.

### Positive Consequences

*   **Zero-Configuration for Users:** This is the most significant benefit. Users can download and run Playlistify without any additional setup steps. The application is self-contained and "just works."
*   **Guaranteed Version Compatibility:** By bundling a specific version of `yt-dlp`, we eliminate an entire class of potential bugs. We can test our application against this exact version and be confident that it will behave as expected for all users.
*   **Offline Installation:** The application can be installed and run on a machine without an internet connection (though it would not be able to fetch new playlist data, of course).
*   **No `PATH` Conflicts:** The application does not rely on or interfere with the user's system `PATH` environment variable, avoiding potential conflicts with other software.

### Negative Consequences (Trade-offs)

*   **Increased Application Size:** The primary drawback is that the application's final distributable size will be larger because it includes the executables for all three platforms. This is a reasonable trade-off for the significant improvement in user experience and reliability.
*   **Manual Update Process:** To update `yt-dlp`, developers will need to manually download the new executables and replace the old ones in the source tree before building a new release of Playlistify. This is a minor process overhead that is acceptable for the control it provides.
*   **Security Responsibility:** We are responsible for shipping a secure version of the dependency. If a vulnerability is found in `yt-dlp`, we must release a new version of Playlistify with the patched executable. This is a standard responsibility when bundling dependencies.