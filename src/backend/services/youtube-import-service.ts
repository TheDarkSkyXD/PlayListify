import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { app } from 'electron';
import { IpcResponse, Playlist, Video, YtDlpVideoInfoRaw } from '../../shared/types';
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
  let playlistDataFromYtDlp: Playlist | null = null; // Declare here for catch block scope

  try {
    playlistDataFromYtDlp = await ytDlpManager.importPlaylist(url);

    if (!playlistDataFromYtDlp || !playlistDataFromYtDlp.id) {
      logger.error('[YouTubeImportService] Failed to fetch valid playlist metadata from ytDlpManager or playlist is missing ID.');
      return { success: false, error: 'Failed to fetch playlist metadata from YouTube.', data: null };
    }
    
    logger.info(`[YouTubeImportService] Fetched playlist metadata: ${playlistDataFromYtDlp.name} (ID: ${playlistDataFromYtDlp.id}) with ${playlistDataFromYtDlp.videos?.length || 0} videos.`);

    const existingPlaylistStmt = db.prepare("SELECT id FROM playlists WHERE id = ? OR sourceUrl = ?");
    const existingPlaylist = existingPlaylistStmt.get(playlistDataFromYtDlp.id, playlistDataFromYtDlp.sourceUrl || url);

    if (existingPlaylist) {
      logger.warn(`[YouTubeImportService] Playlist already exists in DB (ID: ${playlistDataFromYtDlp.id}). Returning existing.`);
      const fullExistingPlaylistStmt = db.prepare("SELECT * FROM playlists WHERE id = ?");
      let existingDataFromDB = fullExistingPlaylistStmt.get(playlistDataFromYtDlp.id) as any;
      
       if (existingDataFromDB) {
           const videosFromDBStmt = db.prepare(`SELECT v.*, pv.position as positionInPlaylist, pv.addedToPlaylistAt FROM videos v JOIN playlist_videos pv ON v.id = pv.videoId WHERE pv.playlistId = ? ORDER BY pv.position ASC`);
           const videosFromDB: Video[] = videosFromDBStmt.all(existingDataFromDB.id) as any[];
           
           const existingPlaylistForReturn: Playlist = {
            id: existingDataFromDB.id,
            name: existingDataFromDB.name,
            description: existingDataFromDB.description === null ? undefined : existingDataFromDB.description,
            thumbnail: existingDataFromDB.thumbnail === null ? undefined : existingDataFromDB.thumbnail,
            source: existingDataFromDB.source as 'custom' | 'youtube',
            itemCount: existingDataFromDB.itemCount,
            youtubePlaylistId: existingDataFromDB.youtubePlaylistId === null ? undefined : existingDataFromDB.youtubePlaylistId,
            sourceUrl: existingDataFromDB.sourceUrl === null ? undefined : existingDataFromDB.sourceUrl,
            createdAt: existingDataFromDB.createdAt,
            updatedAt: existingDataFromDB.updatedAt,
            videos: videosFromDB, 
           };
           return { success: true, data: existingPlaylistForReturn, message: 'Playlist already exists.' };
       }
      return { success: true, data: null, message: 'Playlist already exists but could not retrieve full data.' };
    }

    const playlistToInsertForDB = {
      id: playlistDataFromYtDlp.id,
      name: playlistDataFromYtDlp.name || 'Untitled Playlist',
      description: playlistDataFromYtDlp.description || null,
      thumbnail: playlistDataFromYtDlp.thumbnail || null, 
      sourceUrl: playlistDataFromYtDlp.sourceUrl || url,
      source: 'youtube', 
      itemCount: playlistDataFromYtDlp.videos?.length || 0,
      createdAt: playlistDataFromYtDlp.createdAt || new Date().toISOString(),
      updatedAt: playlistDataFromYtDlp.updatedAt || new Date().toISOString(),
      youtubePlaylistId: playlistDataFromYtDlp.id, 
    };

    const videosToInsert: Video[] = playlistDataFromYtDlp.videos || [];

    const transaction = db.transaction(() => {
      const insertPlaylistStmt = db.prepare(
        `INSERT INTO playlists (id, name, description, thumbnail, sourceUrl, source, itemCount, createdAt, updatedAt, youtubePlaylistId)
         VALUES (@id, @name, @description, @thumbnail, @sourceUrl, @source, @itemCount, @createdAt, @updatedAt, @youtubePlaylistId)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           description = excluded.description,
           thumbnail = excluded.thumbnail, 
           itemCount = excluded.itemCount,
           updatedAt = excluded.updatedAt`
      );
      insertPlaylistStmt.run(playlistToInsertForDB);

      if (videosToInsert.length > 0) {
        const insertVideoStmt = db.prepare(
          `INSERT INTO videos (id, title, url, thumbnailUrl, duration, description, channelTitle, uploadDate, addedAt)
           VALUES (@id, @title, @url, @thumbnailUrl, @duration, @description, @channelTitle, @uploadDate, @addedAt)
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             url = excluded.url,
             thumbnailUrl = excluded.thumbnailUrl,
             duration = excluded.duration,
             description = excluded.description,
             channelTitle = excluded.channelTitle,
             uploadDate = excluded.uploadDate`
        );
        const insertPlaylistVideoStmt = db.prepare(
          `INSERT INTO playlist_videos (playlistId, videoId, position, addedToPlaylistAt)
           VALUES (?, ?, ?, ?)`
        );

        let order = 0;
        for (const video of videosToInsert) { // video is type Video from playlistDataFromYtDlp.videos
          logger.debug(`[YouTubeImportService] Processing video (type Video): ${JSON.stringify(video)}`);

          const videoForDb = {
            id: video.id,
            title: video.title || 'Untitled Video',
            url: video.url,
            thumbnailUrl: video.thumbnail || null, // Reverted: Video type uses 'thumbnail' for the URL
            duration: video.duration !== undefined ? video.duration : null,
            description: video.description || null, 
            channelTitle: video.channelTitle || null, 
            uploadDate: video.uploadDate || null, 
            addedAt: video.addedAt || new Date().toISOString(), 
          };
          logger.debug(`[YouTubeImportService] videoForDb to be inserted/updated: ${JSON.stringify(videoForDb)}`);

          insertVideoStmt.run(videoForDb);
          insertPlaylistVideoStmt.run(playlistToInsertForDB.id, video.id, order++, new Date().toISOString());
        }
      }
    });

    transaction();

    logger.info(`[YouTubeImportService] Successfully imported and saved playlist: ${playlistDataFromYtDlp.name}`);
    return { success: true, data: playlistDataFromYtDlp };

  } catch (error: any) {
    logger.error(`[YouTubeImportService] Error importing playlist from URL ${url}:`, error);
    // Check if playlistDataFromYtDlp is null due to an error during its assignment or if it was never assigned.
    if (playlistDataFromYtDlp === null && error.message.includes("properties of null")) {
        // This can happen if importPlaylist itself throws an error that results in playlistDataFromYtDlp not being set,
        // or if importPlaylist resolves to null and then a subsequent operation on it fails.
        logger.warn('[YouTubeImportService] Error likely due to playlistDataFromYtDlp being null and accessed.');
        return { success: false, error: 'Playlist metadata was empty or could not be processed by ytDlpManager.', data: null };
    }
    return { success: false, error: error.message || 'Failed to import playlist from URL', data: null };
  }
} 