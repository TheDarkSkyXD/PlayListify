import sqlite3 from 'sqlite3';
import { promisify } from 'util';

// This adapter creates a better-sqlite3 compatible interface using sqlite3
// It's a temporary solution to avoid native module build issues

class Statement {
  private stmt: sqlite3.Statement;

  constructor(stmt: sqlite3.Statement) {
    this.stmt = stmt;
  }

  run(...params: any[]) {
    return new Promise<{ lastInsertRowid?: number, changes?: number }>((resolve, reject) => {
      this.stmt.run(...params, function(this: {lastID: number, changes: number}, err: Error | null) {
        if (err) reject(err);
        resolve({ 
          lastInsertRowid: this.lastID, 
          changes: this.changes 
        });
      });
    });
  }

  get(...params: any[]) {
    return new Promise<any>((resolve, reject) => {
      this.stmt.get(...params, (err: Error | null, row: any) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  all(...params: any[]) {
    return new Promise<any[]>((resolve, reject) => {
      this.stmt.all(...params, (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }
}

class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
  }

  pragma(statement: string) {
    return new Promise<any>((resolve, reject) => {
      this.db.get(`PRAGMA ${statement}`, (err: Error | null, row: any) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  prepare(sql: string): Statement {
    const stmt = this.db.prepare(sql);
    return new Statement(stmt);
  }

  exec(sql: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.exec(sql, (err: Error | null) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.close((err: Error | null) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}

export default Database; 