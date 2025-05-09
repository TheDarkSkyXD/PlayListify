CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL CHECK(source IN ('custom', 'youtube')),
  itemCount INTEGER DEFAULT 0,
  youtubePlaylistId TEXT UNIQUE, 
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY, 
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  channel TEXT,
  duration INTEGER, 
  thumbnailUrl TEXT,
  isAvailable BOOLEAN DEFAULT TRUE,
  isDownloaded BOOLEAN DEFAULT FALSE,
  localFilePath TEXT,
  downloadStatus TEXT, 
  downloadProgress INTEGER, 
  lastWatchedAt TEXT,
  watchProgress REAL, 
  addedAt TEXT NOT NULL 
);

CREATE TABLE IF NOT EXISTS playlist_videos (
  playlistId TEXT NOT NULL,
  videoId TEXT NOT NULL,
  position INTEGER NOT NULL, 
  addedToPlaylistAt TEXT NOT NULL,
  PRIMARY KEY (playlistId, videoId),
  FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (videoId) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlistId_position ON playlist_videos (playlistId, position); 