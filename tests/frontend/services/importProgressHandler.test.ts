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

// Mock window.api
const mockApi = {
  receive: jest.fn(),
  send: jest.fn(),
  youtube: {
    importPlaylist: jest.fn(),
  },
};

// Save the original window object
const originalWindow = global.window;

// Define a mock window object
Object.defineProperty(global, 'window', {
  value: {
    api: mockApi,
  },
  writable: true,
});

describe('Progress Handler', () => {
  let emitter: ImportEventEmitter;
  let jobId: string;

  beforeEach(() => {
    // Create a new emitter for each test
    emitter = new ImportEventEmitter();
    jobId = 'test-job-1';

    // Create a new job
    emitter.updateJob(jobId, {
      id: jobId,
      url: 'https://www.youtube.com/playlist?list=123',
      name: 'Test Playlist',
      status: 'loading',
      progress: 0,
      _statusText: 'Preparing to import playlist...',
      _phase: 'initializing'
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore the original window object
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
    });
  });

  test('should handle initialization phase progress update correctly', () => {
    // Create a progress update for initialization phase
    const progressData = {
      status: 'Found playlist: Test Playlist (50 videos)',
      count: 0,
      total: 50,
    };

    // Handle the progress update
    handleProgressUpdate(emitter, jobId, progressData);

    // Get the updated job
    const job = emitter.getJob(jobId);

    // Verify the job was updated correctly
    expect(job._phase).toBe('initializing');
    expect(job.progress).toBe(0);
    expect(job.totalVideos).toBeUndefined(); // Should be undefined during initialization
    expect(job._statusText).toBe('Found playlist: Test Playlist (50 videos)');
  });

  test('should handle processing phase progress update correctly', () => {
    // Create a progress update for processing phase
    const progressData = {
      status: 'Processing video 12 of 50...',
      count: 12,
      total: 50,
    };

    // Handle the progress update
    handleProgressUpdate(emitter, jobId, progressData);

    // Get the updated job
    const job = emitter.getJob(jobId);

    // Verify the job was updated correctly
    expect(job._phase).toBe('processing');
    expect(job.progress).toBe(24); // 12/50 = 24%
    expect(job.totalVideos).toBe(50); // Should be set during processing
    expect(job.completedVideos).toBe(12);
    expect(job._statusText).toBe('Processing video 12 of 50...');
  });

  test('should handle completing phase progress update correctly', () => {
    // Create a progress update for completing phase
    const progressData = {
      status: 'Creating playlist...',
      count: 50,
      total: 50,
    };

    // Handle the progress update
    handleProgressUpdate(emitter, jobId, progressData);

    // Get the updated job
    const job = emitter.getJob(jobId);

    // Verify the job was updated correctly
    expect(job._phase).toBe('completing');
    expect(job.progress).toBe(100); // 50/50 = 100%
    expect(job.totalVideos).toBe(50);
    expect(job.completedVideos).toBe(50);
    expect(job._statusText).toBe('Creating playlist...');
  });

  test('should ignore totalVideos during initialization even if provided', () => {
    // Create a progress update for initialization phase with total videos
    const progressData = {
      status: 'Preparing to retrieve videos...',
      count: 0,
      total: 50, // Backend provides total, but we should ignore it during initialization
    };

    // Handle the progress update
    handleProgressUpdate(emitter, jobId, progressData);

    // Get the updated job
    const job = emitter.getJob(jobId);

    // Verify the job was updated correctly
    expect(job._phase).toBe('initializing');
    expect(job.progress).toBe(0);
    expect(job.totalVideos).toBeUndefined(); // Should still be undefined
    expect(job._statusText).toBe('Preparing to retrieve videos...');
  });

  test('should detect processing phase from status text', () => {
    // Create a progress update with processing phase status text
    const progressData = {
      status: 'Processing video 1 of 50...',
      count: 1,
      total: 50,
    };

    // Handle the progress update
    handleProgressUpdate(emitter, jobId, progressData);

    // Get the updated job
    const job = emitter.getJob(jobId);

    // Verify the job was updated correctly
    expect(job._phase).toBe('processing'); // Should detect processing phase
    expect(job.totalVideos).toBe(50); // Should set totalVideos
  });
});

// Helper function to simulate the progress handler
function handleProgressUpdate(
  emitter: ImportEventEmitter,
  jobId: string,
  progressData: { status: string; count: number; total: number }
) {
  // Extract data from the progress update
  const { status: statusText, count: currentProgress, total: totalItems } = progressData;

  // Calculate progress percentage (0-100)
  const progressValue = Math.floor((currentProgress / totalItems) * 100);

  // Determine the current phase based on the status text
  let currentPhase: 'initializing' | 'processing' | 'completing' = 'initializing';

  // Detect processing phase from status text
  if (statusText.match(/Processing video \d+ of \d+/)) {
    currentPhase = 'processing';
  } else if (
    statusText.includes('Import complete') ||
    statusText.includes('Creating playlist') ||
    statusText.includes('Saving playlist')
  ) {
    currentPhase = 'completing';
  }

  // Determine if we're in each phase
  const isInitializingPhase = currentPhase === 'initializing';
  const isProcessingPhase = currentPhase === 'processing';
  const isCompletingPhase = currentPhase === 'completing';

  // Update the job based on the current phase
  if (isInitializingPhase) {
    // For initialization updates, don't show progress or video counts
    emitter.updateJob(jobId, {
      // Reset progress to 0 during initialization
      progress: 0,
      // IMPORTANT: Explicitly set totalVideos to undefined during initialization
      totalVideos: undefined,
      // Don't update completedVideos here
      completedVideos: 0,
      // Add a custom status message to show in the UI
      _statusText: statusText,
      // Update the phase to initializing
      _phase: 'initializing',
      // Ensure the status is still 'loading'
      status: 'loading',
    });
  } else if (isProcessingPhase) {
    // Update the job with the latest information including video counts
    emitter.updateJob(jobId, {
      progress: progressValue,
      completedVideos: currentProgress,
      skippedVideos: 0,
      // IMPORTANT: Only set totalVideos when we're in processing phase
      totalVideos: totalItems,
      // Add a custom status message to show in the progress UI
      _statusText: statusText,
      // Update the phase to processing
      _phase: 'processing',
      // Ensure the status is still 'loading'
      status: 'loading',
    });
  } else if (isCompletingPhase) {
    // Update the job with the latest information
    emitter.updateJob(jobId, {
      progress: progressValue,
      completedVideos: currentProgress,
      totalVideos: totalItems,
      // Add a custom status message to show in the progress UI
      _statusText: statusText,
      // Update the phase to completing
      _phase: 'completing',
      // Ensure the status is still 'loading'
      status: 'loading',
    });
  }
}
