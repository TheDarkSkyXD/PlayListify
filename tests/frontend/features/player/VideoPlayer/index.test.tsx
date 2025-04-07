import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoPlayer from '../../../../../src/frontend/features/player/components/VideoPlayer';

// Mock the UI components
jest.mock('../../../../../src/frontend/components/ui/slider', () => {
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

jest.mock('../../../../../src/frontend/components/ui/button', () => {
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
jest.mock('../../../../../src/frontend/utils/formatting', () => ({
  formatDuration: (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },
}));

// Mock the cn utility
jest.mock('../../../../../src/frontend/utils/cn', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}));

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

// Mock the window.api
window.api = {
  settings: {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'defaultVolume') return 0.8;
      if (key === 'defaultMuted') return false;
      if (key === 'downloadLocation') return '/test/path';
      return null;
    }),
    set: jest.fn().mockResolvedValue(true),
    getAll: jest.fn().mockResolvedValue({}),
  },
  playlists: {
    getById: jest.fn().mockResolvedValue({
      id: 'test-playlist-id',
      name: 'Test Playlist',
      videos: [
        {
          id: 'test-video-id',
          title: 'Test Video',
          url: 'https://www.youtube.com/watch?v=test-video-id',
          downloaded: false,
          status: 'available',
        },
      ],
    }),
  },
  receive: jest.fn(),
} as any;

describe('VideoPlayer (refactored)', () => {
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
    expect(player).toHaveAttribute('data-playing', 'false'); // Initial state before user interaction
    expect(player).toHaveAttribute('data-volume', '0.8'); // defaultVolume is 0.8
    expect(player).toHaveAttribute('data-muted', 'false');
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

  it('handles YouTube videos correctly', async () => {
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

    // Check if ReactPlayer is rendered with the YouTube URL
    const player = screen.getByTestId('react-player');
    expect(player).toHaveAttribute('data-url', 'https://www.youtube.com/watch?v=test-video-id');
  });
});
