// Define all IPC channels here to avoid typos and ensure consistency
export const IPC_CHANNELS = {
  // App
  PING: 'ping',
  APP_INFO: 'app:info',
  
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',
  SETTINGS_RESET: 'settings:reset',
  
  // Playlists
  PLAYLIST_CREATE: 'playlist:create',
  PLAYLIST_IMPORT: 'playlist:import',
  PLAYLIST_GET_ALL: 'playlist:get-all',
  PLAYLIST_GET: 'playlist:get',
  PLAYLIST_UPDATE: 'playlist:update',
  PLAYLIST_DELETE: 'playlist:delete',
  PLAYLIST_REFRESH: 'playlist:refresh',
  PLAYLIST_EXPORT: 'playlist:export',
  
  // Videos
  VIDEO_GET: 'video:get',
  VIDEO_ADD: 'video:add',
  VIDEO_REMOVE: 'video:remove',
  VIDEO_UPDATE_POSITION: 'video:update-position',
  
  // Downloads
  DOWNLOAD_ADD: 'download:add',
  DOWNLOAD_CANCEL: 'download:cancel',
  DOWNLOAD_PAUSE: 'download:pause',
  DOWNLOAD_RESUME: 'download:resume',
  DOWNLOAD_GET_STATUS: 'download:get-status',
  DOWNLOAD_GET_ALL: 'download:get-all',
  DOWNLOAD_GET_FORMATS: 'download:get-formats',
  
  // History
  HISTORY_ADD: 'history:add',
  HISTORY_GET: 'history:get',
  HISTORY_GET_ALL: 'history:get-all',
  HISTORY_CLEAR: 'history:clear',
  
  // Events (from main to renderer)
  EVENT_DOWNLOAD_PROGRESS: 'event:download-progress',
  EVENT_DOWNLOAD_COMPLETE: 'event:download-complete',
  EVENT_DOWNLOAD_ERROR: 'event:download-error',
  EVENT_APP_UPDATE_AVAILABLE: 'event:app-update-available',
} as const;

// Type for IPC channel names
export type IpcChannel = keyof typeof IPC_CHANNELS; 