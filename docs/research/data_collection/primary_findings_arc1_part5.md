# Arc 1: Primary Findings - Database Migration Strategy

## Finding 8: The Need for an External Migration Library

**Source(s):** GitHub (TypeORM Issue), General Node.js Ecosystem Knowledge

**Key Insight:** The `better-sqlite3` library is intentionally minimalist and focuses exclusively on high-performance query execution. It does **not** include a built-in mechanism for managing database schema migrations. Therefore, a separate, dedicated migration library is required to handle schema evolution over the application's lifecycle.

**Paraphrased Summary:**
To manage changes to the SQLite database schema in a robust and automated way, the project must integrate a standalone migration tool. Attempting to manage schema changes manually (e.g., with handwritten `ALTER TABLE` scripts) is error-prone and not scalable.

**Recommended Solution: `node-pg-migrate` (Adapted for SQLite)**

While the name `node-pg-migrate` suggests it is for PostgreSQL, it is a highly respected, powerful, and flexible migration framework in the Node.js ecosystem that can be adapted for use with SQLite. Its core principles are what make it a strong candidate:

1.  **Directional Migrations:** It enforces the creation of separate `up` and `down` migration files. The `up` file applies a new change, and the `down` file perfectly reverts it. This is critical for development and for recovering from failed deployments.
2.  **Timestamped Files:** Migrations are typically timestamped (e.g., `1677628800_create_users_table.js`), which ensures they are always run in the correct, chronological order.
3.  **State Management:** The library automatically creates a special table in the database (e.g., `pgmigrations`) to keep track of which migrations have already been successfully applied, preventing them from being run more than once.

**Implementation Strategy for Playlistify:**

1.  **Integrate a Migration Runner:** A library like `node-pg-migrate` or a similar SQLite-compatible alternative (e.g., `knex` migrations, `db-migrate`) will be added as a development dependency.
2.  **Create a Migration Script:** A script will be added to `package.json` (e.g., `npm run migrate`) that executes the migration runner.
3.  **Application Startup Check:** On application startup, the main process will programmatically trigger the migration runner. The runner will check the `migrations` table, apply any new, pending migrations sequentially, and bring the database schema up to date before the application is fully operational.

This approach solves the knowledge gap by providing a structured, automated, and reliable process for evolving the application's database schema over time without requiring manual intervention from the user or risking data loss.