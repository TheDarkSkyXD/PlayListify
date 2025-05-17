import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { app } from 'electron';
import { IpcResponse, Playlist, Video } from '../../shared/types';
import * as ytDlpManager from './ytDlpManager';
// YtDlpPlaylistMetadata type might not be needed if ytDlpManager.importPlaylist returns Playlist directly
// import { YtDlpPlaylistMetadata } from '../../shared/types/yt-dlp'; 
import { getDB } from '../databases/db'; // Corrected path
import { logger } from '../utils/logger';

// Service for handling YouTube playlist imports

/**
 * Imports a playlist from a YouTube URL.
 * Fetches metadata using ytDlpManager, processes it, and saves it to the database.
 * @param url The YouTube playlist URL.
 * @returns An IpcResponse containing the imported playlist or null if failed.
 */
export async function importPlaylistFromUrl(url: string): Promise<IpcResponse<Playlist | null>> {
  logger.info(`[YouTubeImportService] Starting import for URL: ${url}`);
  const db = getDB();
  let playlistDataFromYtDlp: Playlist | null = null;

  try {
    playlistDataFromYtDlp = await ytDlpManager.importPlaylist(url);

    if (!playlistDataFromYtDlp || !playlistDataFromYtDlp.id) {
      logger.error('[YouTubeImportService] Failed to fetch valid playlist metadata from ytDlpManager or playlist is missing ID.');
      return { success: false, error: 'Failed to fetch playlist metadata from YouTube.', data: null };
    }
    
    logger.info(`[YouTubeImportService] Fetched playlist metadata: ${playlistDataFromYtDlp.name} (ID: ${playlistDataFromYtDlp.id}) with ${playlistDataFromYtDlp.videos?.length || 0} videos.`);

    const existingPlaylistStmt = db.prepare("SELECT * FROM playlists WHERE id = ? OR source_url = ?");
    const existingDataFromDB = existingPlaylistStmt.get(playlistDataFromYtDlp.id, playlistDataFromYtDlp.source_url || url) as Playlist | undefined;

    if (existingDataFromDB) {
      logger.warn(`[YouTubeImportService] Playlist already exists in DB (ID: ${playlistDataFromYtDlp.id}). Returning existing.`);
      const videosFromDBStmt = db.prepare(`SELECT v.*, pv.position as position_in_playlist, pv.added_to_playlist_at FROM videos v JOIN playlist_videos pv ON v.id = pv.video_id WHERE pv.playlist_id = ? ORDER BY pv.position ASC`);
      const videosFromDB: Video[] = videosFromDBStmt.all(existingDataFromDB.id) as Video[];
           
      const existingPlaylistForReturn: Playlist = {
        ...existingDataFromDB, 
        videos: videosFromDB, 
      };
      return { success: true, data: existingPlaylistForReturn, message: 'Playlist already exists.' };
    }

    const now = new Date().toISOString();
    const playlistToInsertForDB = {
      id: playlistDataFromYtDlp.id,
      name: playlistDataFromYtDlp.name || 'Untitled Playlist',
      description: playlistDataFromYtDlp.description || null,
      thumbnail: playlistDataFromYtDlp.thumbnail || null, 
      source_url: playlistDataFromYtDlp.source_url || url,
      source: 'youtube' as const,
      item_count: playlistDataFromYtDlp.videos?.length || 0,
      created_at: playlistDataFromYtDlp.created_at || now,
      updated_at: playlistDataFromYtDlp.updated_at || now,
      youtube_playlist_id: playlistDataFromYtDlp.id, 
      total_duration_seconds: playlistDataFromYtDlp.total_duration_seconds || 0,
    };

    const videosToInsert: Video[] = playlistDataFromYtDlp.videos || [];

    db.transaction(() => {
      const insertPlaylistStmt = db.prepare(
        `INSERT INTO playlists (id, name, description, thumbnail, source_url, source, item_count, created_at, updated_at, youtube_playlist_id, total_duration_seconds)
         VALUES (@id, @name, @description, @thumbnail, @source_url, @source, @item_count, @created_at, @updated_at, @youtube_playlist_id, @total_duration_seconds)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           description = excluded.description,
           thumbnail = excluded.thumbnail, 
           item_count = excluded.item_count,
           updated_at = excluded.updated_at,
           total_duration_seconds = excluded.total_duration_seconds,
           youtube_playlist_id = excluded.youtube_playlist_id`
      );
      insertPlaylistStmt.run(playlistToInsertForDB);

      if (videosToInsert.length > 0) {
        const insertVideoStmt = db.prepare(
          `INSERT INTO videos (id, title, url, thumbnail_url, duration, description, channel_title, upload_date, added_at, is_available, local_file_path, download_status, download_progress, last_watched_at, watch_progress, channel_id, uploader_id)
           VALUES (@id, @title, @url, @thumbnail_url, @duration, @description, @channel_title, @upload_date, @added_at, @is_available, @local_file_path, @download_status, @download_progress, @last_watched_at, @watch_progress, @channel_id, @uploader_id)
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             url = excluded.url,
             thumbnail_url = excluded.thumbnail_url,
             duration = excluded.duration,
             description = excluded.description,
             channel_title = excluded.channel_title,
             upload_date = excluded.upload_date,
             is_available = excluded.is_available,
             channel_id = excluded.channel_id,
             uploader_id = excluded.uploader_id`
        );
        const insertPlaylistVideoStmt = db.prepare(
          `INSERT INTO playlist_videos (playlist_id, video_id, position, added_to_playlist_at)
           VALUES (?, ?, ?, ?)`
        );

        videosToInsert.forEach((video: Video, index: number) => {
          const videoForDb = {
            id: video.id,
            title: video.title || 'Untitled Video',
            url: video.url,
            thumbnail_url: video.thumbnail_url || null, // Using thumbnail_url from Video type
            duration: video.duration !== undefined ? video.duration : null,
            description: video.description || null, 
            channel_title: video.channel_title || null, 
            upload_date: video.upload_date || null, 
            added_at: video.added_at || now, 
            is_available: video.is_available !== undefined ? video.is_available : true,
            local_file_path: video.local_file_path || null,
            download_status: video.download_status || null,
            download_progress: video.download_progress || null,
            last_watched_at: video.last_watched_at || null,
            watch_progress: video.watch_progress || null,
            channel_id: video.channel_id || null,
            uploader_id: video.uploader_id || null,
          };
          insertVideoStmt.run(videoForDb);
          insertPlaylistVideoStmt.run(playlistToInsertForDB.id, video.id, index, now);
        });
      }
    })();

    logger.info(`[YouTubeImportService] Successfully imported and saved playlist: ${playlistDataFromYtDlp.name}`);
    return { success: true, data: playlistDataFromYtDlp };

  } catch (error: any) {
    logger.error(`[YouTubeImportService] Error importing playlist from URL ${url}:`, error);
    if (playlistDataFromYtDlp === null && error.message.includes("properties of null")) {
        logger.warn('[YouTubeImportService] Error likely due to playlistDataFromYtDlp being null and accessed.');
        return { success: false, error: 'Playlist metadata was empty or could not be processed by ytDlpManager.', data: null };
    }
    return { success: false, error: error.message || 'Failed to import playlist from URL', data: null };
  }
}

