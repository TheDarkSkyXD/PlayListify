import { BackgroundTaskService } from '../../src/services/background-task-service';
import { BackgroundTaskRepository } from '../../src/repositories/background-task-repository';
import { BackgroundTaskStatus, BackgroundTaskType, BackgroundTask } from '../../src/shared/data-models';
import { InvalidInputError, ParentTaskNotFoundError, TaskNotFoundError, InvalidStateTransitionError, CircularDependencyError } from '../../src/shared/errors';

// Mock the repository
jest.mock('../../src/repositories/background-task-repository');

const mockRepository = new BackgroundTaskRepository(jest.fn() as any) as jest.Mocked<BackgroundTaskRepository>;
(mockRepository as any).adapter = {
    transaction: jest.fn(async (action) => action(mockRepository.adapter)),
};

describe('BackgroundTaskService - Unit Tests', () => {
  let service: BackgroundTaskService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BackgroundTaskService(mockRepository);
    
    // Setup mock implementations for all repository methods used in the service
    mockRepository.getById = jest.fn().mockImplementation(async (id: number) => {
        if (id === 1) return { id: 1, title: 'Parent Task', task_type: 'IMPORT_PLAYLIST', status: 'IN_PROGRESS', progress: 0.1, created_at: new Date(), updated_at: new Date() };
        if (id === 2) return { id: 2, parent_id: 1, title: 'Child Task', task_type: 'DOWNLOAD_VIDEO', status: 'QUEUED', progress: 0, created_at: new Date(), updated_at: new Date() };
        if (id === 5) return { id: 5, title: 'Completed', task_type: 'DOWNLOAD_VIDEO', status: 'COMPLETED', progress: 1, created_at: new Date(), updated_at: new Date() };
        return null;
    });

    mockRepository.create = jest.fn();
    mockRepository.update = jest.fn().mockResolvedValue(true);
    mockRepository.getChildTasks = jest.fn().mockResolvedValue([]);
    mockRepository.getUnfinishedTasks = jest.fn().mockResolvedValue([]);
  });

  it('UNIT-BGS-001: should create a new standalone task with valid inputs', async () => {
    const taskDetails = { title: 'Test Task', task_type: 'DOWNLOAD_VIDEO' as BackgroundTaskType, details: { url: 'http://example.com' } };
    const createdTask: BackgroundTask = { id: 3, ...taskDetails, status: 'QUEUED' as BackgroundTaskStatus, progress: 0, created_at: new Date(), updated_at: new Date() };
    mockRepository.create.mockResolvedValueOnce(createdTask);
    
    const task = await service.createTask(taskDetails);
    
    expect(task).toBeDefined();
    expect(task.id).toBe(3);
    expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining(taskDetails));
  });

  it('UNIT-BGS-002: should create a new child task linked to a parent', async () => {
    const taskDetails = { title: 'Child Task', task_type: 'DOWNLOAD_VIDEO' as BackgroundTaskType, details: {}, parent_id: 1 };
    const createdTask: BackgroundTask = { id: 4, ...taskDetails, status: 'QUEUED' as BackgroundTaskStatus, progress: 0, created_at: new Date(), updated_at: new Date()};
    mockRepository.create.mockResolvedValueOnce(createdTask);

    const task = await service.createTask(taskDetails);
    
    expect(task.parent_id).toBe(1);
    expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({ parent_id: 1 }));
  });

  it('UNIT-BGS-003: should reject creation with invalid input (e.g., empty title)', async () => {
    await expect(service.createTask({ title: '', task_type: 'DOWNLOAD_VIDEO' })).rejects.toThrow(InvalidInputError);
  });

  it('UNIT-BGS-004: should reject creation of a child task for a non-existent parent', async () => {
    await expect(service.createTask({ title: 'Child', task_type: 'DOWNLOAD_VIDEO', parent_id: 999 })).rejects.toThrow(ParentTaskNotFoundError);
  });

  it('UNIT-BGS-005: should reject creation of a task that creates a circular dependency', async () => {
    mockRepository.getById.mockImplementation(async (id: number) => {
        if (id === 1) return { id: 1, title: 'Task 1', task_type: 'IMPORT_PLAYLIST', status: 'IN_PROGRESS', progress: 0.1, created_at: new Date(), updated_at: new Date(), parent_id: 2 };
        if (id === 2) return { id: 2, parent_id: 1, title: 'Task 2', task_type: 'DOWNLOAD_VIDEO', status: 'QUEUED', progress: 0, created_at: new Date(), updated_at: new Date() };
        return null;
    });
    await expect(service.updateTaskParent(1, 2)).rejects.toThrow(CircularDependencyError);
  });

  it('UNIT-BGS-006: should update the status of an existing task', async () => {
    const taskId = 1;
    await service.updateTaskStatus(taskId, 'COMPLETED');
    expect(mockRepository.update).toHaveBeenCalledWith(taskId, { status: 'COMPLETED' }, mockRepository.adapter);
  });

  it('UNIT-BGS-007: should reject status update for a non-existent task', async () => {
    await expect(service.updateTaskStatus(999, 'IN_PROGRESS')).rejects.toThrow(TaskNotFoundError);
  });

  it('UNIT-BGS-008: should reject invalid state transitions (e.g., updating a completed task)', async () => {
    await expect(service.updateTaskStatus(5, 'IN_PROGRESS')).rejects.toThrow(InvalidStateTransitionError);
  });
    
  it('UNIT-BGS-009: should update the progress of an existing task', async () => {
    const taskId = 1;
    await service.updateTaskProgress(taskId, 0.5);
    expect(mockRepository.update).toHaveBeenCalledWith(taskId, { progress: 0.5 }, mockRepository.adapter);
  });

  it('UNIT-BGS-010: should cancel a pending or running task', async () => {
    const taskId = 1;
    await service.updateTaskStatus(taskId, 'CANCELLED');
    expect(mockRepository.update).toHaveBeenCalledWith(taskId, { status: 'CANCELLED' }, mockRepository.adapter);
  });

  it('UNIT-BGS-011: should handle repository errors gracefully', async () => {
    mockRepository.create.mockRejectedValueOnce(new Error('Database connection failed'));
    await expect(service.createTask({title: 'Fail Task', task_type: 'DOWNLOAD_VIDEO'})).rejects.toThrow('Database connection failed');
  });
});
