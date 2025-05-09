import fs from 'fs-extra';
import path from 'path';
import { getSetting } from '../services/settingsService'; // Assuming settingsService provides downloadLocation
import { Playlist, Video } from '@shared/types/playlist'; // Changed to path alias

const DEFAULT_PLAYLIST_DIR_NAME = 'Playlists';

/**
 * Ensures that the base directory for all playlists exists.
 * @returns The absolute path to the playlist directory.
 */
async function ensureBasePlaylistDir(): Promise<string> {
    let downloadLocation = await getSetting('downloadLocation');
    if (downloadLocation === undefined) {
        console.warn("Download location not set, using default.");
        // Fallback to a default path, similar to settingsService schema default
        // It's important that 'app' is available here or this path is defined differently.
        // For now, assuming 'app' is accessible or using a predefined fallback.
        // If app is not directly accessible, this might need to be 'videos/Playlistify'
        // or passed in, or obtained via another service call.
        // For simplicity and based on settingsService, let's use a hardcoded relative path if app isn't available.
        // A better approach would be to ensure critical settings always have a value from settingsService.
        const appInstance = require('electron').app; // Or however app is accessed here
        downloadLocation = path.join(appInstance.getPath('videos'), 'Playlistify');
    }
    const playlistDirPath = path.join(downloadLocation, DEFAULT_PLAYLIST_DIR_NAME);
    await fs.ensureDir(playlistDirPath);
    return playlistDirPath;
}

/**
 * Creates a specific directory for a given playlist name within the base playlist directory.
 * @param playlistName The name of the playlist for which to create a directory.
 * @returns The absolute path to the created playlist-specific directory.
 */
export async function createPlaylistDir(playlistName: string): Promise<string> {
    const basePlaylistDir = await ensureBasePlaylistDir();
    // Sanitize playlistName to be a valid directory name (basic example)
    const sanePlaylistName = playlistName.replace(/[\\/:*?"<>|]/g, '_');
    const specificPlaylistPath = path.join(basePlaylistDir, sanePlaylistName);
    await fs.ensureDir(specificPlaylistPath);
    return specificPlaylistPath;
}

/**
 * Writes playlist metadata (e.g., list of videos) to a JSON file within its directory.
 * @param playlistName The name of the playlist.
 * @param playlistData The Playlist object containing metadata.
 */
export async function writePlaylistMetadata(playlistName: string, playlistData: Playlist): Promise<void> {
    const playlistDir = await createPlaylistDir(playlistName);
    const metadataFilePath = path.join(playlistDir, 'playlist.json');
    await fs.writeJson(metadataFilePath, playlistData, { spaces: 2 });
    console.log(`Metadata for playlist '${playlistName}' written to ${metadataFilePath}`);
}

/**
 * Reads playlist metadata from its JSON file.
 * @param playlistName The name of the playlist.
 * @returns The Playlist object, or null if metadata file doesn't exist.
 */
export async function readPlaylistMetadata(playlistName: string): Promise<Playlist | null> {
    const basePlaylistDir = await ensureBasePlaylistDir();
    const sanePlaylistName = playlistName.replace(/[\\/:*?"<>|]/g, '_');
    const metadataFilePath = path.join(basePlaylistDir, sanePlaylistName, 'playlist.json');
    try {
        if (await fs.pathExists(metadataFilePath)) {
            return await fs.readJson(metadataFilePath) as Playlist;
        }
        return null;
    } catch (error) {
        console.error(`Error reading metadata for playlist '${playlistName}':`, error);
        return null;
    }
}

/**
 * Deletes a playlist directory and all its contents.
 * @param playlistName The name of the playlist to delete.
 */
export async function deletePlaylistDir(playlistName: string): Promise<void> {
    const basePlaylistDir = await ensureBasePlaylistDir();
    const sanePlaylistName = playlistName.replace(/[\\/:*?"<>|]/g, '_');
    const playlistDirPath = path.join(basePlaylistDir, sanePlaylistName);
    try {
        if (await fs.pathExists(playlistDirPath)) {
            await fs.remove(playlistDirPath);
            console.log(`Playlist directory '${playlistName}' deleted successfully.`);
        }
    } catch (error) {
        console.error(`Error deleting playlist directory '${playlistName}':`, error);
        throw error; // Re-throw to allow caller to handle
    }
}

/**
 * Gets the path for a specific video file within a playlist's directory.
 * Does not guarantee the file exists.
 * @param playlistName The name of the playlist.
 * @param videoId The ID of the video.
 * @param format The format (extension) of the video, e.g., 'mp4'.
 * @returns The potential path to the video file.
 */
export async function getVideoPath(playlistName: string, videoId: string, format: string = 'mp4'): Promise<string> {
    const playlistDir = await createPlaylistDir(playlistName); // Ensures directory exists
    const videoFileName = `${videoId.replace(/[\\/:*?"<>|]/g, '_')}.${format}`;
    return path.join(playlistDir, videoFileName);
}

/**
 * Checks if a specific video file exists.
 * @param playlistName The name of the playlist.
 * @param videoId The ID of the video.
 * @param format The format (extension) of the video.
 * @returns True if the video file exists, false otherwise.
 */
export async function videoFileExists(playlistName: string, videoId: string, format: string = 'mp4'): Promise<boolean> {
    const filePath = await getVideoPath(playlistName, videoId, format);
    return fs.pathExists(filePath);
}

/**
 * Deletes a specific video file from a playlist's directory.
 * @param playlistName The name of the playlist.
 * @param videoId The ID of the video.
 * @param format The format (extension) of the video.
 */
export async function deleteVideoFile(playlistName: string, videoId: string, format: string = 'mp4'): Promise<void> {
    const filePath = await getVideoPath(playlistName, videoId, format);
    try {
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            console.log(`Video file '${videoId}.${format}' deleted from playlist '${playlistName}'.`);
        }
    } catch (error) {
        console.error(`Error deleting video file '${videoId}.${format}' from playlist '${playlistName}':`, error);
        throw error;
    }
}

// TODO: Add more utility functions as needed, e.g., listing all playlist directories, validating file names further. 