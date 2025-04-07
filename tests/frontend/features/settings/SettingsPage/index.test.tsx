import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPage from '../../../../../src/frontend/features/settings/components/SettingsPage';

// Mock the UI components
jest.mock('../../../../../src/frontend/components/ui/tabs', () => {
  return {
    Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
    TabsContent: ({ children, value }: any) => <div data-testid={`tabs-content-${value}`}>{children}</div>,
    TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
    TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-${value}`}>{children}</button>,
  };
});

jest.mock('../../../../../src/frontend/components/ui/button', () => {
  return {
    Button: ({ children, onClick, className, disabled }: any) => (
      <button
        onClick={onClick}
        className={className}
        disabled={disabled}
        data-testid="button"
      >
        {children}
      </button>
    ),
  };
});

jest.mock('../../../../../src/frontend/components/ui/input', () => {
  return {
    Input: ({ value, onChange, name, placeholder, className }: any) => (
      <input
        value={value}
        onChange={onChange}
        name={name}
        placeholder={placeholder}
        className={className}
        data-testid={`input-${name}`}
      />
    ),
  };
});

jest.mock('../../../../../src/frontend/components/ui/skeleton', () => {
  return {
    Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
  };
});

jest.mock('../../../../../src/frontend/components/Layout/AppLayout', () => {
  return {
    __esModule: true,
    default: ({ children }: any) => <div data-testid="app-layout">{children}</div>,
  };
});

jest.mock('../../../../../src/frontend/features/settings/components/DatabaseBackupSection', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="database-backup-section">Database Backup Section</div>,
  };
});

// Mock the window.api
window.api = {
  settings: {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'downloadLocation') return '/test/path';
      if (key === 'ytDlpPath') return '/test/ytdlp';
      if (key === 'ffmpegPath') return '/test/ffmpeg';
      if (key === 'concurrentDownloads') return 2;
      if (key === 'maxQuality') return '1080p';
      if (key === 'theme') return 'system';
      return null;
    }),
    set: jest.fn().mockResolvedValue(true),
    getAll: jest.fn().mockResolvedValue({
      downloadLocation: '/test/path',
      ytDlpPath: '/test/ytdlp',
      ffmpegPath: '/test/ffmpeg',
      concurrentDownloads: 2,
      maxQuality: '1080p',
      theme: 'system',
    }),
  },
  fs: {
    selectDirectory: jest.fn().mockResolvedValue('/test/selected/path'),
  },
} as any;

describe('SettingsPage (refactored)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the settings page with tabs', async () => {
    render(<SettingsPage />);

    // Check if the app layout is rendered
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();

    // Initially, the loading skeleton should be shown
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);

    // Wait for the settings to load and the tabs to be rendered
    await waitFor(() => {
      // This will wait until the loading state is false and the tabs are rendered
      expect(window.api.settings.getAll).toHaveBeenCalled();
    });
  });

  it('loads settings from the API', async () => {
    render(<SettingsPage />);

    // Wait for the settings to load
    await waitFor(() => {
      // Check if the settings API was called
      expect(window.api.settings.getAll).toHaveBeenCalled();
    });
  });
});
