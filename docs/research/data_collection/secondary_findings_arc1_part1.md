# Arc 1: Secondary Findings - Database Schema Sources

This document contains the direct URLs for the sources used to generate the primary findings related to database schema design.

1.  **SQLite Sample Database And Its Diagram (in PDF format)**
    *   URL: https://www.sqlitetutorial.net/sqlite-sample-database/
    *   Relevance: Provides a clear example of a many-to-many relationship using a junction table (`playlist_track`) in a media context, which is directly applicable to the Playlistify schema.

2.  **php - Database Design for Video-DB with Playlists - Stack Overflow**
    *   URL: https://stackoverflow.com/questions/10123267/database-design-for-video-db-with-playlists
    *   Relevance: A community-discussed example of a database schema for a video playlist application, reinforcing the junction table model.

3.  **Database Design for Spotify.. | by Ayush Dixit | Towards Data Engineering | Medium**
    *   URL: https://medium.com/towards-data-engineering/design-the-database-for-a-system-like-spotify-95ffd1fb5927
    *   Relevance: Describes the database design for a major music streaming service, confirming the industry-standard use of one-to-many and many-to-many relationship models for users, playlists, and tracks.

4.  **SQLite - Create a Relationship**
    *   URL: https://www.quackit.com/sqlite/tutorial/create_a_relationship.cfm
    *   Relevance: Highlights the critical and often overlooked detail that SQLite requires `PRAGMA foreign_keys = ON;` to be executed to enforce data integrity, which is a crucial implementation detail.

5.  **How To Create Many-to-Many Relationships in SQL**
    *   URL: https://five.co/blog/how-to-create-many-to-many-relationships-in-sql/
    *   Relevance: A general tutorial on the concept of many-to-many relationships in SQL, providing foundational knowledge that supports the specific schema design choices.
6.  **The SQLite Query Optimizer Overview**
    *   URL: https://www.sqlite.org/optoverview.html
    *   Relevance: Provides authoritative, low-level details on how the SQLite query planner works, which is essential for writing high-performance queries and understanding when and why indexes are used.

7.  **SQLite Optimizations for Ultra High-Performance**
    *   URL: https://www.powersync.com/blog/sqlite-optimizations-for-ultra-high-performance
    *   Relevance: Discusses the performance trade-offs of using indexes, specifically quantifying the potential slowdown on insert operations. This informs the need for a balanced indexing strategy.

8.  **Squeezing Performance from SQLite: Indexes? Indexes! | by Jason Feinstein | Medium**
    *   URL: https://medium.com/@JasonWyatt/squeezing-performance-from-sqlite-indexes-indexes-c4e175f3c346
    *   Relevance: A practical guide to understanding and using indexes in SQLite to improve query performance.

9.  **Best practices for SQLite performance | App quality | Android Developers**
    *   URL: https://developer.android.com/topic/performance/sqlite-performance-best-practices
    *   Relevance: While Android-specific, this official documentation provides general best practices for SQLite that are universally applicable, such as designing the schema for performance and proper indexing.

10. **performance - Why is this sqlite query much slower when I index the columns? - Database Administrators Stack Exchange**
    *   URL: https://dba.stackexchange.com/questions/150858/why-is-this-sqlite-query-much-slower-when-i-index-the-columns
    *   Relevance: Provides a real-world example of how improper indexing or query structure can lead to performance degradation, highlighting the importance of testing and using `EXPLAIN QUERY PLAN`.
11. **Stay organized with 6 file storage best practices | TechTarget**
    *   URL: https://www.techtarget.com/searchstorage/tip/Stay-organized-with-6-file-storage-best-practices
    *   Relevance: Emphasizes the importance of a consistent naming structure for locating files, which is a core principle for the user-facing directory structure.

12. **How to organize files and folders | Zapier**
    *   URL: https://zapier.com/blog/organize-files-folders/
    *   Relevance: Introduces the concept of using a tagging system in addition to folder structures, which is analogous to using a database to manage metadata independently of the file system location.

13. **Folder Structure Best Practices for Businesses**
    *   URL: https://www.suitefiles.com/guides/folder-structures-guide/
    *   Relevance: Provides general best practices for folder hierarchies and naming, reinforcing the need for a well-planned and consistent approach.

14. **php - Tips for managing a large number of files? - Stack Overflow**
    *   URL: https://stackoverflow.com/questions/671260/tips-for-managing-a-large-number-of-files
    *   Relevance: Provides the most direct and technical solution for avoiding file system bottlenecks by creating a nested directory structure based on pieces of the filename/ID. This is the core insight for the internal storage strategy.
