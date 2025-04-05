import React from 'react';
import { render, screen } from '@testing-library/react';
import { ImportProgressBar, ImportProgressBarItem } from '../../../../src/frontend/components/ImportProgress/ImportProgressBar';
import { ImportJob } from '../../../../src/frontend/types/importTypes';
import '@testing-library/jest-dom';

// Mock the logger to prevent console output during tests
jest.mock('../../../../src/frontend/utils/logger', () => ({
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

// Mock the importService to prevent actual service calls
jest.mock('../../../../src/frontend/services/importService', () => ({
  importService: {
    removeJob: jest.fn(),
  },
  // We still need to export ImportJob type, but it's just for TypeScript
  // The actual implementation is mocked
}));

describe('ImportProgressBarItem', () => {
  // Test data for different phases
  const initializingJob: ImportJob = {
    id: 'test-job-1',
    url: 'https://www.youtube.com/playlist?list=123',
    name: 'Test Playlist',
    status: 'loading',
    progress: 0,
    completedVideos: 0,
    totalVideos: undefined, // No total videos during initialization
    youtubeTitle: 'Test Playlist',
    _statusText: 'Found playlist: Test Playlist (50 videos)',
    _phase: 'initializing'
  };

  const processingJob: ImportJob = {
    id: 'test-job-2',
    url: 'https://www.youtube.com/playlist?list=123',
    name: 'Test Playlist',
    status: 'loading',
    progress: 25, // 25% progress
    completedVideos: 12,
    totalVideos: 50, // Has total videos during processing
    youtubeTitle: 'Test Playlist',
    _statusText: 'Processing video 12 of 50...',
    _phase: 'processing'
  };

  const completingJob: ImportJob = {
    id: 'test-job-3',
    url: 'https://www.youtube.com/playlist?list=123',
    name: 'Test Playlist',
    status: 'loading',
    progress: 95,
    completedVideos: 50,
    totalVideos: 50,
    youtubeTitle: 'Test Playlist',
    _statusText: 'Creating playlist...',
    _phase: 'completing'
  };

  const successJob: ImportJob = {
    id: 'test-job-4',
    url: 'https://www.youtube.com/playlist?list=123',
    name: 'Test Playlist',
    status: 'success',
    progress: 100,
    completedVideos: 50,
    totalVideos: 50,
    youtubeTitle: 'Test Playlist',
    _statusText: 'Import completed successfully',
    _phase: 'completing'
  };

  // Test for initialization phase
  test('should show pulsing animation during initialization phase', () => {
    render(<ImportProgressBarItem job={initializingJob} />);

    // Should show "Initializing..." text
    expect(screen.getByText('Initializing...')).toBeInTheDocument();

    // Should show "Retrieving playlist information..." text
    expect(screen.getByText('Retrieving playlist information...')).toBeInTheDocument();

    // Should NOT show video count during initialization
    expect(screen.queryByText(/\d+ of \d+ videos/)).not.toBeInTheDocument();

    // Should have a pulsing animation element (check for animate-pulse class)
    const pulsingElement = document.querySelector('.animate-pulse');
    expect(pulsingElement).toBeInTheDocument();

    // Should NOT have a progress bar with a percentage width
    const progressBar = document.querySelector('.bg-\\[\\#FF0000\\]');
    expect(progressBar).not.toBeInTheDocument();
  });

  // Test for processing phase
  test('should show progress bar during processing phase', () => {
    render(<ImportProgressBarItem job={processingJob} />);

    // Should show percentage text
    expect(screen.getByText('25%')).toBeInTheDocument();

    // Should show video count during processing
    expect(screen.getByText('12 of 50 videos')).toBeInTheDocument();

    // Should NOT have a pulsing animation element
    const pulsingElement = document.querySelector('.animate-pulse');
    expect(pulsingElement).not.toBeInTheDocument();

    // Should have a progress bar with a percentage width
    const progressBar = document.querySelector('.bg-\\[\\#FF0000\\]');
    expect(progressBar).toBeInTheDocument();

    // Progress bar should have the correct width
    expect(progressBar).toHaveStyle('width: 25%');
  });

  // Test for completing phase
  test('should show progress bar during completing phase', () => {
    render(<ImportProgressBarItem job={completingJob} />);

    // Should show "Preparing..." text
    expect(screen.getByText('Preparing...')).toBeInTheDocument();

    // Should show the status text - use queryAllByText to handle multiple elements
    expect(screen.queryAllByText('Creating playlist...').length).toBeGreaterThan(0);

    // Should NOT have a pulsing animation element
    const pulsingElement = document.querySelector('.animate-pulse');
    expect(pulsingElement).not.toBeInTheDocument();
  });

  // Test for success state
  test('should show success message when import is successful', () => {
    render(<ImportProgressBarItem job={successJob} />);

    // Should show the success message
    expect(screen.getByText('Import completed successfully')).toBeInTheDocument();

    // Should NOT have a progress bar or pulsing animation
    const progressContainer = document.querySelector('.h-2');
    expect(progressContainer).not.toBeInTheDocument();
  });

  // Test that totalVideos is ignored during initialization phase
  test('should ignore totalVideos during initialization phase', () => {
    // Create a job that has totalVideos set but is still in initialization phase
    const jobWithTotalVideos: ImportJob = {
      ...initializingJob,
      totalVideos: 50, // Set totalVideos even though we're in initialization
    };

    render(<ImportProgressBarItem job={jobWithTotalVideos} />);

    // Should still show "Initializing..." text
    expect(screen.getByText('Initializing...')).toBeInTheDocument();

    // Should still NOT show video count during initialization
    expect(screen.queryByText(/\d+ of \d+ videos/)).not.toBeInTheDocument();

    // Should still have a pulsing animation element
    const pulsingElement = document.querySelector('.animate-pulse');
    expect(pulsingElement).toBeInTheDocument();

    // Should still NOT have a progress bar with a percentage width
    const progressBar = document.querySelector('.bg-\\[\\#FF0000\\]');
    expect(progressBar).not.toBeInTheDocument();
  });

  // Test that progress bar only shows when status text explicitly says "Processing video X of Y"
  test('should only show progress bar when status text explicitly says "Processing video X of Y"', () => {
    // Create a job that's in processing phase but doesn't have the right status text
    const jobWithWrongStatusText: ImportJob = {
      ...processingJob,
      _statusText: 'Preparing to process videos...', // Wrong status text
    };

    render(<ImportProgressBarItem job={jobWithWrongStatusText} />);

    // Should NOT show percentage text
    expect(screen.queryByText('25%')).not.toBeInTheDocument();

    // Should NOT show video count
    expect(screen.queryByText(/\d+ of \d+ videos/)).not.toBeInTheDocument();

    // Should NOT have a progress bar with a percentage width
    const progressBar = document.querySelector('.bg-\\[\\#FF0000\\]');
    expect(progressBar).not.toBeInTheDocument();

    // Now render with the correct status text
    const jobWithCorrectStatusText: ImportJob = {
      ...processingJob,
      _statusText: 'Processing video 12 of 50...', // Correct status text
    };

    render(<ImportProgressBarItem job={jobWithCorrectStatusText} />);

    // Should show percentage text
    expect(screen.getByText('25%')).toBeInTheDocument();

    // Should show video count
    expect(screen.getByText('12 of 50 videos')).toBeInTheDocument();

    // Should have a progress bar with a percentage width
    const progressBarWithCorrectText = document.querySelector('.bg-\\[\\#FF0000\\]');
    expect(progressBarWithCorrectText).toBeInTheDocument();
  });
});
