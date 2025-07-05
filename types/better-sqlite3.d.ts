// types/better-sqlite3.d.ts

declare module 'better-sqlite3' {
  export interface RunResult {
    changes: number;
    lastInsertRowid: number;
  }

  interface Database {
    exec(sql: string): void;
    prepare(sql: string): Statement;
    close(): void;
    pragma(source: string, options?: { simple: boolean }): any;
    transaction<T>(fn: (...args: any[]) => T): (...args: any[]) => T;
    inTransaction: boolean;
  }

  interface Statement {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }

  interface DatabaseConstructor {
    new (filename: string): Database;
  }

  const Database: DatabaseConstructor;
  export = Database;
}
