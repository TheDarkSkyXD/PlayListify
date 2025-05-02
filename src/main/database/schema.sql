-- PlayListify Database Schema
-- Version 1.0

-- Application metadata for version tracking and settings
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT, -- 'youtube', 'custom', etc.
  source_id TEXT, -- YouTube playlist ID or other external identifier
  thumbnail TEXT, -- URL or path to thumbnail image
  created_at INTEGER NOT NULL, -- Unix timestamp
  updated_at INTEGER NOT NULL, -- Unix timestamp
  video_count INTEGER DEFAULT 0, -- Cache of video count for performance
  duration_seconds INTEGER DEFAULT 0 -- Cache of total duration for performance
);

-- Videos table (all known videos, not necessarily in a playlist)
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT UNIQUE NOT NULL, -- YouTube video ID or other external identifier
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  thumbnail TEXT, -- URL or path to thumbnail image
  author TEXT, -- Channel or creator name
  author_id TEXT, -- Channel ID or creator identifier
  published_at INTEGER, -- Unix timestamp
  view_count INTEGER,
  created_at INTEGER NOT NULL, -- Unix timestamp (when added to our DB)
  updated_at INTEGER NOT NULL, -- Unix timestamp (when info last updated)
  file_path TEXT, -- Local file path if downloaded
  file_format TEXT, -- mp4, mp3, etc.
  file_size_bytes INTEGER, -- Size of downloaded file
  download_status TEXT -- 'pending', 'downloading', 'complete', 'error', etc.
);

-- PlaylistVideos join table (maps videos to playlists with order)
CREATE TABLE IF NOT EXISTS playlist_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  playlist_id INTEGER NOT NULL,
  video_id INTEGER NOT NULL,
  position INTEGER NOT NULL, -- Order within playlist
  added_at INTEGER NOT NULL, -- Unix timestamp
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  UNIQUE(playlist_id, video_id) -- Prevent duplicates in the same playlist
);

-- History table for tracking video views and play position
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  playlist_id INTEGER, -- Optional, as a video might be played outside a playlist
  position_seconds REAL DEFAULT 0, -- Last playback position
  completed BOOLEAN DEFAULT 0, -- Whether the video was watched to completion
  played_at INTEGER NOT NULL, -- Unix timestamp when played
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE SET NULL
);

-- Downloads table for tracking download history and status
CREATE TABLE IF NOT EXISTS downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  format TEXT NOT NULL, -- mp4, mp3, etc.
  quality TEXT, -- 360p, 720p, etc.
  size_bytes INTEGER,
  started_at INTEGER NOT NULL, -- Unix timestamp
  completed_at INTEGER, -- Unix timestamp
  status TEXT NOT NULL, -- 'pending', 'downloading', 'complete', 'error', etc.
  progress REAL DEFAULT 0, -- 0-100
  error_message TEXT, -- Error message if status is 'error'
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Tags table for organizing playlists
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  color TEXT, -- Optional color hex code
  created_at INTEGER NOT NULL -- Unix timestamp
);

-- PlaylistTags join table
CREATE TABLE IF NOT EXISTS playlist_tags (
  playlist_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, tag_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Create indexes for improved performance
CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist_id ON playlist_videos(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_video_id ON playlist_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_history_video_id ON history(video_id);
CREATE INDEX IF NOT EXISTS idx_history_played_at ON history(played_at);
CREATE INDEX IF NOT EXISTS idx_downloads_video_id ON downloads(video_id);
CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status); 