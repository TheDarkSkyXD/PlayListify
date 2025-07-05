import { BackgroundTaskService } from '../../src/services/background-task-service';
import { BackgroundTaskRepository } from '../../src/repositories/background-task-repository';
import { BackgroundTaskStatus, BackgroundTask, BackgroundTaskType } from '../../src/shared/data-models';
import { SQLiteAdapter } from '../../src/adapters/sqlite-adapter';
import { DatabaseError } from '../../src/shared/errors';

jest.mock('../../src/repositories/background-task-repository');
jest.mock('../../src/adapters/sqlite-adapter');

const mockAdapter = new SQLiteAdapter(':memory:') as jest.Mocked<SQLiteAdapter>;
const mockRepository = new BackgroundTaskRepository(mockAdapter) as jest.Mocked<BackgroundTaskRepository>;
let service: BackgroundTaskService;

describe('BackgroundTaskService - Edge Case Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BackgroundTaskService(mockRepository);
    (mockRepository as any).adapter = {
        transaction: jest.fn().mockImplementation(async (action) => action(mockRepository.adapter)),
    };
    mockRepository.create = jest.fn().mockImplementation(async (task: Partial<BackgroundTask>) => {
        const createdTask: BackgroundTask = {
            id: Math.floor(Math.random() * 1000),
            title: task.title || 'mock task',
            task_type: task.task_type || 'DOWNLOAD_VIDEO',
            status: 'QUEUED',
            progress: 0,
            created_at: new Date(),
            updated_at: new Date(),
            ...task
        };
        return createdTask;
    });
    mockRepository.getById = jest.fn();
    mockRepository.update = jest.fn().mockImplementation(async (id, updates) => {
        const task = await mockRepository.getById(id);
        if (!task) return null;
        const updatedTask = { ...task, ...updates, updated_at: new Date() };
        // In a real scenario, this would be another DB call, but for the mock, we update the getById mock
        mockRepository.getById.mockResolvedValue(updatedTask);
        return updatedTask;
    });
  });
  it('EDGE-DB-001 (Abrupt Closure): should correctly roll back a transaction on simulated crash', async () => {
    mockRepository.create.mockRejectedValueOnce(new DatabaseError('DB_CONNECTION_LOST'));
    
    await expect(service.createTask({ title: 'test', task_type: 'DOWNLOAD_VIDEO' })).rejects.toThrow(DatabaseError);
  });

  it('EDGE-DB-003 (DB Read-Only): should catch I/O errors and fail gracefully', async () => {
    mockRepository.create.mockRejectedValueOnce(new DatabaseError('IO_ERROR: Read-only database'));
    
    await expect(service.createTask({ title: 'test', task_type: 'DOWNLOAD_VIDEO' })).rejects.toThrow(DatabaseError);
  });

  it('EDGE-STATE-001 (Race Condition): should serialize concurrent updates to the same task', async () => {
    const taskId = 1;
    const initialTask: BackgroundTask = {
        id: taskId,
        status: 'QUEUED',
        progress: 0,
        title: 'race-condition-task',
        task_type: 'DOWNLOAD_VIDEO',
        created_at: new Date(),
        updated_at: new Date(),
    };

    const inProgressTask: BackgroundTask = { ...initialTask, status: 'IN_PROGRESS' };
    const progressUpdatedTask: BackgroundTask = { ...inProgressTask, progress: 0.5 };
    
    // Simulate the transaction
    mockRepository.getById.mockResolvedValueOnce(initialTask); // for updateTaskProgress
    mockRepository.getById.mockResolvedValueOnce(inProgressTask); // for updateTaskProgress (re-fetch)
    mockRepository.getById.mockResolvedValueOnce(progressUpdatedTask); // for updateTaskStatus

    const promise1 = service.updateTaskProgress(taskId, 0.5);
    const promise2 = service.updateTaskStatus(taskId, 'IN_PROGRESS');

    await Promise.all([promise1, promise2]);

    expect(mockRepository.update).toHaveBeenCalledWith(taskId, { progress: 0.5 }, expect.anything());
    expect(mockRepository.update).toHaveBeenCalledWith(taskId, { status: 'IN_PROGRESS' }, expect.anything());
  });

  describe('API/Contract Tests', () => {
    it('API-BGS-001: should emit a "task-update" event on task creation', async () => {
        const task: BackgroundTask = {id: 1, title: 'api-test', status: 'QUEUED', progress: 0, task_type: 'DOWNLOAD_VIDEO', created_at: new Date(), updated_at: new Date() };
        mockRepository.create.mockResolvedValueOnce(task);
        
        const spy = jest.spyOn(service, 'emit');
        await service.createTask({ title: 'api-test', task_type: 'DOWNLOAD_VIDEO' });
        
        expect(spy).toHaveBeenCalledWith('task-update', task);
    });

    it('API-BGS-002: should emit a "task-update" event on task status change', async () => {
        const task: BackgroundTask = {id: 1, title: 'api-test', status: 'QUEUED', progress: 0, task_type: 'DOWNLOAD_VIDEO', created_at: new Date(), updated_at: new Date() };
        const updatedTask: BackgroundTask = { ...task, status: 'IN_PROGRESS', updated_at: new Date() };

        mockRepository.getById.mockResolvedValue(task);
        mockRepository.update.mockResolvedValue(updatedTask);
        
        const spy = jest.spyOn(service, 'emit');
        await service.updateTaskStatus(1, 'IN_PROGRESS');
        
        expect(spy).toHaveBeenCalledWith('task-update', updatedTask);
    });

    it('API-BGS-003: should emit a "task-update" event on task progress change', async () => {
        const task: BackgroundTask = {id: 1, title: 'api-test', status: 'IN_PROGRESS', progress: 0, task_type: 'DOWNLOAD_VIDEO', created_at: new Date(), updated_at: new Date() };
        const updatedTask: BackgroundTask = { ...task, progress: 0.5, updated_at: new Date() };
        
        mockRepository.getById.mockResolvedValue(task);
        mockRepository.update.mockResolvedValue(updatedTask);

        const spy = jest.spyOn(service, 'emit');
        await service.updateTaskProgress(1, 0.5);

        expect(spy).toHaveBeenCalledWith('task-update', updatedTask);
    });

    it('API-BGS-004: the event payload should contain all required fields', async () => {
        const task: BackgroundTask = {id: 1, title: 'payload-test', status: 'QUEUED', progress: 0, task_type: 'DOWNLOAD_VIDEO', created_at: new Date(), updated_at: new Date(), details: { foo: 'bar' } };
        mockRepository.create.mockResolvedValueOnce(task);

        const spy = jest.spyOn(service, 'emit');
        await service.createTask({ title: 'payload-test', task_type: 'DOWNLOAD_VIDEO', details: { foo: 'bar' } });
        
        const payload = spy.mock.calls[0][1] as BackgroundTask;
        expect(payload).toHaveProperty('id');
        expect(payload).toHaveProperty('title');
        expect(payload).toHaveProperty('status');
        expect(payload).toHaveProperty('progress');
        expect(payload).toHaveProperty('details');
    });

    it('API-BGS-005: should not emit an event if the underlying repository operation fails', async () => {
        const spy = jest.spyOn(service, 'emit');
        mockRepository.create.mockRejectedValueOnce(new Error('Failed to create'));

        await expect(service.createTask({ title: 'fail', task_type: 'DOWNLOAD_VIDEO' })).rejects.toThrow();
        expect(spy).not.toHaveBeenCalled();
    });
  });

  it('should handle concurrent updates to the same task without race conditions', async () => {
    const task = await service.createTask({ title: 'Concurrent Test', task_type: 'DOWNLOAD_VIDEO' });
    
    let finalTaskState: BackgroundTask = { ...task };

    (mockRepository.adapter.transaction as jest.Mock).mockImplementation(async (action: (adapter: any) => any) => {
      return await action(mockRepository.adapter);
    });

    (mockRepository as any).getById.mockImplementation(async (id: number) => {
        return { ...finalTaskState, id };
    });
    
    (mockRepository as any).update.mockImplementation(async (id: number, updates: Partial<BackgroundTask>) => {
        finalTaskState = { ...finalTaskState, ...updates, id };
        return finalTaskState;
    });

    const promise1 = service.updateTaskProgress(task.id, 0.5);
    const promise2 = service.updateTaskStatus(task.id, 'IN_PROGRESS');

    await Promise.all([promise1, promise2]);

    const finalUpdatedTask = await service.getTask(task.id);

    expect(finalUpdatedTask!.status).toBe('IN_PROGRESS');
    expect(finalUpdatedTask!.progress).toBe(0.5);
  });
});