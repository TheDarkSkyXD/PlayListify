"use strict";
// tests/chaos/task_management_chaos.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const background_task_service_1 = require("../../src/services/background-task-service");
const background_task_repository_1 = require("../../src/repositories/background-task-repository");
const sqlite_adapter_1 = require("../../src/adapters/sqlite-adapter");
const better_sqlite3_1 = tslib_1.__importDefault(require("better-sqlite3"));
describe('Chaos Engineering Tests for BackgroundTaskService', () => {
    let service;
    let repository;
    let adapter;
    let db;
    beforeEach(() => {
        db = new better_sqlite3_1.default(':memory:');
        adapter = new sqlite_adapter_1.SQLiteAdapter(db);
        adapter.initializeSchema();
        repository = new background_task_repository_1.BackgroundTaskRepository(adapter);
        service = new background_task_service_1.BackgroundTaskService(repository);
    });
    afterEach(() => {
        jest.restoreAllMocks();
        db.close();
    });
    // Chaos-001: Random Task Cancellation
    test('Chaos-001: should handle random task cancellation gracefully', async () => {
        const task = await service.createTask({
            task_type: 'DOWNLOAD_VIDEO',
            title: 'Chaos Test Task',
        });
        // Simulate task starting
        await service.updateTaskStatus(task.id, 'IN_PROGRESS');
        // Simulate random cancellation
        await service.updateTaskStatus(task.id, 'CANCELLED');
        const updatedTask = await service.getTask(task.id);
        expect(updatedTask?.status).toBe('CANCELLED');
    });
    // Chaos-002: Database Connection Flapping
    test('Chaos-002: should handle intermittent database connection failures', async () => {
        const prepareSpy = jest.spyOn(db, 'prepare').mockImplementationOnce(() => {
            throw new Error('SQLITE_BUSY: database is locked');
        });
        // The service/repository has retry logic, so we simulate the failure and recovery.
        // The first call will retry and succeed.
        await service.createTask({ task_type: 'DOWNLOAD_VIDEO', title: 'test' });
        // The next call should succeed because mockImplementationOnce only applies once.
        const task = await service.createTask({ task_type: 'DOWNLOAD_VIDEO', title: 'Chaos Test Task 2' });
        expect(task).toBeDefined();
        expect(task.id).toBe(2);
        const retrievedTask = await service.getTask(task.id);
        expect(retrievedTask).toBeDefined();
        expect(retrievedTask?.id).toBe(task.id);
        prepareSpy.mockRestore();
    });
    // EDGE-DB-001: Abrupt Closure During Write
    test('EDGE-DB-001: should roll back transaction on abrupt closure during write', async () => {
        const parentTask = await service.createTask({
            task_type: 'IMPORT_PLAYLIST',
            title: 'Parent Task',
        });
        const childTask = await service.createTask({
            task_type: 'DOWNLOAD_VIDEO',
            title: 'Child Task 1',
            parent_id: parentTask.id,
        });
        // Simulate an application crash inside a transaction
        try {
            adapter.transaction(() => {
                repository.update(childTask.id, { status: 'COMPLETED' });
                // Simulate crash before parent is updated
                throw new Error('Simulated application crash');
            });
        }
        catch (error) {
            // Expected error
        }
        const childTaskAfterCrash = await service.getTask(childTask.id);
        const parentTaskAfterCrash = await service.getTask(parentTask.id);
        // Verify that the transaction was rolled back
        expect(childTaskAfterCrash?.status).toBe('QUEUED');
        expect(parentTaskAfterCrash?.progress).toBe(0);
    });
});
//# sourceMappingURL=task_management_chaos.test.js.map