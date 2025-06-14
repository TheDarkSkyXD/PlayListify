// jest.setup.ts
import '@testing-library/jest-dom'; // Provides .toBeInTheDocument() etc.
import { IpcResponse } from './src/shared/types'; // Adjust path if necessary

// Define a helper for creating mock IpcResponse
const createMockIpcResponse = <T>(data: T, success = true, error?: string): IpcResponse<T> => ({
  success,
  data,
  error: success ? undefined : { message: error || 'Mocked IPC Error' },
});
// Mock the global window.api object
const mockApi = {
  // App Handlers
  getAppStatus: jest.fn(() => Promise.resolve(createMockIpcResponse({ version: '1.0.0-test' }))),
  getAppPath: jest.fn((pathName: string) => Promise.resolve(createMockIpcResponse(`/mock/app/${pathName}`))),

  // Settings Handlers
  getSettings: jest.fn(() => Promise.resolve(createMockIpcResponse({ theme: 'dark', downloadPath: '/mock/downloads' }))),
  saveSettings: jest.fn((settings) => Promise.resolve(createMockIpcResponse(settings))),
  getSetting: jest.fn((key) => Promise.resolve(createMockIpcResponse(`mock-setting-${key}`))), // Simplified mock
  setSetting: jest.fn((key, value) => Promise.resolve(createMockIpcResponse(value))),
  openDialog: jest.fn(() => Promise.resolve({ canceled: false, filePaths: ['/mock/selected-path'] })),

  // File Handlers
  checkFileExists: jest.fn((filePath: string) => Promise.resolve(createMockIpcResponse(true))),
  createDirectory: jest.fn((dirPath: string) => Promise.resolve(createMockIpcResponse(true))),

  // Download Handlers (add more specific mocks as needed)
  downloadVideo: jest.fn((request) => Promise.resolve(createMockIpcResponse({ id: 'mock-download-id', ...request, status: 'completed', progress: 100 }))),
  getDownloadQueue: jest.fn(() => Promise.resolve(createMockIpcResponse([]))),
  pauseDownload: jest.fn(() => Promise.resolve(createMockIpcResponse(true))),
  resumeDownload: jest.fn(() => Promise.resolve(createMockIpcResponse(true))),
  cancelDownload: jest.fn(() => Promise.resolve(createMockIpcResponse(true))),
  clearFinishedDownloads: jest.fn(() => Promise.resolve(createMockIpcResponse(true))),

  // Playlist Handlers (add more specific mocks as needed)
  getAllPlaylists: jest.fn(() => Promise.resolve(createMockIpcResponse({ data: [], total: 0, page: 1, limit: 10 }))),
  getPlaylistById: jest.fn((id) => Promise.resolve(createMockIpcResponse({ id, name: 'Mock Playlist', videos: [] }))),
  createPlaylist: jest.fn((input) => Promise.resolve(createMockIpcResponse({ id: 'new-mock-playlist', ...input, videos: [] }))),
  updatePlaylist: jest.fn((id, update) => Promise.resolve(createMockIpcResponse({ id, ...update, videos: [] }))),
  deletePlaylist: jest.fn(() => Promise.resolve(createMockIpcResponse(true))),
  addVideoToPlaylist: jest.fn((playlistId, video) => Promise.resolve(createMockIpcResponse({ id: playlistId, name: 'Mock Playlist', videos: [video] }))),
  removeVideoFromPlaylist: jest.fn((playlistId) => Promise.resolve(createMockIpcResponse({ id: playlistId, name: 'Mock Playlist', videos: [] }))),
  importYouTubePlaylist: jest.fn((url) => Promise.resolve(createMockIpcResponse({ id: 'imported-playlist', name: 'Imported YT Playlist', videos: []}))),

  // Thumbnail Handlers
  getThumbnail: jest.fn((videoId: string) => Promise.resolve(createMockIpcResponse(`data:image/png;base64,mockthumbnail${videoId}`))),
  cacheThumbnail: jest.fn((videoId: string, thumbnailUrl: string) => Promise.resolve(createMockIpcResponse(thumbnailUrl))),

  // IPC listeners
  on: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

// Assign the mock to window.api
Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true, // Allow tests to override specific mocks if needed
});

// You might also need to mock other global objects if your components use them,
// e.g., localStorage, matchMedia, etc.
// Object.defineProperty(window, 'matchMedia', {
//   writable: true,
//   value: jest.fn().mockImplementation(query => ({
//     matches: false,
//     media: query,
//     onchange: null,
//     addListener: jest.fn(), // deprecated
//     removeListener: jest.fn(), // deprecated
//     addEventListener: jest.fn(),
//     removeEventListener: jest.fn(),
//     dispatchEvent: jest.fn(),
//   })),
// });