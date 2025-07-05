# ADR-002: Packaged External Dependencies

**Date:** 2025-07-04

**Status:** Accepted

## Context

The Playlistify application relies on external command-line tools, specifically `yt-dlp` for downloading and `ffmpeg` for media processing. The application's core functionality is critically dependent on the presence and correct functioning of these tools.

## Decision

We will **package specific, tested versions of `yt-dlp` and `ffmpeg` directly within the application installer** for all supported platforms (Windows, macOS, Linux). The application will be hard-coded to use these bundled binaries exclusively, ignoring any system-wide installations the user might have.

## Rationale

-   **Reliability & Stability:** Relying on a user's system-installed version of these tools introduces significant risk. The user might not have them installed, or they might have an incompatible or broken version. Bundling them guarantees that the application always runs with a known, tested, and stable version of its critical dependencies.
-   **Simplified User Experience:** This decision completely removes the burden of dependency installation from the user. The application will work "out of the box" after installation, with no need for the user to follow complex setup instructions or install third-party software.
-   **Consistency:** It ensures a consistent environment across all users and platforms, making debugging and support significantly easier. We can rule out "wrong dependency version" as a class of user-reported bugs.
-   **Security:** It prevents the application from accidentally executing a potentially malicious or compromised version of a tool that might exist in the user's system `PATH`.

## Consequences

-   **Increased Application Size:** Bundling these binaries will increase the final size of the application installer and the on-disk footprint. This is a necessary trade-off for the significant gains in reliability and user experience.
-   **Update Responsibility:** We, the developers, become responsible for keeping the bundled dependencies updated, especially to patch security vulnerabilities or to keep up with changes in YouTube's platform that `yt-dlp` addresses. This will be managed as part of our regular maintenance and release cycle.