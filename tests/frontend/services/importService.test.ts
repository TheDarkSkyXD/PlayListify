import { ImportEventEmitter } from '../../../src/frontend/services/importService';
import { ImportJob } from '../../../src/frontend/types/importTypes';
import '@testing-library/jest-dom';

// Mock the logger
jest.mock('../../../src/frontend/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn(),
    phase: jest.fn(),
    setLogLevel: jest.fn(),
  },
  LogLevel: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  },
}));

describe('ImportEventEmitter', () => {
  let emitter: ImportEventEmitter;
  let mockListener: jest.Mock;

  beforeEach(() => {
    // Create a new emitter for each test
    emitter = new ImportEventEmitter();
    mockListener = jest.fn();
    emitter.subscribe(mockListener);
  });

  test('should create a new job with correct initial state', () => {
    // Create a new job
    const jobId = 'test-job-1';
    emitter.updateJob(jobId, {
      id: jobId,
      url: 'https://www.youtube.com/playlist?list=123',
      name: 'Test Playlist',
      status: 'loading',
      progress: 0,
      _statusText: 'Preparing to import playlist...',
      _phase: 'initializing'
    });

    // Get the job
    const job = emitter.getJob(jobId);

    // Verify the job has the correct initial state
    expect(job).toEqual({
      id: jobId,
      url: 'https://www.youtube.com/playlist?list=123',
      name: 'Test Playlist',
      status: 'loading',
      progress: 0,
      _statusText: 'Preparing to import playlist...',
      _phase: 'initializing'
    });

    // Verify the listener was called
    expect(mockListener).toHaveBeenCalled();
  });

  test('should update job during initialization phase with totalVideos undefined', () => {
    // Create a new job
    const jobId = 'test-job-2';
    emitter.updateJob(jobId, {
      id: jobId,
      url: 'https://www.youtube.com/playlist?list=123',
      name: 'Test Playlist',
      status: 'loading',
      progress: 0,
      _statusText: 'Preparing to import playlist...',
      _phase: 'initializing'
    });

    // Update the job with initialization phase update
    emitter.updateJob(jobId, {
      progress: 0,
      totalVideos: undefined, // Should be undefined during initialization
      completedVideos: 0,
      _statusText: 'Found playlist: Test Playlist (50 videos)',
      _phase: 'initializing',
      status: 'loading'
    });

    // Get the job
    const job = emitter.getJob(jobId);

    // Verify the job still has totalVideos undefined
    expect(job).toBeDefined();
    if (job) {
      expect(job.totalVideos).toBeUndefined();
      expect(job._phase).toBe('initializing');
      expect(job.progress).toBe(0);
    }
  });

  test('should update job during processing phase with totalVideos set', () => {
    // Create a new job
    const jobId = 'test-job-3';
    emitter.updateJob(jobId, {
      id: jobId,
      url: 'https://www.youtube.com/playlist?list=123',
      name: 'Test Playlist',
      status: 'loading',
      progress: 0,
      _statusText: 'Preparing to import playlist...',
      _phase: 'initializing'
    });

    // Update the job with processing phase update
    emitter.updateJob(jobId, {
      progress: 25,
      completedVideos: 12,
      totalVideos: 50, // Should be set during processing
      skippedVideos: 0,
      _statusText: 'Processing video 12 of 50...',
      _phase: 'processing',
      status: 'loading'
    });

    // Get the job
    const job = emitter.getJob(jobId);

    // Verify the job has totalVideos set
    expect(job).toBeDefined();
    if (job) {
      expect(job.totalVideos).toBe(50);
      expect(job._phase).toBe('processing');
      expect(job.progress).toBe(25);
      expect(job.completedVideos).toBe(12);
    }
  });

  test('should remove a job', () => {
    // Create a new job
    const jobId = 'test-job-4';
    emitter.updateJob(jobId, {
      id: jobId,
      url: 'https://www.youtube.com/playlist?list=123',
      name: 'Test Playlist',
      status: 'loading',
      progress: 0,
      _statusText: 'Preparing to import playlist...',
      _phase: 'initializing'
    });

    // Remove the job
    emitter.removeJob(jobId);

    // Get the job
    const job = emitter.getJob(jobId);

    // Verify the job is undefined
    expect(job).toBeUndefined();

    // Verify the listener was called
    expect(mockListener).toHaveBeenCalledTimes(2);
  });

  test('should unsubscribe a listener', () => {
    // Create a new job
    const jobId = 'test-job-5';

    // Subscribe a listener
    const unsubscribe = emitter.subscribe(mockListener);

    // Unsubscribe the listener
    unsubscribe();

    // Update a job
    emitter.updateJob(jobId, {
      id: jobId,
      url: 'https://www.youtube.com/playlist?list=123',
      name: 'Test Playlist',
      status: 'loading',
      progress: 0,
      _statusText: 'Preparing to import playlist...',
      _phase: 'initializing'
    });

    // Verify the listener was only called once (from the beforeEach setup)
    expect(mockListener).toHaveBeenCalledTimes(1);
  });
});
