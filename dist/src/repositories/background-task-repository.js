"use strict";
// src/repositories/background-task-repository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundTaskRepository = void 0;
const errors_1 = require("../shared/errors");
class BackgroundTaskRepository {
    constructor(adapter) {
        this.adapter = adapter;
    }
    toTaskObject(row) {
        if (!row)
            return row;
        return {
            ...row,
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at),
            completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
            details: row.details ? JSON.parse(row.details) : undefined,
        };
    }
    create(task, adapter) {
        return new Promise(async (resolve, reject) => {
            const db = adapter || this.adapter;
            const now = new Date();
            const fullTask = {
                status: 'QUEUED',
                progress: 0.0,
                ...task,
                created_at: now,
                updated_at: now,
            };
            const columns = Object.keys(fullTask).filter(key => fullTask[key] !== undefined);
            const values = columns.map(col => {
                const val = fullTask[col];
                if (typeof val === 'object' && val !== null)
                    return JSON.stringify(val);
                if (val instanceof Date)
                    return val.toISOString();
                return val;
            });
            const placeholders = columns.map(() => '?').join(', ');
            const sql = `INSERT INTO background_tasks (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *;`;
            try {
                const newRows = await db.query(sql, values);
                if (!newRows || newRows.length === 0) {
                    reject(new errors_1.DatabaseError('Failed to create task, no record returned.'));
                }
                resolve(this.toTaskObject(newRows[0]));
            }
            catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                reject(new errors_1.DatabaseError(`Failed to create task: ${message}`));
            }
        });
    }
    async getById(id, adapter) {
        const db = adapter || this.adapter;
        const sql = `SELECT * FROM background_tasks WHERE id = ?;`;
        try {
            const rows = await db.query(sql, [id]);
            if (rows.length === 0) {
                return null;
            }
            return this.toTaskObject(rows[0]);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new errors_1.DatabaseError(`Failed to get task by id: ${message}`);
        }
    }
    getByIdSync(id, adapter) {
        const db = adapter || this.adapter;
        const sql = `SELECT * FROM background_tasks WHERE id = ?;`;
        try {
            const stmt = db.db.prepare(sql);
            const row = stmt.get(id);
            if (!row) {
                return null;
            }
            return this.toTaskObject(row);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new errors_1.DatabaseError(`Failed to get task by id: ${message}`);
        }
    }
    async getUnfinishedTasks(adapter) {
        const db = adapter || this.adapter;
        const sql = `SELECT * FROM background_tasks WHERE status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED', 'COMPLETED_WITH_ERRORS');`;
        try {
            const rows = await db.query(sql, []);
            return rows.map((r) => this.toTaskObject(r));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new errors_1.DatabaseError(`Failed to get unfinished tasks: ${message}`);
        }
    }
    async update(id, updates, adapter) {
        const db = adapter || this.adapter;
        updates.updated_at = new Date();
        if (updates.status === 'COMPLETED' || updates.status === 'FAILED' || updates.status === 'CANCELLED' || updates.status === 'COMPLETED_WITH_ERRORS') {
            updates.completed_at = new Date();
        }
        const columns = Object.keys(updates).filter(k => k !== 'id');
        const setClauses = columns.map(c => `${c} = ?`).join(', ');
        const values = columns.map(c => {
            const val = updates[c];
            if (val instanceof Date)
                return val.toISOString();
            if (typeof val === 'object' && val !== null)
                return JSON.stringify(val);
            return val;
        });
        const sql = `UPDATE background_tasks SET ${setClauses} WHERE id = ? RETURNING *;`;
        try {
            const updatedRows = await db.query(sql, [...values, id]);
            if (updatedRows.length === 0) {
                return null;
            }
            return this.toTaskObject(updatedRows[0]);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new errors_1.DatabaseError(`Failed to update task: ${message}`);
        }
    }
    updateSync(id, updates, adapter) {
        const db = adapter || this.adapter;
        updates.updated_at = new Date();
        if (updates.status === 'COMPLETED' || updates.status === 'FAILED' || updates.status === 'CANCELLED' || updates.status === 'COMPLETED_WITH_ERRORS') {
            updates.completed_at = new Date();
        }
        const columns = Object.keys(updates).filter(k => k !== 'id');
        const setClauses = columns.map(c => `${c} = ?`).join(', ');
        const values = columns.map(c => {
            const val = updates[c];
            if (val instanceof Date)
                return val.toISOString();
            if (typeof val === 'object' && val !== null)
                return JSON.stringify(val);
            return val;
        });
        const sql = `UPDATE background_tasks SET ${setClauses} WHERE id = ? RETURNING *;`;
        try {
            const stmt = db.db.prepare(sql);
            const updatedRow = stmt.get(...values, id);
            if (!updatedRow) {
                return null;
            }
            return this.toTaskObject(updatedRow);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new errors_1.DatabaseError(`Failed to update task: ${message}`);
        }
    }
    async getChildTasks(parentId, adapter) {
        const db = adapter || this.adapter;
        const sql = `SELECT * FROM background_tasks WHERE parent_id = ?;`;
        try {
            const rows = await db.query(sql, [parentId]);
            return rows.map((r) => this.toTaskObject(r));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new errors_1.DatabaseError(`Failed to get child tasks: ${message}`);
        }
    }
    getChildTasksSync(parentId, adapter) {
        const db = adapter || this.adapter;
        const sql = `SELECT * FROM background_tasks WHERE parent_id = ?;`;
        try {
            const stmt = db.db.prepare(sql);
            const rows = stmt.all(parentId);
            return rows.map((r) => this.toTaskObject(r));
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            throw new errors_1.DatabaseError(`Failed to get child tasks: ${message}`);
        }
    }
}
exports.BackgroundTaskRepository = BackgroundTaskRepository;
//# sourceMappingURL=background-task-repository.js.map