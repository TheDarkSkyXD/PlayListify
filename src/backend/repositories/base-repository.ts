// src/backend/repositories/base-repository.ts

import { DatabaseError } from '../../shared/errors';
import { SQLiteAdapter } from '../sqlite-adapter';

export abstract class BaseRepository<T, CreateData, UpdateData> {
  protected db: SQLiteAdapter;
  protected tableName: string;

  constructor(db: SQLiteAdapter, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  protected async executeQuery<R>(
    sql: string,
    params: any[] = [],
  ): Promise<R[]> {
    try {
      return await this.db.query<R>(sql, params);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Query failed: ${message}`);
    }
  }

  protected async executeRun(sql: string, params: any[] = []) {
    try {
      return await this.db.run(sql, params);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Operation failed: ${message}`);
    }
  }

  abstract create(data: CreateData): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract update(id: string, data: UpdateData): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;
}
