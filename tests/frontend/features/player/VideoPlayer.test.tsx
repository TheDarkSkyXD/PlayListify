import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import Jest DOM matchers
import VideoPlayer from '../../../../src/frontend/features/player/components/VideoPlayer';

// Mock ReactPlayer
jest.mock('react-player', () => {
  return jest.fn().mockImplementation(({ children, ...props }) => {
    return (
      <div data-testid="react-player" {...props}>
        {children}
      </div>
    );
  });
});

// Mock the window.api calls
const mockApi = {
  playlists: {
    getById: jest.fn().mockResolvedValue({
      id: 'playlist-1',
      name: 'Test Playlist',
      videos: [
        { id: 'video-1', title: 'Test Video 1', url: 'https://example.com/video1.mp4' }
      ]
    })
  },
  settings: {
    get: jest.fn().mockResolvedValue('/mock/download/path')
  },
  fs: {
    videoExists: jest.fn().mockResolvedValue(true)
  }
};

// Add the mock api to window
Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true
});

describe('VideoPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<VideoPlayer videoId="video-1" playlistId="playlist-1" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders player when video URL is provided', async () => {
    render(<VideoPlayer videoId="video-1" videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('react-player')).toBeInTheDocument();
    });
  });

  it('renders player with title when provided', async () => {
    render(
      <VideoPlayer 
        videoId="video-1" 
        videoUrl="https://example.com/video.mp4" 
        title="Test Video Title" 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Video Title')).toBeInTheDocument();
    });
  });

  it('renders YouTube player for YouTube URLs', async () => {
    render(
      <VideoPlayer 
        videoId="dQw4w9WgXcQ" 
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
      />
    );
    
    await waitFor(() => {
      const player = screen.getByTestId('react-player');
      expect(player).toBeInTheDocument();
      expect(player).toHaveAttribute('url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });
  });

  it('renders navigation buttons when hasNext/hasPrevious are true', async () => {
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    
    render(
      <VideoPlayer 
        videoId="video-1" 
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        hasNext={true}
        hasPrevious={true}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });
    
    // Test click handlers
    fireEvent.click(screen.getByText('Next'));
    expect(onNext).toHaveBeenCalledTimes(1);
    
    fireEvent.click(screen.getByText('Previous'));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('shows error state when video fails to load', async () => {
    // Mock videoExists to return false to trigger error
    mockApi.fs.videoExists.mockResolvedValueOnce(false);
    mockApi.playlists.getById.mockResolvedValueOnce({
      id: 'playlist-1',
      name: 'Test Playlist',
      videos: []
    });
    
    render(<VideoPlayer videoId="non-existent" playlistId="playlist-1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load video/)).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });
}); 