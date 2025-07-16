// src/backend/models/song.ts

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSongData {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  file_path?: string;
}

export interface UpdateSongData {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  file_path?: string;
}

export interface PlaylistSong {
  id: number;
  playlist_id: string;
  song_id: string;
  position: number;
  added_at: string;
}

export interface SongWithPlaylistInfo extends Song {
  position: number;
  added_at: string;
}
