import Database, { RunResult } from 'better-sqlite3';
export declare class SQLiteAdapter {
    db: Database;
    private readonly maxRetries;
    private readonly retryDelay;
    constructor(dbOrPath: string | Database);
    initializeSchema(): void;
    private _executeWithRetries;
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    run(sql: string, params?: any[]): Promise<RunResult>;
    transaction<T>(action: () => T): T;
    close(): void;
}
//# sourceMappingURL=sqlite-adapter.d.ts.map