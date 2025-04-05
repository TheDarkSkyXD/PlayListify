import React from 'react';
import { render, screen } from '@testing-library/react';
import { ImportProgressContainer } from '../../../src/frontend/components/common/ImportProgress';

// Mock the store
jest.mock('../../../src/frontend/stores/importStore', () => ({
  useImportStore: jest.fn().mockImplementation((selector) => {
    // Mock store data
    const store = {
      jobs: [
        {
          id: 'job1',
          title: 'Test Job 1',
          progress: 50,
          status: 'processing',
          total: 10,
          completed: 5,
        },
        {
          id: 'job2',
          title: 'Test Job 2',
          progress: 100,
          status: 'completed',
          total: 5,
          completed: 5,
        },
      ],
      isImporting: true,
    };
    return selector(store);
  }),
}));

describe('ImportProgressContainer Component', () => {
  test('renders import progress when importing', () => {
    render(<ImportProgressContainer />);
    
    // Check if the component renders
    expect(screen.getByText('Importing...')).toBeInTheDocument();
    
    // Check if job titles are displayed
    expect(screen.getByText('Test Job 1')).toBeInTheDocument();
    expect(screen.getByText('Test Job 2')).toBeInTheDocument();
    
    // Check if progress information is displayed
    expect(screen.getByText('5/10')).toBeInTheDocument();
    expect(screen.getByText('5/5')).toBeInTheDocument();
  });
  
  test('does not render when not importing', () => {
    // Override the mock to return isImporting: false
    jest.mock('../../../src/frontend/stores/importStore', () => ({
      useImportStore: jest.fn().mockImplementation((selector) => {
        const store = {
          jobs: [],
          isImporting: false,
        };
        return selector(store);
      }),
    }));
    
    render(<ImportProgressContainer />);
    
    // Check if the component is not rendered
    expect(screen.queryByText('Importing...')).not.toBeInTheDocument();
  });
});
