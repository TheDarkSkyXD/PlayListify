// src/adapters/sqlite-adapter.ts

import sqlite3 from 'sqlite3';
import fs from 'fs';
import { DatabaseConnectionError, SchemaExecutionError, DatabaseError } from '../shared/errors';

export class SQLiteAdapter {
    public db: sqlite3.Database;

    constructor(dbOrPath: string | sqlite3.Database) {
        if (typeof dbOrPath === 'string') {
            this.db = new sqlite3.Database(dbOrPath, (err) => {
                if (err) {
                    throw new DatabaseConnectionError(`Failed to connect to database: ${err.message}`);
                }
            });
        } else {
            this.db = dbOrPath;
        }
    }

    public initializeSchema(callback: (error?: Error) => void): void {
        const schemaPath = (this as any).schemaPath || './schema/database_schema.sql';
        try {
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                this.db.exec(schema, (err) => {
                    if (err) {
                        callback(new SchemaExecutionError(`Failed to execute schema: ${err.message}`));
                    } else {
                        callback();
                    }
                });
            } else {
                callback(); // No schema file, so nothing to do.
            }
        } catch (error) {
            if (error instanceof Error) {
                callback(new SchemaExecutionError(`Failed to execute schema: ${error.message}`));
            } else {
                callback(new SchemaExecutionError('An unknown error occurred during schema execution.'));
            }
        }
    }

    public query(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(new DatabaseError(`Query failed: ${err.message}`));
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public run(sql: string, params: any[] = []): Promise<{ changes: number }> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(new DatabaseError(`Execution failed: ${err.message}`));
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(new DatabaseConnectionError(`Failed to close database: ${err.message}`));
                } else {
                    resolve();
                }
            });
        });
    }
}
