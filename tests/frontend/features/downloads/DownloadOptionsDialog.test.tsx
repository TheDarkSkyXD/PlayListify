import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DownloadOptionsDialog from '../../../../src/frontend/features/downloads/components/DownloadOptionsDialog';
import { Playlist } from '../../../../src/shared/types/appTypes';

// Mock the electron API
window.electron = {
  settings: {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'downloadLocation') return '/test/downloads';
      if (key === 'downloadFormat') return 'mp4';
      if (key === 'maxQuality') return '1080p';
      return null;
    }),
    set: jest.fn().mockResolvedValue(true),
  },
  fs: {
    selectDirectory: jest.fn().mockResolvedValue('/test/selected/path'),
  },
} as any;

// Mock the FormatSelector component
jest.mock('../../../../src/frontend/features/downloads/components/FormatSelector', () => {
  return jest.fn(({ onFormatChange, initialFormat, initialQuality }) => {
    React.useEffect(() => {
      onFormatChange({ format: initialFormat, quality: initialQuality });
    }, [onFormatChange, initialFormat, initialQuality]);

    return (
      <div data-testid="format-selector">
        <div>Format: {initialFormat}</div>
        <div>Quality: {initialQuality}</div>
        <button
          onClick={() => onFormatChange({ format: 'mp3', quality: '720p' })}
          data-testid="change-format-button"
        >
          Change Format
        </button>
      </div>
    );
  });
});

// Mock the toast component
jest.mock('../../../../src/frontend/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock the Lucide icons
jest.mock('lucide-react', () => ({
  Folder: () => <div data-testid="folder-icon">Folder</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  Loader2: () => <div data-testid="loader-icon">Loading</div>,
}));

describe('DownloadOptionsDialog', () => {
  const mockPlaylist: Playlist = {
    id: 'test-playlist-id',
    name: 'Test Playlist',
    description: 'Test Description',
    videos: [
      {
        id: 'video1',
        title: 'Video 1',
        duration: 120,
        downloaded: false,
        status: 'available',
        url: 'https://www.youtube.com/watch?v=video1',
        addedAt: new Date().toISOString()
      },
      {
        id: 'video2',
        title: 'Video 2',
        duration: 180,
        downloaded: true,
        status: 'available',
        url: 'https://www.youtube.com/watch?v=video2',
        addedAt: new Date().toISOString()
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOnOpenChange = jest.fn();
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dialog with default settings', async () => {
    render(
      <DownloadOptionsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        playlist={mockPlaylist}
        onDownload={mockOnDownload}
      />
    );

    // Check if the dialog title is rendered
    expect(screen.getByText('Download Options')).toBeInTheDocument();

    // Check if the playlist name is in the description
    expect(screen.getByText(/Test Playlist/)).toBeInTheDocument();

    // Check if the download location is loaded from settings
    await waitFor(() => {
      expect(window.electron.settings.get).toHaveBeenCalledWith('downloadLocation');
    });

    // Check if the format selector is rendered
    expect(screen.getByTestId('format-selector')).toBeInTheDocument();

    // Check if the video count is displayed
    expect(screen.getByText(/This will download 2 videos/)).toBeInTheDocument();

    // Check if the already downloaded message is displayed
    expect(screen.getByText(/Already downloaded videos will be skipped/)).toBeInTheDocument();
  });

  it('allows selecting a download location', async () => {
    render(
      <DownloadOptionsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        playlist={mockPlaylist}
        onDownload={mockOnDownload}
      />
    );

    // Click the folder button to select a directory
    const folderButton = screen.getByTestId('folder-icon').closest('button');
    if (folderButton) {
      fireEvent.click(folderButton);
    }

    // Check if the selectDirectory function was called
    await waitFor(() => {
      expect(window.electron.fs.selectDirectory).toHaveBeenCalled();
    });
  });

  it('calls onDownload with the correct options when download button is clicked', async () => {
    render(
      <DownloadOptionsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        playlist={mockPlaylist}
        onDownload={mockOnDownload}
      />
    );

    // Wait for the download location to be loaded
    await waitFor(() => {
      expect(window.electron.settings.get).toHaveBeenCalledWith('downloadLocation');
    });

    // Change the format
    const changeFormatButton = screen.getByTestId('change-format-button');
    fireEvent.click(changeFormatButton);

    // Click the download button
    const downloadButton = screen.getByText('Download').closest('button');
    if (downloadButton) {
      fireEvent.click(downloadButton);
    }

    // Check if onDownload was called with the correct options
    expect(mockOnDownload).toHaveBeenCalledWith({
      format: 'mp3',
      quality: '720p',
      downloadLocation: '/test/downloads'
    });
  });

  it('disables the download button when downloading', () => {
    render(
      <DownloadOptionsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        playlist={mockPlaylist}
        onDownload={mockOnDownload}
        isDownloading={true}
      />
    );

    // Check if the download button is disabled
    const downloadButton = screen.getByText('Downloading...').closest('button');
    expect(downloadButton).toBeDisabled();

    // Check if the loading icon is displayed
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });
});
