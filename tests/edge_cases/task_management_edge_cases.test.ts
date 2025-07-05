import { BackgroundTaskService } from '../../src/services/background_task_service';
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
        status: 'IN_PROGRESS', 
        progress: 0,
        title: 'race-condition-task',
        task_type: 'DOWNLOAD_VIDEO',
        created_at: new Date(),
        updated_at: new Date(),
    };

    const progressUpdatedTask: BackgroundTask = { ...initialTask, progress: 0.5 };
    
    mockRepository.getById.mockResolvedValueOnce(initialTask)
                         .mockResolvedValueOnce(initialTask)
                         .mockResolvedValueOnce(progressUpdatedTask);

    mockRepository.update.mockResolvedValue(true);
    
    const promise1 = service.updateTaskProgress(taskId, 0.5);
    const promise2 = service.updateTaskStatus(taskId, 'COMPLETED');

    await Promise.all([promise1, promise2]);

    expect(mockRepository.update).toHaveBeenCalledWith(taskId, { progress: 0.5 });
    expect(mockRepository.update).toHaveBeenCalledWith(taskId, { status: 'COMPLETED' });
  });

  describe('API/Contract Tests', () => {
    it('API-BGS-001: should emit a "task-update" event on task creation', (done) => {
        const task: BackgroundTask = {id: 1, title: 'api-test', status: 'QUEUED', progress: 0, task_type: 'DOWNLOAD_VIDEO', created_at: new Date(), updated_at: new Date() };
        mockRepository.create.mockResolvedValueOnce(task);
        
        service.on('task-update', (payload) => {
            expect(payload).toEqual(task);
            done();
        });

        service.createTask({ title: 'api-test', task_type: 'DOWNLOAD_VIDEO' });
    });

    it('API-BGS-002: should emit a "task-update" event on task status change', (done) => {
        const task: BackgroundTask = {id: 1, title: 'api-test', status: 'QUEUED', progress: 0, task_type: 'DOWNLOAD_VIDEO', created_at: new Date(), updated_at: new Date() };
        const updatedTask: BackgroundTask = { ...task, status: 'IN_PROGRESS', updated_at: new Date() };

        mockRepository.getById.mockResolvedValueOnce(task)
                              .mockResolvedValueOnce(updatedTask);
        mockRepository.update.mockResolvedValue(true);
        
        service.on('task-update', (payload) => {
            expect(payload).toEqual(updatedTask);
            done();
        });

        service.updateTaskStatus(1, 'IN_PROGRESS');
    });

    it('API-BGS-003: should emit a "task-update" event on task progress change', (done) => {
        const task: BackgroundTask = {id: 1, title: 'api-test', status: 'IN_PROGRESS', progress: 0, task_type: 'DOWNLOAD_VIDEO', created_at: new Date(), updated_at: new Date() };
        const updatedTask: BackgroundTask = { ...task, progress: 0.5, updated_at: new Date() };
        
        mockRepository.getById.mockResolvedValueOnce(task)
                              .mockResolvedValueOnce(updatedTask);
        mockRepository.update.mockResolvedValue(true);

        service.on('task-update', (payload) => {
            expect(payload).toEqual(updatedTask);
            done();
        });

        service.updateTaskProgress(1, 0.5);
    });

    it('API-BGS-004: the event payload should contain all required fields', (done) => {
        const task: BackgroundTask = {id: 1, title: 'payload-test', status: 'QUEUED', progress: 0, task_type: 'DOWNLOAD_VIDEO', created_at: new Date(), updated_at: new Date(), details: { foo: 'bar' } };
        mockRepository.create.mockResolvedValueOnce(task);

        service.on('task-update', (payload) => {
            expect(payload).toHaveProperty('id');
            expect(payload).toHaveProperty('title');
            expect(payload).toHaveProperty('status');
            expect(payload).toHaveProperty('progress');
            expect(payload).toHaveProperty('details');
            done();
        });
        
        service.createTask({ title: 'payload-test', task_type: 'DOWNLOAD_VIDEO', details: { foo: 'bar' } });
    });

    it('API-BGS-005: should not emit an event if the underlying repository operation fails', async () => {
        const spy = jest.spyOn(service, 'emit');
        mockRepository.create.mockRejectedValueOnce(new Error('Failed to create'));

        await expect(service.createTask({ title: 'fail', task_type: 'DOWNLOAD_VIDEO' })).rejects.toThrow();
        expect(spy).not.toHaveBeenCalled();
    });
  });
});