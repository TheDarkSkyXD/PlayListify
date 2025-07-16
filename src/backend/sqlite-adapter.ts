// src/adapters/sqlite-adapter.ts

import Database, { RunResult } from 'better-sqlite3';
import fs from 'fs';
import {
  DatabaseConnectionError,
  SchemaExecutionError,
} from '../shared/errors';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class SQLiteAdapter {
  public db: Database;
  private readonly maxRetries = 3;
  private readonly retryDelay = 50;

  constructor(dbOrPath: string | Database) {
    try {
      if (typeof dbOrPath === 'string') {
        this.db = new (Database as any)(dbOrPath);
      } else {
        this.db = dbOrPath;
      }
      this.db.pragma('journal_mode = WAL');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new DatabaseConnectionError(
        `Failed to connect to database: ${message}`,
      );
    }
  }

  public initializeSchema(): void {
    const schemaPath = './src/backend/schema/database_schema.sql';
    try {
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        this.db.exec(schema);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new SchemaExecutionError(`Failed to execute schema: ${message}`);
    }
  }

  private async _executeWithRetries<T>(operation: () => T): Promise<T> {
    let attempts = 0;
    while (true) {
      try {
        return operation();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (
          (message.includes('SQLITE_BUSY') ||
            message.includes('SQLITE_LOCKED')) &&
          attempts < this.maxRetries
        ) {
          attempts++;
          await delay(this.retryDelay);
        } else {
          throw err;
        }
      }
    }
  }

  public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const operation = () => this.db.prepare(sql).all(...params) as T[];
    return this._executeWithRetries(operation);
  }

  public async run(sql: string, params: any[] = []): Promise<RunResult> {
    const operation = () => this.db.prepare(sql).run(...params);
    return this._executeWithRetries(operation);
  }

  public transaction<T>(action: () => T): T {
    if (this.db.inTransaction) {
      return action();
    }
    const transaction = this.db.transaction(action);
    return transaction();
  }

  public close(): void {
    try {
      this.db.close();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new DatabaseConnectionError(`Failed to close database: ${message}`);
    }
  }
}
