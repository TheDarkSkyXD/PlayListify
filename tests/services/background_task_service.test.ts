// tests/services/background_task_service.test.ts

import { BackgroundTaskService } from '../../src/services/background-task-service';
import { BackgroundTaskRepository } from '../../src/repositories/background-task-repository';
import { BackgroundTask, BackgroundTaskType, BackgroundTaskStatus } from '../../src/shared/data-models';
import { SQLiteAdapter } from '../../src/adapters/sqlite-adapter';
import { ParentTaskNotFoundError, InvalidStateTransitionError, TaskNotFoundError } from '../../src/shared/errors';

jest.mock('../../src/repositories/background-task-repository');
jest.mock('../../src/adapters/sqlite-adapter');

describe('BackgroundTaskService', () => {
  let service: BackgroundTaskService;
  let mockRepository: jest.Mocked<BackgroundTaskRepository>;
  
  beforeEach(() => {
    const mockAdapter = new SQLiteAdapter(':memory:') as jest.Mocked<SQLiteAdapter>;
    mockRepository = new BackgroundTaskRepository(mockAdapter) as jest.Mocked<BackgroundTaskRepository>;

    // Provide mock implementations for all repository methods
    mockRepository.create = jest.fn().mockImplementation(async (task) => {
        return { id: 1, ...task, status: 'QUEUED', progress: 0.0, created_at: new Date(), updated_at: new Date() } as BackgroundTask;
    });
    mockRepository.getById = jest.fn();
    mockRepository.update = jest.fn();
    mockRepository.getChildTasks = jest.fn();
    mockRepository.getUnfinishedTasks = jest.fn();

    service = new BackgroundTaskService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Creation', () => {
    it('should call repository.create with correctly formatted task data', async () => {
      const taskInput = {
        task_type: 'IMPORT_PLAYLIST' as BackgroundTaskType,
        title: 'Test Playlist Import',
      };
      
      await service.createTask(taskInput);

      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
          ...taskInput,
          status: 'QUEUED',
          progress: 0.0,
      }));
    });

    it('should reject child task creation if parent does not exist', async () => {
      const childTaskInput = {
        task_type: 'DOWNLOAD_VIDEO' as BackgroundTaskType,
        title: 'Orphaned Child Task',
        parent_id: 999,
      };
      mockRepository.getById.mockResolvedValue(null);

      await expect(service.createTask(childTaskInput))
        .rejects
        .toThrow(ParentTaskNotFoundError);
    });
  });

  describe('State Transitions', () => {
    it('should reject invalid state transitions (completed -> in_progress)', async () => {
      const taskId = 1;
      const existingTask = { id: taskId, status: 'COMPLETED' } as BackgroundTask;
      mockRepository.getById.mockResolvedValue(existingTask);

      await expect(service.updateTaskStatus(taskId, 'IN_PROGRESS'))
        .rejects
        .toThrow(InvalidStateTransitionError);
    });
  });
});
