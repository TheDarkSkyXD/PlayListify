import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoPlayer from '../../../../src/frontend/features/player/components/VideoPlayer';

// Mock the UI components
jest.mock('../../../../src/frontend/components/ui/slider', () => {
  return {
    Slider: ({ value, onValueChange, onValueCommit, className }: any) => (
      <div data-testid="slider" data-value={value} className={className}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value[0]}
          onChange={(e) => onValueChange([parseFloat(e.target.value)])}
          onMouseUp={(e) => onValueCommit([parseFloat((e.target as HTMLInputElement).value)])}
        />
      </div>
    ),
  };
});

jest.mock('../../../../src/frontend/components/ui/button', () => {
  return {
    Button: ({ children, onClick, className, disabled }: any) => (
      <button
        onClick={onClick}
        className={className}
        disabled={disabled}
      >
        {children}
      </button>
    ),
  };
});

jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="play-icon">Play</span>,
  Pause: () => <span data-testid="pause-icon">Pause</span>,
  Volume2: () => <span data-testid="volume-icon">Volume</span>,
  VolumeX: () => <span data-testid="mute-icon">Mute</span>,
  Maximize: () => <span data-testid="fullscreen-icon">Fullscreen</span>,
  SkipBack: () => <span data-testid="previous-icon">Previous</span>,
  SkipForward: () => <span data-testid="next-icon">Next</span>,
}));

// Mock the formatting utility
jest.mock('../../../../src/frontend/utils/formatting', () => ({
  formatDuration: (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },
}));

// Mock the cn utility
jest.mock('../../../../src/frontend/utils/cn', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}));

// Mock the electron API
window.electron = {
  settings: {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'defaultVolume') return 80;
      if (key === 'autoPlay') return true;
      if (key === 'downloadLocation') return '/test/path';
      return null;
    }),
    set: jest.fn().mockResolvedValue(true),
  },
  fs: {
    videoExists: jest.fn().mockResolvedValue(true),
  },
  playlists: {
    getById: jest.fn().mockResolvedValue({
      id: 'test-playlist-id',
      name: 'Test Playlist',
      videos: [],
    }),
  },
} as any;

// Mock ReactPlayer
jest.mock('react-player', () => {
  return jest.fn().mockImplementation(({ url, playing, volume, muted, onProgress, onDuration }) => {
    return (
      <div data-testid="react-player" data-url={url} data-playing={playing} data-volume={volume} data-muted={muted}>
        <button onClick={() => onProgress({ played: 0.5, playedSeconds: 60, loaded: 1, loadedSeconds: 120 })}>
          Trigger Progress
        </button>
        <button onClick={() => onDuration(120)}>Set Duration</button>
      </div>
    );
  });
});

describe('VideoPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the video player with correct props', async () => {
    render(
      <VideoPlayer
        videoId="test-video-id"
        playlistId="test-playlist-id"
        videoUrl="https://www.youtube.com/watch?v=test-video-id"
        title="Test Video"
      />
    );

    // Wait for the component to load
    await screen.findByTestId('react-player');

    // Check if ReactPlayer is rendered with correct props
    const player = screen.getByTestId('react-player');
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute('data-playing', 'true'); // autoPlay is true
    expect(player).toHaveAttribute('data-volume', '0.8'); // defaultVolume is 80
    expect(player).toHaveAttribute('data-muted', 'false');
  });

  it('handles play/pause toggle', async () => {
    render(
      <VideoPlayer
        videoId="test-video-id"
        playlistId="test-playlist-id"
        videoUrl="https://www.youtube.com/watch?v=test-video-id"
        title="Test Video"
      />
    );

    // Wait for the component to load
    await screen.findByTestId('react-player');

    // Find the play/pause button
    const playPauseButton = screen.getByRole('button', { name: /play|pause/i });

    // Initial state should be playing (autoPlay is true)
    expect(screen.getByTestId('react-player')).toHaveAttribute('data-playing', 'true');

    // Click to pause
    fireEvent.click(playPauseButton);
    expect(screen.getByTestId('react-player')).toHaveAttribute('data-playing', 'false');

    // Click to play again
    fireEvent.click(playPauseButton);
    expect(screen.getByTestId('react-player')).toHaveAttribute('data-playing', 'true');
  });

  it('handles mute toggle', async () => {
    render(
      <VideoPlayer
        videoId="test-video-id"
        playlistId="test-playlist-id"
        videoUrl="https://www.youtube.com/watch?v=test-video-id"
        title="Test Video"
      />
    );

    // Wait for the component to load
    await screen.findByTestId('react-player');

    // Find the mute button by finding the button that contains the volume icon
    const muteButton = screen.getByTestId('volume-icon').closest('button');

    // Initial state should be unmuted
    expect(screen.getByTestId('react-player')).toHaveAttribute('data-muted', 'false');

    // Click to mute
    if (muteButton) {
      fireEvent.click(muteButton);
      expect(screen.getByTestId('react-player')).toHaveAttribute('data-muted', 'true');

      // Click to unmute
      fireEvent.click(muteButton);
      expect(screen.getByTestId('react-player')).toHaveAttribute('data-muted', 'false');
    }
  });

  it('displays error state when video fails to load', async () => {
    // Mock the videoExists function to return false
    (window.electron.fs.videoExists as jest.Mock).mockResolvedValueOnce(false);

    render(
      <VideoPlayer
        videoId="test-video-id"
        playlistId="test-playlist-id"
        title="Test Video"
      />
    );

    // Wait for the error message to appear
    const errorMessage = await screen.findByText(/Failed to load video/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('displays the video title', async () => {
    render(
      <VideoPlayer
        videoId="test-video-id"
        playlistId="test-playlist-id"
        videoUrl="https://www.youtube.com/watch?v=test-video-id"
        title="Test Video Title"
      />
    );

    // Wait for the component to load
    await screen.findByTestId('react-player');

    // Check if the title is displayed
    const title = screen.getByText('Test Video Title');
    expect(title).toBeInTheDocument();
  });
});