export async function importYouTubePlaylist(url: string, customName?: string): Promise<Playlist> {
  const db = getDB();
  logger.info(`[YouTubeImportService] Starting import for URL: ${url}${customName ? ` (Custom Name: ${customName})` : ''}`);

  const playlistDataFromYtDlp = await ytDlpManager.importPlaylist(url, customName);
  if (!playlistDataFromYtDlp) {
    throw new Error('Failed to fetch playlist data from YouTube.');
  }

  const existingPlaylistStmt = db.prepare("SELECT * FROM playlists WHERE id = ? OR source_url = ?");
  const existingDataFromDB = existingPlaylistStmt.get(playlistDataFromYtDlp.id, playlistDataFromYtDlp.source_url || url) as Playlist | undefined;

  let playlistIdToUse: string;
  const now = new Date().toISOString();

  if (existingDataFromDB) {
    logger.info(`[YouTubeImportService] Playlist with ID ${existingDataFromDB.id} or source_url ${playlistDataFromYtDlp.source_url || url} already exists. Comparing video counts...`);
    playlistIdToUse = existingDataFromDB.id;

    const updatedPlaylistRecord = {
      id: playlistIdToUse,
      name: customName || playlistDataFromYtDlp.name || existingDataFromDB.name,
      description: playlistDataFromYtDlp.description || existingDataFromDB.description,
      thumbnail: playlistDataFromYtDlp.thumbnail || existingDataFromDB.thumbnail,
      source: 'youtube' as const,
      item_count: playlistDataFromYtDlp.videos?.length || existingDataFromDB.item_count,
      youtube_playlist_id: playlistDataFromYtDlp.youtube_playlist_id || existingDataFromDB.youtube_playlist_id,
      source_url: playlistDataFromYtDlp.source_url || existingDataFromDB.source_url || url,
      created_at: existingDataFromDB.created_at, 
      updated_at: now, 
      total_duration_seconds: playlistDataFromYtDlp.total_duration_seconds || existingDataFromDB.total_duration_seconds || 0, 
    };

    db.prepare(
      `UPDATE playlists SET 
        name = @name, 
        description = @description, 
        thumbnail = @thumbnail, 
        item_count = @item_count, 
        source_url = @source_url, 
        youtube_playlist_id = @youtube_playlist_id, 
        updated_at = @updated_at,
        total_duration_seconds = @total_duration_seconds
       WHERE id = @id`
    ).run(updatedPlaylistRecord);
    logger.info(`[YouTubeImportService] Updated existing playlist metadata for ID: ${playlistIdToUse}`);

  } else {
    playlistIdToUse = playlistDataFromYtDlp.id;
    const playlistRecord = {
      id: playlistIdToUse,
      name: customName || playlistDataFromYtDlp.name,
      description: playlistDataFromYtDlp.description,
      thumbnail: playlistDataFromYtDlp.thumbnail,
      source_url: playlistDataFromYtDlp.source_url || url,
      source: 'youtube' as const,
      item_count: playlistDataFromYtDlp.videos?.length || 0,
      created_at: playlistDataFromYtDlp.created_at || now,
      updated_at: playlistDataFromYtDlp.updated_at || now,
      youtube_playlist_id: playlistDataFromYtDlp.youtube_playlist_id || playlistDataFromYtDlp.id,
      total_duration_seconds: playlistDataFromYtDlp.total_duration_seconds || 0,
    };
    try {
      db.prepare(
        `INSERT INTO playlists (id, name, description, thumbnail, source_url, source, item_count, created_at, updated_at, youtube_playlist_id, total_duration_seconds)
         VALUES (@id, @name, @description, @thumbnail, @source_url, @source, @item_count, @created_at, @updated_at, @youtube_playlist_id, @total_duration_seconds)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           description = excluded.description,
           thumbnail = excluded.thumbnail,
           source_url = excluded.source_url,
           item_count = excluded.item_count,
           updated_at = excluded.updated_at,
           total_duration_seconds = excluded.total_duration_seconds,
           youtube_playlist_id = excluded.youtube_playlist_id`
      ).run(playlistRecord);
      logger.info(`[YouTubeImportService] New playlist created in DB with ID: ${playlistIdToUse}`);
    } catch (dbError: any) {
      logger.error(`[YouTubeImportService] Error inserting/updating playlist in DB for ID ${playlistIdToUse}: ${dbError.message}`, dbError);
      throw dbError;
    }
  }

  const videosFromYtDlp = playlistDataFromYtDlp.videos || [];
  if (videosFromYtDlp.length > 0) {
    db.transaction(() => {
      const upsertVideoStmt = db.prepare(
        `INSERT INTO videos (id, title, url, duration, thumbnail_url, description, channel_id, channel_title, upload_date, added_at, is_available, local_file_path, download_status, download_progress, last_watched_at, watch_progress, uploader_id)
         VALUES (@id, @title, @url, @duration, @thumbnail_url, @description, @channel_id, @channel_title, @upload_date, @added_at, @is_available, @local_file_path, @download_status, @download_progress, @last_watched_at, @watch_progress, @uploader_id)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           duration = excluded.duration,
           thumbnail_url = excluded.thumbnail_url,
           description = excluded.description,
           channel_id = excluded.channel_id,
           channel_title = excluded.channel_title,
           upload_date = excluded.upload_date,
           is_available = excluded.is_available,
           uploader_id = excluded.uploader_id`
      );

      const deleteOldPlaylistVideosStmt = db.prepare("DELETE FROM playlist_videos WHERE playlist_id = ?");
      deleteOldPlaylistVideosStmt.run(playlistIdToUse);

      const insertPlaylistVideoStmt = db.prepare(
        `INSERT INTO playlist_videos (playlist_id, video_id, position, added_to_playlist_at)
         VALUES (?, ?, ?, ?)`
      );

      videosFromYtDlp.forEach((videoData: Video, index: number) => {
        const videoRecord = {
          id: videoData.id,
          title: videoData.title || 'Untitled Video',
          url: videoData.url,
          duration: videoData.duration || null,
          thumbnail_url: videoData.thumbnail_url || null, // Consistent with Video type
          description: videoData.description || null,
          channel_id: videoData.channel_id || null,
          channel_title: videoData.channel_title || null,
          upload_date: videoData.upload_date || null,
          added_at: videoData.added_at || now,
          is_available: videoData.is_available !== undefined ? videoData.is_available : true,
          local_file_path: videoData.local_file_path || null,
          download_status: videoData.download_status || null,
          download_progress: videoData.download_progress || null,
          last_watched_at: videoData.last_watched_at || null,
          watch_progress: videoData.watch_progress || null,
          uploader_id: videoData.uploader_id || null,
        };
        upsertVideoStmt.run(videoRecord);
        insertPlaylistVideoStmt.run(playlistIdToUse, videoData.id, index, now);
      });
    })();
    logger.info(`[YouTubeImportService] Upserted ${videosFromYtDlp.length} videos and their playlist associations for playlist ID: ${playlistIdToUse}`);
  }
  
  const videosForDurationCalcStmt = db.prepare(
    `SELECT v.duration 
     FROM videos v JOIN playlist_videos pv ON v.id = pv.video_id 
     WHERE pv.playlist_id = ?`
  );
  const videosInDb = videosForDurationCalcStmt.all(playlistIdToUse) as { duration: number | null }[];
  const newTotalDuration = videosInDb.reduce((sum, v: {duration: number | null}) => sum + (v.duration || 0), 0);

  db.prepare("UPDATE playlists SET total_duration_seconds = ?, item_count = ? WHERE id = ?")
    .run(newTotalDuration, videosInDb.length, playlistIdToUse);
  logger.info(`[YouTubeImportService] Recalculated total_duration_seconds to ${newTotalDuration} and item_count to ${videosInDb.length} for playlist ID: ${playlistIdToUse}`);

  const finalPlaylistStmt = db.prepare("SELECT * FROM playlists WHERE id = ?");
  const finalPlaylistDataFromDb = finalPlaylistStmt.get(playlistIdToUse) as Playlist | undefined;

  if (!finalPlaylistDataFromDb) {
    throw new Error('Failed to retrieve final playlist data from DB after import.');
  }

  const finalVideosStmt = db.prepare(
    `SELECT v.*, pv.position as position_in_playlist, pv.added_to_playlist_at 
     FROM videos v JOIN playlist_videos pv ON v.id = pv.video_id 
     WHERE pv.playlist_id = ? ORDER BY pv.position ASC`
  );
  const finalVideos = finalVideosStmt.all(playlistIdToUse) as Video[];

  const importedPlaylist: Playlist = {
    ...finalPlaylistDataFromDb,
    videos: finalVideos,
  };
  logger.info(`[YouTubeImportService] Successfully completed import for playlist ID: ${importedPlaylist.id}`);
  return importedPlaylist; 
} 