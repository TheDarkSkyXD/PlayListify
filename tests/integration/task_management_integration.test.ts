// tests/integration/task_management_integration.test.ts

import Database from 'better-sqlite3';
import { BackgroundTaskService } from '../../src/services/background-task-service';
import { BackgroundTaskRepository } from '../../src/repositories/background-task-repository';
import { SQLiteAdapter } from '../../src/adapters/sqlite-adapter';
import { BackgroundTask, BackgroundTaskType } from '../../src/shared/data-models';

describe('Task Management Integration', () => {
    let db: Database;
    let service: BackgroundTaskService;
    let adapter: SQLiteAdapter;

    beforeEach(() => {
        db = new Database(':memory:');
        adapter = new SQLiteAdapter(db);
        
        // Initialize the schema using the adapter's method
        adapter.initializeSchema();

        const repository = new BackgroundTaskRepository(adapter);
        service = new BackgroundTaskService(repository);
    });

    afterEach(() => {
        db.close();
    });

    const dbAll = (sql: string, params: any[] = []): any[] => {
        const stmt = db.prepare(sql);
        return stmt.all(...params);
    };
    
    const dbGet = (sql: string, params: any[] = []): any => {
        const stmt = db.prepare(sql);
        return stmt.get(...params);
    };

    it('should create background_tasks table with correct schema', () => {
        const tableInfo = dbAll("PRAGMA table_info('background_tasks')");
        expect(tableInfo.length).toBeGreaterThan(0);
    });

    it('should persist task correctly in database and retrieve it', async () => {
        const taskInput = {
            task_type: 'IMPORT_PLAYLIST' as BackgroundTaskType,
            title: 'Test Playlist Import',
        };
        const createdTask = await service.createTask(taskInput);
        expect(createdTask.id).toBeDefined();

        const dbResult = dbGet('SELECT * FROM background_tasks WHERE id = ?', [createdTask.id]);
        expect(dbResult).toBeDefined();
        expect(dbResult.id).toBe(createdTask.id);
    });
});
