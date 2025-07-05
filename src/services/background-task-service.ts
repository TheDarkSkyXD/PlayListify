// src/services/background-task-service.ts

import { BackgroundTask, BackgroundTaskType, BackgroundTaskStatus } from '../shared/data-models';
import { BackgroundTaskRepository } from '../repositories/background-task-repository';
import {
  InvalidInputError,
  InvalidStateTransitionError,
  CircularDependencyError,
  TaskNotFoundError,
  ParentTaskNotFoundError
} from '../shared/errors';

/**
 * Service for managing background tasks
 * 
 * This is a stub implementation for TDD. The actual implementation
 * will be developed to make the tests pass.
 */
export class BackgroundTaskService {
  constructor(private repository: BackgroundTaskRepository) {}

  async createTask(input: { task_type: BackgroundTaskType; title: string; parent_id?: number }): Promise<BackgroundTask> {
    // Validate input
    if (!input.title || input.title.trim().length === 0) {
      throw new InvalidInputError('Task title cannot be null or empty');
    }

    if (!['IMPORT_PLAYLIST', 'DOWNLOAD_VIDEO', 'REFRESH_PLAYLIST'].includes(input.task_type)) {
      throw new InvalidInputError('Invalid task type');
    }

    // Check if parent exists if parent_id is provided
    if (input.parent_id) {
      const parent = await this.repository.getById(input.parent_id);
      if (!parent) {
        throw new ParentTaskNotFoundError('Parent task not found');
      }
    }

    // Create the task object
    const taskData = {
      task_type: input.task_type,
      title: input.title.trim(),
      parent_id: input.parent_id,
      status: 'QUEUED' as BackgroundTaskStatus,
      progress: 0.0
    };

    // Create the task in the repository
    return await this.repository.create(taskData);
  }

  async updateTaskStatus(taskId: number, status: BackgroundTaskStatus): Promise<boolean> {
    const task = await this.repository.getById(taskId);
    if (!task) {
      throw new TaskNotFoundError('Task not found');
    }

    // Check for invalid state transitions
    const terminalStates = ['COMPLETED', 'FAILED', 'CANCELLED'];
    if (terminalStates.includes(task.status)) {
      throw new InvalidStateTransitionError('Cannot update status of completed task');
    }

    // Update the task status
    return await this.repository.update(taskId, { status });
  }

  async updateTaskProgress(taskId: number, progress: number): Promise<void> {
    if (isNaN(progress) || progress < 0 || progress > 1) {
      throw new InvalidInputError('Progress must be a number between 0 and 1');
    }

    const task = await this.repository.getById(taskId);
    if (!task) {
      throw new TaskNotFoundError('Task not found');
    }

    // Check for invalid state transitions
    const terminalStates = ['COMPLETED', 'FAILED', 'CANCELLED'];
    if (terminalStates.includes(task.status)) {
      throw new InvalidStateTransitionError('Cannot update progress of completed task');
    }

    // Update the task progress
    await this.repository.update(taskId, { progress });
  }

  async getTask(taskId: number): Promise<BackgroundTask | null> {
    return await this.repository.getById(taskId);
  }

  async resumeUnfinishedTasks(): Promise<void> {
    // Get all unfinished tasks and reset their status to QUEUED
    const unfinishedTasks = await this.repository.getUnfinishedTasks();
    
    for (const task of unfinishedTasks) {
      if (task.status === 'IN_PROGRESS') {
        await this.repository.update(task.id, { status: 'QUEUED' });
      }
    }
  }

  async getUnfinishedTasks(): Promise<BackgroundTask[]> {
    return await this.repository.getUnfinishedTasks();
  }

  async updateTaskParent(taskId: number, parentId: number): Promise<void> {
    // Check for circular dependencies
    const task = await this.repository.getById(taskId);
    if (!task) {
      throw new TaskNotFoundError('Task not found');
    }

    // Simple circular dependency check (would need more sophisticated implementation)
    if (taskId === parentId) {
      throw new CircularDependencyError('Task cannot be its own parent');
    }

    // Check if parent exists
    const parent = await this.repository.getById(parentId);
    if (!parent) {
      throw new ParentTaskNotFoundError('Parent task not found');
    }

    // Update the task's parent
    await this.repository.update(taskId, { parent_id: parentId });
  }
}
