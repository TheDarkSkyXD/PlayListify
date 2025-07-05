# Arc 2: Secondary Findings - `yt-dlp` Command Sources

This document contains the direct URLs for the sources used to generate the primary findings related to `yt-dlp` command-line arguments.

1.  **GitHub - yt-dlp/yt-dlp: A feature-rich command-line audio/video downloader**
    *   URL: https://github.com/yt-dlp/yt-dlp
    *   Relevance: The official source code repository and documentation. It is the ultimate authority on all available commands and, crucially, lists the external dependencies like `mutagen` and `AtomicParsley` that are required for features like embedding thumbnails in MP4 files.

2.  **How to Use YT-DLP: Guide and Commands (2025)**
    *   URL: https://www.rapidseedbox.com/blog/yt-dlp-complete-guide
    *   Relevance: Provides a practical guide with command examples, including a good example of a format selector with a fallback, which directly informed the recommended format selection string.

3.  **Yt-dlp Commands: The Complete Tutorial For Beginners (2025) - OSTechNix**
    *   URL: https://ostechnix.com/yt-dlp-tutorial/
    *   Relevance: A clear tutorial that demonstrates the use of multiple `--write-*` flags together (`--write-description`, `--write-info-json`, `--write-thumbnail`), confirming the pattern for comprehensive data extraction.

4.  **r/DataHoarder on Reddit: TIL about yt-dlp's amazing --embed-metadata flag...**
    *   URL: https://www.reddit.com/r/DataHoarder/comments/13tnkn0/til_about_ytdlps_amazing_embedmetadata_flag_what/
    *   Relevance: A community discussion that underscores the importance and utility of the `--embed-metadata` flag for creating portable, self-contained media files, which is a key goal for the Playlistify application.

5.  **yt-dlp(1) — Arch manual pages**
    *   URL: https://man.archlinux.org/man/extra/yt-dlp/yt-dlp.1.en
    *   Relevance: A formal man page that provides concise, technical descriptions of flags and confirms the default behavior and dependencies for thumbnail embedding, lending additional authority to the findings from the GitHub page.
6.  **p-queue - npm**
    *   URL: https://www.npmjs.com/package/p-queue
    *   Relevance: The official package page, providing the canonical source for installation and basic usage, including the core concepts of concurrency and queue lifecycle methods like `.start()` and `.pause()`.

7.  **GitHub - sindresorhus/p-queue: Promise queue with concurrency control**
    *   URL: https://github.com/sindresorhus/p-queue
    *   Relevance: The official source code repository. The documentation here is the most detailed and authoritative, providing examples and clarifying advanced usage, including the `priority` option.

8.  **Python Stacks, Queues, and Priority Queues in Practice – Real Python**
    *   URL: https://realpython.com/queue-in-python/
    *   Relevance: While focused on Python, this article provides an excellent conceptual overview of how priority queues work, which is directly applicable to understanding the `priority` option in `p-queue`.

9.  **What is Priority Queue | Introduction to Priority Queue - GeeksforGeeks**
    *   URL: https://www.geeksforgeeks.org/priority-queue-set-1-introduction/
    *   Relevance: A foundational computer science article explaining the theory behind priority queues, reinforcing the logic for using them to handle user-initiated tasks ahead of background tasks.