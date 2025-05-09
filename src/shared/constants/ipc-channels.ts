export const IPC_CHANNELS = {
  // App Handlers
  GET_APP_VERSION: 'get-app-version',
  GET_APP_PATH: 'get-app-path',

  // Settings Handlers
  GET_SETTING: 'get-setting',
  SET_SETTING: 'set-setting',
  GET_ALL_SETTINGS: 'get-all-settings',
  RESET_ALL_SETTINGS: 'reset-all-settings',

  // File Handlers
  OPEN_DIRECTORY_DIALOG: 'file:open-directory-dialog',
  CREATE_PLAYLIST_DIR: 'file:create-playlist-dir',
  WRITE_PLAYLIST_METADATA: 'file:write-playlist-metadata',
  READ_PLAYLIST_METADATA: 'file:read-playlist-metadata',
  DELETE_PLAYLIST_DIR: 'file:delete-playlist-dir',
  GET_VIDEO_PATH: 'file:get-video-path',
  VIDEO_FILE_EXISTS: 'file:video-file-exists',
  DELETE_VIDEO_FILE: 'file:delete-video-file',

  // Download Handlers
  DOWNLOAD_ADD_ITEM: 'download:add-item',
  DOWNLOAD_PAUSE_ITEM: 'download:pause-item',
  DOWNLOAD_RESUME_ITEM: 'download:resume-item',
  DOWNLOAD_CANCEL_ITEM: 'download:cancel-item',
  DOWNLOAD_RETRY_ITEM: 'download:retry-item',
  DOWNLOAD_REMOVE_ITEM: 'download:remove-item',
  DOWNLOAD_GET_ALL_ITEMS: 'download:get-all-items',
  DOWNLOAD_CLEAR_COMPLETED: 'download:clear-completed',
  DOWNLOAD_PROGRESS_UPDATE: 'download:progress-update', // For events from main to renderer

  // Playlist Handlers
  PLAYLIST_GET_ALL: 'playlist:get-all',
  PLAYLIST_GET_BY_ID: 'playlist:get-by-id',
  PLAYLIST_CREATE: 'playlist:create',
  PLAYLIST_UPDATE_DETAILS: 'playlist:update-details',
  PLAYLIST_DELETE: 'playlist:delete',
  PLAYLIST_ADD_VIDEO: 'playlist:add-video',
  PLAYLIST_REMOVE_VIDEO: 'playlist:remove-video',
  PLAYLIST_REORDER_VIDEOS: 'playlist:reorder-videos',
  PLAYLIST_IMPORT_FROM_URL: 'playlist:import-from-url',
  PLAYLIST_GET_VIDEOS: 'playlist:get-videos',

  // Thumbnail Handlers
  THUMBNAIL_GET_FOR_VIDEO: 'thumbnail:get-for-video',
  THUMBNAIL_GET_FOR_PLAYLIST: 'thumbnail:get-for-playlist',
  THUMBNAIL_CLEAR_CACHE: 'thumbnail:clear-cache',

  // Add other channel groups as needed (thumbnail)
}; 