15. **r/datacurator on Reddit: Standard for metadata sidecar files like .metadata.json?**
    *   URL: https://www.reddit.com/r/datacurator/comments/nrcwce/standard_for_metadata_sidecar_files_like/
    *   Relevance: Highlights the key weakness of sidecar files—the lack of a recognized standard, which makes them unsuitable for primary application data.

16. **performance - JSON file VS SQLite android - Stack Overflow**
    *   URL: https://stackoverflow.com/questions/8652005/json-file-vs-sqlite-android
    *   Relevance: Provides a direct comparison in a mobile context (which has similar constraints to a desktop app), strongly favoring SQLite for performance and querying capabilities over parsing JSON files.

17. **SQLite User Forum: Flat files vs SQLite**
    *   URL: https://sqlite.org/forum/forumpost/3d7be1ad3d?t=c
    *   Relevance: A discussion on the official SQLite forum that confirms a database is the superior choice for managing structured data with relationships, compared to flat files.

18. **r/DataHoarder on Reddit: Best practices around cross-platform, software-independent tags or metadata?**
    *   URL: https://www.reddit.com/r/DataHoarder/comments/9yul31/best_practices_around_crossplatform/
    *   Relevance: Discusses the significant challenges of using embedded file tags for cross-platform, application-independent metadata, reinforcing the decision to avoid this for core application logic.

19. **Should I manage my data in-memory or use SQLite? | Qt Forum**
    *   URL: https://forum.qt.io/topic/98095/should-i-manage-my-data-in-memory-or-use-sqlite
    *   Relevance: A developer discussion that concludes using SQLite is preferable to managing data in memory and saving to files, as it avoids reinventing database functionality and provides more robust data management.
20. **A Step-by-Step Guide to Integrating Better-SQLite3 with Electron JS App Using Create-React-App - DEV Community**
    *   URL: https://dev.to/arindam1997007/a-step-by-step-guide-to-integrating-better-sqlite3-with-electron-js-app-using-create-react-app-3k16
    *   Relevance: Shows a complete integration of `better-sqlite3` in an Electron context, but notably lacks a discussion of schema migrations, implicitly confirming that this is a separate concern the developer must solve.

21. **Electron Database - Storage adapters for SQLite, Filesystem and In-Memory | RxDB - JavaScript Database**
    *   URL: https://rxdb.info/electron-database.html
    *   Relevance: Mentions `better-sqlite3` as a high-performance storage option but within the context of a larger database framework (RxDB), which handles its own migrations. This reinforces the idea that a higher-level tool is needed to manage schema changes.

22. **Running migration tool with electron interpreter in node mode · Issue #8341 · typeorm/typeorm**
    *   URL: https://github.com/typeorm/typeorm/issues/8341
    *   Relevance: A direct example of a developer trying to use a migration tool (from the TypeORM library) with `better-sqlite3` in an Electron environment. This is a strong signal that using an external, established migration tool is the standard and expected pattern.
23. **How to improve bulk insert speed in SQLite | PDQ**
    *   URL: https://www.pdq.com/blog/improving-bulk-insert-speed-in-sqlite-a-comparison-of-transactions/
    *   Relevance: Provides a clear, practical demonstration of the massive speed difference between individual inserts and wrapping them in a transaction.

24. **Squeezing Performance from SQLite: Insertions | by Jason Feinstein | Medium**
    *   URL: https://medium.com/@JasonWyatt/squeezing-performance-from-sqlite-insertions-971aff98eef2
    *   Relevance: Explains the underlying reason for the performance difference: SQLite's default "autocommit" behavior for any command that changes the database.

25. **c - Improve INSERT-per-second performance of SQLite - Stack Overflow**
    *   URL: https://stackoverflow.com/questions/1711631/improve-insert-per-second-performance-of-sqlite
    *   Relevance: A widely-referenced community discussion that confirms transactions are the primary method for improving bulk insert performance in SQLite.

26. **SQLite bulk INSERT benchmarking and optimization**
    *   URL: https://zerowidthjoiner.net/2021/02/21/sqlite-bulk-insert-benchmarking-and-optimization
    *   Relevance: A direct and forceful statement that wrapping multiple `INSERTs` in a single transaction is the first and most important answer to SQLite INSERT performance questions.