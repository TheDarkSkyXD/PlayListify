import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import logger from '../services/logService';

// This adapter creates a better-sqlite3 compatible interface using sqlite3
// It's a temporary solution to avoid native module build issues

class Statement {
  private stmt: sqlite3.Statement;
  private finalized: boolean = false;
  private db: Database;

  constructor(stmt: sqlite3.Statement, db: Database) {
    this.stmt = stmt;
    this.db = db;
    
    // Add this statement to the database's active statements tracking
    this.db.trackStatement(this);
  }

  run(...params: any[]) {
    if (this.finalized) {
      return Promise.reject(new Error('Statement already finalized'));
    }
    
    return new Promise<{ lastInsertRowid?: number, changes?: number }>((resolve, reject) => {
      this.stmt.run(...params, function(this: {lastID: number, changes: number}, err: Error | null) {
        if (err) {
          logger.error(`Statement run error: ${err.message}`);
          reject(err);
        } else {
          resolve({ 
            lastInsertRowid: this.lastID, 
            changes: this.changes 
          });
        }
      });
    });
  }

  get(...params: any[]) {
    if (this.finalized) {
      return Promise.reject(new Error('Statement already finalized'));
    }
    
    return new Promise<any>((resolve, reject) => {
      this.stmt.get(...params, (err: Error | null, row: any) => {
        if (err) {
          logger.error(`Statement get error: ${err.message}`);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(...params: any[]) {
    if (this.finalized) {
      return Promise.reject(new Error('Statement already finalized'));
    }
    
    return new Promise<any[]>((resolve, reject) => {
      this.stmt.all(...params, (err: Error | null, rows: any[]) => {
        if (err) {
          logger.error(`Statement all error: ${err.message}`);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Finalize the statement to release resources
  finalize(): Promise<void> {
    if (this.finalized) {
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve, reject) => {
      this.stmt.finalize((err: Error | null) => {
        if (err) {
          logger.error(`Statement finalize error: ${err.message}`);
          reject(err);
        } else {
          this.finalized = true;
          // Remove from tracked statements when finalized
          this.db.untrackStatement(this);
          resolve();
        }
      });
    });
  }
}

class Database {
  private db: sqlite3.Database;
  private activeStatements: Set<Statement> = new Set();
  private isClosing: boolean = false;
  private transactionDepth: number = 0;

  constructor(dbPath: string) {
    // Configure sqlite3 with busy timeout to avoid SQLITE_BUSY errors
    // Wait up to 30 seconds (30000 ms) for locks to be released - increased from 10s
    this.db = new sqlite3.Database(dbPath);
    this.db.configure('busyTimeout', 30000);
    
    // Enable foreign keys
    this.db.exec('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        logger.error('Failed to enable foreign keys:', err);
      } else {
        logger.debug('Foreign keys enabled');
      }
    });
    
    // Set journal mode to WAL for better concurrency
    this.db.exec('PRAGMA journal_mode = WAL', (err) => {
      if (err) {
        logger.error('Failed to set journal mode to WAL:', err);
      } else {
        logger.debug('Journal mode set to WAL');
      }
    });
    
    logger.info(`Database opened: ${dbPath} with 30s busy timeout and WAL mode`);
  }

  pragma(statement: string) {
    return new Promise<any>((resolve, reject) => {
      this.db.get(`PRAGMA ${statement}`, (err: Error | null, row: any) => {
        if (err) {
          logger.error(`PRAGMA error: ${err.message}`);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  prepare(sql: string): Statement {
    if (this.isClosing) {
      throw new Error('Cannot prepare statement on closing database');
    }
    
    try {
      const stmt = this.db.prepare(sql);
      const statementObj = new Statement(stmt, this);
      return statementObj;
    } catch (error) {
      logger.error(`Error preparing statement: ${sql}`, error);
      throw error;
    }
  }

  exec(sql: string): Promise<void> {
    if (this.isClosing) {
      return Promise.reject(new Error('Cannot execute SQL on closing database'));
    }
    
    return new Promise<void>((resolve, reject) => {
      this.db.exec(sql, (err: Error | null) => {
        if (err) {
          logger.error(`Error executing SQL: ${err.message}`);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Track a statement for cleanup during close
  trackStatement(statement: Statement): void {
    this.activeStatements.add(statement);
    logger.debug(`Statement tracked. Total active: ${this.activeStatements.size}`);
  }

  // Remove a statement from tracking
  untrackStatement(statement: Statement): void {
    this.activeStatements.delete(statement);
    logger.debug(`Statement untracked. Total active: ${this.activeStatements.size}`);
  }
  
  // Add a transaction method to properly handle atomic operations
  async transaction<T>(callback: (db: Database) => Promise<T>): Promise<T> {
    if (this.isClosing) {
      return Promise.reject(new Error('Cannot start transaction on closing database'));
    }
    
    // Nested transaction support
    const isOutermostTransaction = this.transactionDepth === 0;
    this.transactionDepth++;
    
    try {
      // Only begin transaction at the outermost level
      if (isOutermostTransaction) {
        await this.exec('BEGIN TRANSACTION');
        logger.debug('Transaction started');
      } else {
        logger.debug(`Nested transaction at depth ${this.transactionDepth}`);
      }
      
      // Execute the callback
      const result = await callback(this);
      
      // Commit transaction only at the outermost level
      if (isOutermostTransaction) {
        await this.exec('COMMIT');
        logger.debug('Transaction committed');
      }
      
      return result;
    } catch (error) {
      // If there's an error, roll back the transaction (only at outermost level)
      if (isOutermostTransaction) {
        try {
          await this.exec('ROLLBACK');
          logger.debug('Transaction rolled back due to error');
        } catch (rollbackError) {
          logger.error('Error rolling back transaction:', rollbackError);
        }
      }
      
      throw error;
    } finally {
      this.transactionDepth--;
    }
  }

  async close(): Promise<void> {
    if (this.isClosing) {
      return Promise.reject(new Error('Database is already closing'));
    }
    
    this.isClosing = true;
    logger.info('Closing database...');
    
    try {
      // Finalize all active statements
      const activeStatementsCount = this.activeStatements.size;
      if (activeStatementsCount > 0) {
        logger.info(`Finalizing ${activeStatementsCount} active statements before closing database`);
        
        // Create an array of promises to finalize all statements
        const finalizationPromises = Array.from(this.activeStatements).map(stmt => 
          stmt.finalize().catch(err => {
            logger.warn('Error finalizing statement:', err);
            return Promise.resolve(); // Continue with other statements even if one fails
          })
        );
        
        // Wait for all statements to be finalized
        await Promise.all(finalizationPromises);
        this.activeStatements.clear();
      }
      
      // Run PRAGMA to optimize database before closing
      try {
        await this.pragma('optimize');
        logger.debug('Database optimized before closing');
      } catch (error) {
        logger.warn('Failed to optimize database before closing:', error);
        // Continue with close even if optimize fails
      }
      
      // Close the database
      return new Promise<void>((resolve, reject) => {
        this.db.close((err: Error | null) => {
          if (err) {
            this.isClosing = false; // Reset flag if closing failed
            logger.error('Error closing database:', err);
            reject(err);
          } else {
            logger.info('Database closed successfully');
            resolve();
          }
        });
      });
    } catch (error) {
      this.isClosing = false; // Reset flag if an error occurred
      logger.error('Failed to close database cleanly:', error);
      throw error;
    }
  }
}

export default Database; 