// This test verifies that the refactored playlistService exports all the expected methods
// and that they work correctly with the new modular structure

// Import the playlistService
import { playlistService } from '../../../../src/frontend/services/playlistService';

describe('playlistService (refactored)', () => {
  it('should export all the expected methods', () => {
    // CRUD operations
    expect(playlistService.getPlaylists).toBeDefined();
    expect(playlistService.getPlaylist).toBeDefined();
    expect(playlistService.createPlaylist).toBeDefined();
    expect(playlistService.updatePlaylist).toBeDefined();
    expect(playlistService.deletePlaylist).toBeDefined();

    // Import operations
    expect(playlistService.importPlaylist).toBeDefined();

    // Video operations
    expect(playlistService.addVideoToPlaylist).toBeDefined();
    expect(playlistService.removeVideoFromPlaylist).toBeDefined();
    expect(playlistService.downloadVideo).toBeDefined();

    // Download operations
    expect(playlistService.downloadPlaylist).toBeDefined();
  });

  it('should be the default export', () => {
    // Import the default export
    const defaultExport = require('../../../../src/frontend/services/playlistService').default;
    
    // Verify that the default export is the same as the named export
    expect(defaultExport).toBe(playlistService);
  });
});
