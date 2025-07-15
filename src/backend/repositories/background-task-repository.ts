// src/repositories/background-task-repository.ts

import { BackgroundTask } from '../shared/data-models';
import { SQLiteAdapter } from '../adapters/sqlite-adapter';
import { DatabaseError } from '../shared/errors';

export class BackgroundTaskRepository {

    constructor(public adapter: SQLiteAdapter) { }

    private toTaskObject(row: any): BackgroundTask {
        if (!row) return row;
        return {
            ...row,
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at),
            completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
            details: row.details ? JSON.parse(row.details) : undefined,
        };
    }

    create(task: Partial<BackgroundTask>, adapter?: SQLiteAdapter): Promise<BackgroundTask> {
        return new Promise(async (resolve, reject) => {
            const db = adapter || this.adapter;
            const now = new Date();
            const fullTask: Partial<BackgroundTask> & { created_at: Date, updated_at: Date } = {
                status: 'QUEUED',
                progress: 0.0,
                ...task,
                created_at: now,
                updated_at: now,
            };

            const columns = Object.keys(fullTask).filter(key => (fullTask as any)[key] !== undefined);
            const values = columns.map(col => {
                const val = (fullTask as any)[col];
                if (typeof val === 'object' && val !== null) return JSON.stringify(val);
                if (val instanceof Date) return val.toISOString();
                return val;
            });
            const placeholders = columns.map(() => '?').join(', ');

            const sql = `INSERT INTO background_tasks (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *;`;
            
            try {
                const newRows = await db.query<BackgroundTask>(sql, values);
                if (!newRows || newRows.length === 0) {
                    reject(new DatabaseError('Failed to create task, no record returned.'));
                }
                resolve(this.toTaskObject(newRows[0]));
            } catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                reject(new DatabaseError(`Failed to create task: ${message}`));
            }
        });
    }

    async getById(id: number, adapter?: SQLiteAdapter): Promise<BackgroundTask | null> {
        const db = adapter || this.adapter;
        const sql = `SELECT * FROM background_tasks WHERE id = ?;`;
        try {
            const rows = await db.query<BackgroundTask>(sql, [id]);
            if (rows.length === 0) {
                return null;
            }
            return this.toTaskObject(rows[0]);
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new DatabaseError(`Failed to get task by id: ${message}`);
        }
    }

    getByIdSync(id: number, adapter?: SQLiteAdapter): BackgroundTask | null {
        const db = adapter || this.adapter;
        const sql = `SELECT * FROM background_tasks WHERE id = ?;`;
        try {
            const stmt = db.db.prepare(sql);
            const row = stmt.get(id);
            if (!row) {
                return null;
            }
            return this.toTaskObject(row);
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new DatabaseError(`Failed to get task by id: ${message}`);
        }
    }
    
    async getUnfinishedTasks(adapter?: SQLiteAdapter): Promise<BackgroundTask[]> {
        const db = adapter || this.adapter;
        const sql = `SELECT * FROM background_tasks WHERE status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED', 'COMPLETED_WITH_ERRORS');`;
        try {
            const rows = await db.query<BackgroundTask>(sql, []);
            return rows.map((r: any) => this.toTaskObject(r));
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new DatabaseError(`Failed to get unfinished tasks: ${message}`);
        }
    }
    
    async update(id: number, updates: Partial<BackgroundTask>, adapter?: SQLiteAdapter): Promise<BackgroundTask | null> {
        const db = adapter || this.adapter;
        updates.updated_at = new Date();
        if (updates.status === 'COMPLETED' || updates.status === 'FAILED' || updates.status === 'CANCELLED' || updates.status === 'COMPLETED_WITH_ERRORS') {
            updates.completed_at = new Date();
        }

        const columns = Object.keys(updates).filter(k => k !== 'id');
        const setClauses = columns.map(c => `${c} = ?`).join(', ');
        const values = columns.map(c => {
            const val = (updates as any)[c];
            if (val instanceof Date) return val.toISOString();
            if (typeof val === 'object' && val !== null) return JSON.stringify(val);
            return val;
        });

        const sql = `UPDATE background_tasks SET ${setClauses} WHERE id = ? RETURNING *;`;

        try {
            const updatedRows = await db.query<BackgroundTask>(sql, [...values, id]);
            if(updatedRows.length === 0){
                return null;
            }
            return this.toTaskObject(updatedRows[0]);
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new DatabaseError(`Failed to update task: ${message}`);
        }
    }

    updateSync(id: number, updates: Partial<BackgroundTask>, adapter?: SQLiteAdapter): BackgroundTask | null {
        const db = adapter || this.adapter;
        updates.updated_at = new Date();
        if (updates.status === 'COMPLETED' || updates.status === 'FAILED' || updates.status === 'CANCELLED' || updates.status === 'COMPLETED_WITH_ERRORS') {
            updates.completed_at = new Date();
        }

        const columns = Object.keys(updates).filter(k => k !== 'id');
        const setClauses = columns.map(c => `${c} = ?`).join(', ');
        const values = columns.map(c => {
            const val = (updates as any)[c];
            if (val instanceof Date) return val.toISOString();
            if (typeof val === 'object' && val !== null) return JSON.stringify(val);
            return val;
        });

        const sql = `UPDATE background_tasks SET ${setClauses} WHERE id = ? RETURNING *;`;

        try {
            const stmt = db.db.prepare(sql);
            const updatedRow = stmt.get(...values, id);
            if(!updatedRow){
                return null;
            }
            return this.toTaskObject(updatedRow);
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new DatabaseError(`Failed to update task: ${message}`);
        }
    }

    async getChildTasks(parentId: number, adapter?: SQLiteAdapter): Promise<BackgroundTask[]> {
        const db = adapter || this.adapter;
        const sql = `SELECT * FROM background_tasks WHERE parent_id = ?;`;
        try {
            const rows = await db.query<BackgroundTask>(sql, [parentId]);
            return rows.map((r: any) => this.toTaskObject(r));
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new DatabaseError(`Failed to get child tasks: ${message}`);
        }
    }

    getChildTasksSync(parentId: number, adapter?: SQLiteAdapter): BackgroundTask[] {
        const db = adapter || this.adapter;
        const sql = `SELECT * FROM background_tasks WHERE parent_id = ?;`;
        try {
            const stmt = db.db.prepare(sql);
            const rows = stmt.all(parentId);
            return rows.map((r: any) => this.toTaskObject(r));
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new DatabaseError(`Failed to get child tasks: ${message}`);
        }
    }
}
