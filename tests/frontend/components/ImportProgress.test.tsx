import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImportProgressContainer } from '../../../src/frontend/components/common/ImportProgress';
import { importService } from '../../../src/frontend/services/importService';

// Mock the import service
jest.mock('../../../src/frontend/services/importService', () => ({
  importService: {
    subscribeToImports: jest.fn().mockImplementation((callback) => {
      // Mock jobs data
      const jobs = {
        job1: {
          id: 'job1',
          url: 'https://example.com/playlist1',
          name: 'Test Job 1',
          progress: 50,
          status: 'loading',
          totalVideos: 10,
          completedVideos: 5,
          _statusText: 'Processing...',
        },
        job2: {
          id: 'job2',
          url: 'https://example.com/playlist2',
          name: 'Test Job 2',
          progress: 100,
          status: 'success',
          totalVideos: 5,
          completedVideos: 5,
          _statusText: 'Completed',
        },
      };

      // Call the callback with the mock data
      callback(jobs);

      // Return unsubscribe function
      return () => {};
    }),
    markJobAsNotified: jest.fn(),
    removeJob: jest.fn(),
  },
}));

describe('ImportProgressContainer Component', () => {
  test('renders import progress when importing', () => {
    render(<ImportProgressContainer />);

    // Check if job titles are displayed
    expect(screen.getByText('Test Job 1')).toBeInTheDocument();
    expect(screen.getByText('Test Job 2')).toBeInTheDocument();

    // Check if status text is displayed
    expect(screen.getAllByText('Importing 0 of 10 videos...')[0]).toBeInTheDocument();
    expect(screen.getByText('Imported 5 videos')).toBeInTheDocument();

    // Check if progress information is displayed
    expect(screen.getByText('0 of 10 videos')).toBeInTheDocument();
  });

  test('does not render when no jobs are present', () => {
    // Override the mock to return empty jobs
    jest.spyOn(importService, 'subscribeToImports').mockImplementation((callback) => {
      // Call the callback with empty jobs
      callback({});

      // Return unsubscribe function
      return () => {};
    });

    render(<ImportProgressContainer />);

    // Check if the component is not rendered
    expect(screen.queryByText('Importing...')).not.toBeInTheDocument();
  });
});
