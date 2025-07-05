# Arc 1: Primary Findings - Metadata Storage Strategy

## Finding 7: SQLite as the Definitive Source of Truth

**Source(s):** Stack Overflow, SQLite User Forum, Qt Forum, Reddit (r/datacurator, r/DataHoarder)

**Key Insight:** For an application requiring robust querying, data relationships, and frequent reads/updates, using a dedicated database like SQLite is unequivocally superior to file-based systems like JSON sidecar files or embedded ID3 tags for managing core metadata.

**Paraphrased Summary:**
The knowledge gap regarding the optimal metadata storage strategy is resolved with a strong recommendation to use the **SQLite database as the single, authoritative source of truth**.

*   **Performance:** For querying and filtering data (e.g., "find all videos by this author," "show me playlists updated in the last week"), SQLite is orders of magnitude faster than parsing a directory of JSON files. The overhead of reading and parsing hundreds or thousands of individual text files presents a significant and unnecessary performance bottleneck.

*   **Data Integrity and Relationships:** SQLite, with foreign key constraints enabled, can enforce relationships between entities (playlists, videos). This is impossible to do reliably with file-based methods. A database ensures that the application doesn't have orphaned records or inconsistent data.

*   **Querying Complexity:** SQLite provides a powerful and standard query language (SQL) to perform complex data retrieval. Replicating this functionality with file-based storage would require building a complex, in-memory query engine, effectively reinventing the core purpose of a database.

*   **Portability and Standardization:** While embedded tags (like ID3) and sidecar files seem portable, in practice they suffer from a lack of standardization across different software and operating systems. This makes them brittle and unreliable for application-critical data. SQLite, however, provides a single, portable database file with a well-defined structure, ensuring data consistency wherever the file is moved.

**Conclusion:**
JSON sidecar files and embedded ID3 tags should be considered only for **export or interoperability features**, where the goal is to share data with other systems. For the internal operation, state management, and core logic of the Playlistify application, **all metadata must be stored and managed within the SQLite database.** This aligns with the established pattern of decoupling metadata from storage and is the most performant, reliable, and scalable solution.