import { crudOperations } from './crud';
import { importOperations } from './import';
import { videoOperations } from './videos';
import { downloadOperations } from './download';
import { qualityOperations } from './quality';

/**
 * Service to manage playlists using the electron IPC bridge
 */
export const playlistService = {
  // CRUD operations
  getPlaylists: crudOperations.getPlaylists,
  getPlaylist: crudOperations.getPlaylist,
  createPlaylist: crudOperations.createPlaylist,
  updatePlaylist: crudOperations.updatePlaylist,
  deletePlaylist: crudOperations.deletePlaylist,

  // Import operations
  importPlaylist: importOperations.importPlaylist,

  // Video operations
  addVideoToPlaylist: videoOperations.addVideoToPlaylist,
  removeVideoFromPlaylist: videoOperations.removeVideoFromPlaylist,
  downloadVideo: videoOperations.downloadVideo,

  // Download operations
  downloadPlaylist: downloadOperations.downloadPlaylist,

  // Quality operations
  updateVideoQuality: qualityOperations.updateVideoQuality,
  updatePlaylistVideoQualities: qualityOperations.updatePlaylistVideoQualities,
  updateAllVideoQualities: qualityOperations.updateAllVideoQualities,
};

export default playlistService;
