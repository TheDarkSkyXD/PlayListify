# Information Sources

This document outlines the primary and secondary sources of information that will be leveraged throughout the research process.

## 1. Primary Information Sources

These sources will provide the foundational technical data and established best practices.

*   **AI-Powered Search Tool (`brave search`):** This will be the main tool for executing precision queries based on the key questions defined for each research arc. It will be used to find technical articles, blog posts from engineers, and official documentation.
*   **Official Documentation:**
    *   **SQLite:** The official documentation for SQLite, particularly sections on performance, transactions, and the Write-Ahead Log (WAL).
    *   **Electron:** Documentation related to application lifecycle, inter-process communication (IPC), and performance best practices.
    *   **Node.js:** Documentation for `worker_threads` and file system (`fs`) modules.
    *   **`better-sqlite3`:** The library's documentation for transaction management and performance tuning.
    *   **`p-queue`:** The library's documentation for queue management and concurrency control.
*   **Academic Papers & Journals:** Sources like ACM Digital Library and IEEE Xplore will be queried for papers on task scheduling, database transaction management, and concurrency control in single-machine environments.

## 2. Secondary Information Sources

These sources will provide context, real-world examples, and alternative perspectives.

*   **Engineering Blogs:** Blogs from companies that have built and scaled similar systems (even if in different contexts) can provide valuable insights into practical challenges and solutions.
*   **Stack Overflow & Community Forums:** Searching for discussions related to SQLite performance, Electron app resilience, and Node.js concurrency will provide context on common problems and community-vetted solutions.
*   **Open-Source Project Analysis:** Reviewing the source code of established open-source desktop applications that manage background tasks (e.g., video converters, file synchronizers) can reveal proven architectural patterns.