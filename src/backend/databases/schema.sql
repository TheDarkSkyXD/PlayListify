CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL CHECK(source IN ('custom', 'youtube')),
  item_count INTEGER DEFAULT 0,
  youtube_playlist_id TEXT UNIQUE, 
  source_url TEXT,
  thumbnail TEXT,
  total_duration_seconds INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  videos TEXT DEFAULT '[]' -- Stores JSON array of video objects for custom playlists; JOIN table for others
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY, 
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  channel TEXT,
  duration INTEGER, 
  thumbnail_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_downloaded BOOLEAN DEFAULT FALSE,
  local_file_path TEXT,
  download_status TEXT, 
  download_progress INTEGER, 
  last_watched_at TEXT,
  watch_progress REAL, 
  added_at TEXT NOT NULL,
  channel_title TEXT,
  upload_date TEXT,
  description TEXT,
  channel_id TEXT,
  uploader_id TEXT
);

CREATE TABLE IF NOT EXISTS playlist_videos (
  playlist_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  position INTEGER NOT NULL, 
  added_to_playlist_at TEXT NOT NULL,
  PRIMARY KEY (playlist_id, video_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlistId_position ON playlist_videos (playlistId, position);

CREATE TABLE IF NOT EXISTS app_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  name TEXT
); 