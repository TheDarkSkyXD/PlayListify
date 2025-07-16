// src/backend/models/playlist.ts

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
}

export interface UpdatePlaylistData {
  name?: string;
  description?: string;
}

export interface PlaylistWithStats extends Playlist {
  video_count: number;
  total_duration: number;
}
