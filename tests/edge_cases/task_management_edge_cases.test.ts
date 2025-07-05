// tests/edge_cases/task_management_edge_cases.test.ts

import sqlite3 from 'sqlite3';
import { BackgroundTaskService } from '../../src/services/background-task-service';
import { BackgroundTaskRepository } from '../../src/repositories/background-task-repository';
import { SQLiteAdapter } from '../../src/adapters/sqlite-adapter';
import { BackgroundTask, BackgroundTaskType } from '../../src/shared/data-models';

const openDb = (): Promise<sqlite3.Database> => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(':memory:', (err) => {
            if (err) reject(err);
            else resolve(db);
        });
    });
};

describe('Task Management Edge Cases', () => {
    let db: sqlite3.Database;
    let service: BackgroundTaskService;

    beforeEach((done) => {
        db = new sqlite3.Database(':memory:', (err) => {
            if (err) return done(err);
            const adapter = new SQLiteAdapter(db);
            adapter.initializeSchema((err) => {
                if (err) return done(err);
                const repository = new BackgroundTaskRepository(adapter);
                service = new BackgroundTaskService(repository);
                done();
            });
        });
    });

    afterEach((done) => {
        db.close((err) => {
            if (err) return done(err);
            done();
        });
    });

    describe('Invalid Data Inputs', () => {
        it('should reject task creation with null title', async () => {
            await expect(service.createTask({ task_type: 'IMPORT_PLAYLIST', title: null as any }))
              .rejects.toThrow('Task title cannot be null or empty');
        });

        it('should reject task creation with empty title', async () => {
            await expect(service.createTask({ task_type: 'IMPORT_PLAYLIST', title: '' }))
              .rejects.toThrow('Task title cannot be null or empty');
        });
    });
});
