# ADR-003: Mitigating `yt-dlp` Dependency Risk

*   **Status:** Proposed
*   **Date:** 2025-07-05
*   **Deciders:** Architectural Review Team

## Context and Problem Statement

The application's ability to fetch video and playlist metadata is currently tightly coupled to the `yt-dlp-wrap` library, which is a wrapper around the `yt-dlp` command-line tool. While powerful, this dependency presents a significant risk: `yt-dlp` frequently requires updates to adapt to changes in YouTube's internal API. If `yt-dlp` breaks or is not updated promptly, core features of Playlistify, such as importing playlists and refreshing video metadata, will fail. This tight coupling makes it difficult to adapt to such breakages or to consider alternative data sources in the future.

## Decision Drivers

*   **Dependency Fragility:** The primary driver is to reduce the system's reliance on a single, volatile external tool.
*   **Maintainability:** The architecture should allow for swapping out the video metadata source without requiring a major refactoring of the application's core logic.
*   **Future-Proofing:** We may want to support other video platforms (e.g., Vimeo) or use a formal API (like the YouTube Data API) in the future. The current design makes this difficult.

## Considered Options

1.  **Do Nothing:** Continue with the tight coupling. This is the simplest option but carries the highest risk.
2.  **Introduce a `VideoSource` Interface:** Define an abstract interface that dictates the contract for fetching video and playlist metadata. The `YoutubeService` would become one implementation of this interface, using `yt-dlp`.
3.  **Build a More Complex Adapter:** Add more error handling and fallback logic directly within the `YoutubeService`. This would add complexity without solving the core coupling issue.

## Decision Outcome

**Chosen Option:** Option 2, "Introduce a `VideoSource` Interface."

This is the preferred solution because it directly addresses the tight coupling by applying the Dependency Inversion Principle.

### Justification

By creating a `VideoSource` interface, we decouple the `PlaylistManager` and other high-level services from the specific implementation details of `yt-dlp`.

The interface will define methods like:
*   `getPlaylistMetadata(url: string): Promise<Playlist>`
*   `getVideoMetadata(videoId: string): Promise<Video>`
*   `getBatchVideoMetadata(videoIds: string[]): Promise<Video[]>`

The existing `YoutubeService` will be refactored to implement this interface. All other components will depend on the `VideoSource` abstraction, not the concrete `YoutubeService`.

This architectural change provides several key benefits:
*   **Risk Mitigation:** If `yt-dlp` fails, we can create a new `VimeoService` or `YouTubeApiDataService` that implements the same `VideoSource` interface and swap it in with minimal disruption.
*   **Testability:** We can easily create a `MockVideoSource` for testing purposes, allowing us to simulate various scenarios (e.g., API failures, different metadata responses) without making actual network calls.
*   **Extensibility:** Adding new video sources in the future becomes a straightforward task of creating a new class that adheres to the `VideoSource` contract.