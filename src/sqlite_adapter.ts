import sqlite3, { Database } from 'sqlite3';
import { ArgumentException, DatabaseConnectionError, SchemaExecutionError } from './exceptions';
import path from 'path';
import fs from 'fs';

export function IS_VALID_PATH(pathString: string): boolean {
    if (!pathString || pathString.length === 0) {
        return false;
    }

    // Check for invalid characters
    const invalidChars = /[\\:*?"<>|]/;
    return !invalidChars.test(pathString);
}

export class SQLiteAdapter {
    dbPath: string;
    schemaPath: string;
    maxRetries: number;
    retryIntervalMs: number;
    db: Database | null;
    isConnected: boolean;
    connectionCheckIntervalMs: number;
    queryTimeoutMs: number;
    private connectionCheckInterval: NodeJS.Timeout | null = null;

    constructor(dbPath: string, schemaPath?: string, maxRetries?: number, retryIntervalMs?: number,
        connectionCheckIntervalMs?: number, queryTimeoutMs?: number) {
        if (!dbPath) {
            throw new ArgumentException('Database path cannot be null or empty.');
        }

        if (!IS_VALID_PATH(dbPath)) {
            throw new ArgumentException('Database path is not a valid path.');
        }

        this.dbPath = dbPath;
        this.schemaPath = schemaPath || 'schema/database_schema.sql';
        this.maxRetries = maxRetries || 5;
        this.retryIntervalMs = retryIntervalMs || 1000;
        this.connectionCheckIntervalMs = connectionCheckIntervalMs || 5000;
        this.queryTimeoutMs = queryTimeoutMs || 30000;
        this.db = null;
        this.isConnected = false;

        this.initializeConnection();
    }

    private initializeConnection(): void {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                throw new DatabaseConnectionError(`Failed to connect to database: ${err.message}`);
            }
        });
        this.isConnected = true;

        if (this.schemaPath) {
            try {
                const schema = READ_FILE(this.schemaPath);
                if (schema && schema.trim()) {
                    MANAGE_TRANSACTION(this.db, 'begin');
                    try {
                        EXECUTE_SQL(this.db, schema);
                        MANAGE_TRANSACTION(this.db, 'commit');
                    } catch (e) {
                        MANAGE_TRANSACTION(this.db, 'rollback');
                        throw new SchemaExecutionError('Schema execution failed');
                    }
                }
            } catch (fileError) {
                // Schema file not found or not readable, continue without schema
                console.warn(`Schema file ${this.schemaPath} not found or not readable`);
            }
        }

        this.connectionCheckInterval = SET_INTERVAL(() => {
            this.CHECK_DATABASE_CONNECTION();
        }, this.connectionCheckIntervalMs);
    }

    async query(sql: string, params: any[]): Promise<any[]> {
        if (!sql) {
            throw new ArgumentException('SQL cannot be null or empty.');
        }

        return new Promise((resolve, reject) => {
            const statement = this.db!.prepare(sql);
            statement.bind(...params);
            statement.all((err: any, rows: any[]) => {
                statement.finalize();
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    private CHECK_DATABASE_CONNECTION(): void {
        // Implementation for checking database connection
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connectionCheckInterval) {
                clearInterval(this.connectionCheckInterval);
                this.connectionCheckInterval = null;
            }

            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        return reject(new DatabaseConnectionError(`Failed to close database: ${err.message}`));
                    }
                    this.db = null;
                    this.isConnected = false;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

export function READ_FILE(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
}

export function EXECUTE_SQL(db: any, sql: string): void {
    db.serialize(() => {
        db.run(sql);
    });
}

export function MANAGE_TRANSACTION(db: any, action: string): void {
    if (action === 'begin') {
        db.run('BEGIN TRANSACTION');
    } else if (action === 'commit') {
        db.run('COMMIT');
    } else if (action === 'rollback') {
        db.run('ROLLBACK');
    }
}

export function SET_INTERVAL(callback: Function, intervalMs: number): any {
    return setInterval(callback, intervalMs);
}

export function LOG(message: string, level: string): void {
    console.log(`[${level}] ${message}`);
}

export function PREPARE_STATEMENT(db: any, sql: string): any {
    return db.prepare(sql);
}

export function BIND_PARAMETERS(statement: any, params: any[]): void {
    statement.bind(...params);
}

export function EXECUTE_STATEMENT(statement: any): any {
    return new Promise((resolve, reject) => {
        statement.all((err: any, rows: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

export function PROCESS_RESULT(result: any): any[] {
    return result || [];
}

export function FINALIZE_STATEMENT(statement: any): void {
    statement.finalize();
}

export function MANAGE_TIMER(timerId: any, action: string, callback: Function, delayMs: number): any {
    if (action === 'set') {
        return setTimeout(callback, delayMs);
    } else if (action === 'clear' && timerId) {
        clearTimeout(timerId);
    }
}

export function ABORT_QUERY(db: any, statement: any): void {
    if (statement && statement.finalize) {
        statement.finalize();
    }
}

export function CONNECT_TO_DATABASE(dbPath: string, maxRetries: number, retryIntervalMs: number): Promise<Database> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(new DatabaseConnectionError(`Failed to connect to database: ${err.message}`));
            } else {
                resolve(db);
            }
        });
    });
}
