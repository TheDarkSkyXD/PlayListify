import YTDlpWrap, { YTDlpEventEmitter } from 'yt-dlp-wrap';
import path from 'path';
import fs from 'fs-extra';
import { getManagedYtDlpPath } from '../utils/pathUtils';
import { writePlaylistMetadata } from '../utils/fileUtils';
import { logger } from '../utils/logger'; // Assuming logger exists and is correctly typed
import { Playlist, Video } from '../../shared/types';
import { YtDlpSingleVideoInfoRaw, VideoPreviewData as SharedVideoPreviewData } from '../../shared/types/video';
import { YTDLP_PLAYLIST_METADATA_FETCH_TIMEOUT, YTDLP_SINGLE_VIDEO_METADATA_FETCH_TIMEOUT, YTDLP_QUICK_PREVIEW_TIMEOUT } from '../../shared/constants/config';
import { 
  YtDlpVideoInfoRaw,
  YtDlpFullPlaylistRawData, // Renamed from YtDlpPlaylistMetadataRaw
  ProcessedPlaylistMetadata,
  YtDlpFlatPlaylistInfo
} from '../../shared/types/yt-dlp';
import chalk from 'chalk'; // Standard library for console colors
import cp, { spawn, ChildProcess } from 'child_process';
import { app } from 'electron'; // For default paths, if needed
import { v4 as uuidv4 } from 'uuid';

const c = chalk; // Assign chalk to c for brevity if that was the intention

let ytDlpWrapInstancePromise: Promise<YTDlpWrap> | null = null;
let ytDlpWrapInstance: YTDlpWrap | null = null;
let ytDlpBinaryPath = '';

// New preferred order for returning a thumbnail URL.
// This list is ordered from most preferred (most reliable and decent quality)
// to least preferred.
const PREFERRED_THUMBNAIL_URL_KEYS_IN_ORDER = [
  'sddefault.jpg',     // 640x480 - Often available and good quality
  'hqdefault.jpg',     // 480x360 - Widely available
  'mqdefault.jpg',     // 320x180 - Lower quality but usually available
  'maxresdefault.jpg', // 1280x720 - Highest quality, but sometimes 404s
  'default.jpg'        // 120x90  - Lowest quality, standard fallback
];

// Define a local type for the thumbnail objects if not explicitly exported
// This structure is assumed based on typical yt-dlp output and previous usage context.
interface ThumbnailDetail {
  url: string;
  preference?: number;
  id?: string;
  height?: number;
  width?: number;
  resolution?: string;
}

// Helper function to map YtDlpVideoInfoRaw to Video
function mapRawVideoToVideo(rawVideo: YtDlpVideoInfoRaw, index?: number): Video {
  const video: Video = {
    id: rawVideo.id,
    url: rawVideo.webpage_url || rawVideo.original_url || rawVideo.id, // Fallback logic for URL
    title: rawVideo.title,
    thumbnail_url: getBestThumbnail(rawVideo.thumbnails) || rawVideo.thumbnail,
    duration: rawVideo.duration,
    description: rawVideo.description,
    channel_title: rawVideo.uploader || rawVideo.channel, // Prefer uploader
    uploader_id: rawVideo.uploader_id || rawVideo.channel_id,
    channel_id: rawVideo.channel_id || rawVideo.uploader_id, // Ensure channel_id is populated
    upload_date: rawVideo.upload_date, // Assuming YYYYMMDD, Video type takes string
    
    // Playlist context fields (can be overridden if video is part of a specific playlist instance later)
    position_in_playlist: rawVideo.playlist_index !== undefined ? rawVideo.playlist_index : (index !== undefined ? index + 1 : undefined),
    // added_to_playlist_at for a specific playlist instance is set when adding to that playlist,
    // not globally here. This video object is a general representation.
    
    // Local state fields (defaults, to be updated by other services)
    is_available: true, // Assume available unless determined otherwise
    is_downloaded: false,
    local_file_path: undefined,
    download_status: undefined,
    download_progress: undefined,
    last_watched_at: undefined,
    watch_progress: undefined,
    added_at: new Date().toISOString(), // When first seen/imported by this system
  };
  return video;
}

export function getBestThumbnail(thumbnails: ThumbnailDetail[] | undefined): string | undefined {
  if (!thumbnails || thumbnails.length === 0) {
    logger.debug('[ytDlpManager/getBestThumbnail] No thumbnails array provided or array is empty.');
    return undefined;
  }

  // Iterate through our preferred keys in order.
  // The first match found from this list will be returned.
  for (const preferredKey of PREFERRED_THUMBNAIL_URL_KEYS_IN_ORDER) {
    const foundThumb = thumbnails.find(t => t.url && t.url.includes(preferredKey));
    if (foundThumb?.url) {
      logger.debug(`[ytDlpManager/getBestThumbnail] Found preferred thumbnail: '${preferredKey}' at ${foundThumb.url}`);
      return foundThumb.url;
    }
  }

  // If no thumbnails matching our preferred keys were found,
  // as a last resort, return the URL of the first thumbnail in the original array if it exists.
  // This handles cases where yt-dlp might provide thumbnails not matching our known keys.
  if (thumbnails[0]?.url) {
    logger.debug(`[ytDlpManager/getBestThumbnail] No preferred thumbnails found. Falling back to the first thumbnail in the list: ${thumbnails[0].url}`);
    return thumbnails[0].url;
  }
  
  logger.debug('[ytDlpManager/getBestThumbnail] No suitable thumbnail could be determined from the provided list.');
  return undefined;
}

// Helper to simplify playlist URLs (remove video-specific parts)
export function simplifyPlaylistUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com' || parsedUrl.hostname === 'music.youtube.com') {
      const playlistId = parsedUrl.searchParams.get('list');
      if (playlistId) {
        return `https://www.youtube.com/playlist?list=${playlistId}`;
      }
    }
  } catch (error) {
    logger.warn(`[ytDlpManager] Failed to parse or simplify URL: ${url}`, error as any);
  }
  return url;
}

async function initializeYtDlpWrap(): Promise<YTDlpWrap> {
  const binaryPath = await getManagedYtDlpPath();

  if (!binaryPath) {
    logger.error('[ytDlpManager] yt-dlp binary path not resolved from pathUtils. Attempting download as fallback.');
    const defaultDownloadDir = path.join(process.cwd(), 'binaries');
    const defaultBinaryPath = path.join(defaultDownloadDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    
    try {
        await fs.ensureDir(defaultDownloadDir);
        logger.info(`[ytDlpManager] Attempting to download yt-dlp to ${defaultBinaryPath}`);
        await YTDlpWrap.downloadFromGithub(defaultBinaryPath);
        logger.info(`[ytDlpManager] yt-dlp downloaded successfully to ${defaultBinaryPath}. Configure pathUtils to use this path consistently.`);
        if (process.platform !== 'win32') {
            await fs.chmod(defaultBinaryPath, '755');
        }
        ytDlpBinaryPath = defaultBinaryPath; // Ensure binary path is set here too
        const instance = new YTDlpWrap(defaultBinaryPath);
        logger.info('[ytDlpManager] YTDlpWrap initialized with downloaded binary at:', defaultBinaryPath);
        return instance;
    } catch (downloadError: any) {
        logger.error(`[ytDlpManager] Failed to download/initialize yt-dlp: ${downloadError.message}`);
        throw new Error('yt-dlp binary is not available and download failed.');
    }
  }

  if (!fs.existsSync(binaryPath)) {
     logger.error(`[ytDlpManager] yt-dlp binary not found at configured path: ${binaryPath}. Ensure it is installed or path is correct.`);
     throw new Error(`yt-dlp binary not found at configured path: ${binaryPath}.`);
  }
  
  try {
    if (process.platform !== 'win32') {
        await fs.access(binaryPath, fs.constants.X_OK);
    }
  } catch (accessError: any) {
    logger.warn(`[ytDlpManager] yt-dlp binary at ${binaryPath} may not be executable. Attempting to chmod. Error: ${accessError.message}`);
    try {
        if (process.platform !== 'win32') {
            await fs.chmod(binaryPath, '755');
        }
    } catch (chmodErr: any) {
        logger.error(`[ytDlpManager] Failed to make yt-dlp binary executable: ${chmodErr.message}`);
        throw new Error(`yt-dlp binary at ${binaryPath} is not executable.`);
    }
  }
  ytDlpBinaryPath = binaryPath; // Ensure binary path is set here
  const instance = new YTDlpWrap(binaryPath);
  logger.info('[ytDlpManager] YTDlpWrap initialized with binary at:', binaryPath);
  return instance;
}

export function getYtDlpInstance(): Promise<YTDlpWrap> {
  if (!ytDlpWrapInstancePromise) {
    ytDlpWrapInstancePromise = initializeYtDlpWrap();
  }
  return ytDlpWrapInstancePromise;
}

interface GetPlaylistMetadataOptions {
  overrideArgs?: string[];
  maxItems?: number; // For future use if we want to limit items fetched from yt-dlp directly
}

// New helper function for fetching playlist shell info
export async function fetchPlaylistShellInfoWithYtDlp(
  simplifiedUrl: string,
  overrideArgs: string[],
  ytDlpInstance: YTDlpWrap,
  binaryPath: string // Pass binaryPath for logging
): Promise<YtDlpFlatPlaylistInfo | null> {
  const shellArgs = [
    simplifiedUrl,
    '--dump-single-json',
    '--flat-playlist',
    '--no-warnings',
    '--no-progress',
    ...overrideArgs,
  ];
  logger.info(`[ytDlpManager] Spawning for SHELL INFO: ${binaryPath} ${shellArgs.join(' ')}`);
  try {
    const rawShellJsonString = await ytDlpInstance.execPromise(shellArgs, { timeout: YTDLP_QUICK_PREVIEW_TIMEOUT / 2 });
    if (rawShellJsonString) {
      return JSON.parse(rawShellJsonString) as YtDlpFlatPlaylistInfo;
    }
    logger.warn(`[ytDlpManager] No JSON output for shell info for ${simplifiedUrl}`);
    return null;
  } catch (error: any) {
    logger.error(`[ytDlpManager] Error fetching shell info for ${simplifiedUrl}: ${error.message}`, error);
    return null;
  }
}

// New helper function for fetching playlist video durations
export async function fetchPlaylistVideoDurationsWithYtDlp(
  simplifiedUrl: string,
  // overrideArgs are not typically used for this specific duration call, so removed
  ytDlpInstance: YTDlpWrap,
  binaryPath: string // Pass binaryPath for logging
): Promise<{ durations: number[]; videoCountFromDurations: number; isDurationSummationComplete: boolean } | null> {
  const durationArgs = [
    simplifiedUrl,
    '--flat-playlist',
    '--print', '%(duration)s',
    '--no-warnings',
    '--no-progress',
  ];
  logger.info(`[ytDlpManager] Spawning for DURATIONS: ${binaryPath} ${durationArgs.join(' ')}`);
  let isDurationSummationComplete = true;
  const durations: number[] = [];
  let videoCountFromDurations = 0;

  try {
    const rawDurationLinesString = await ytDlpInstance.execPromise(durationArgs, { timeout: YTDLP_QUICK_PREVIEW_TIMEOUT / 2 });
    if (rawDurationLinesString) {
      const lines = rawDurationLinesString.trim().split('\n');
      videoCountFromDurations = lines.length;
      for (const line of lines) {
        if (line.trim() === '' || line.toLowerCase() === 'na' || line.toLowerCase() === 'n/a') {
          isDurationSummationComplete = false;
          continue;
        }
        const duration = parseFloat(line);
        if (!isNaN(duration)) {
          durations.push(duration);
        } else {
          logger.warn(`[ytDlpManager] Non-numeric duration found for ${simplifiedUrl}: "${line}"`);
          isDurationSummationComplete = false;
        }
      }
      return { durations, videoCountFromDurations, isDurationSummationComplete };
    }
    logger.warn(`[ytDlpManager] No duration output for ${simplifiedUrl}`);
    return { durations: [], videoCountFromDurations: 0, isDurationSummationComplete: false };
  } catch (error: any) {
    logger.error(`[ytDlpManager] Error fetching durations for ${simplifiedUrl}: ${error.message}`, error);
    return { durations: [], videoCountFromDurations: 0, isDurationSummationComplete: false }; // Return empty/default on error
  }
}

export async function getPlaylistMetadata(
  playlistUrl: string,
  options: GetPlaylistMetadataOptions = {}
): Promise<ProcessedPlaylistMetadata | null> {
  const { overrideArgs = [] } = options; // quickPreview option removed
  const simplifiedUrl = simplifyPlaylistUrl(playlistUrl);
  // Removed quickPreview log, as this function now only fetches full metadata
  logger.info(`[ytDlpManager] getPlaylistMetadata (FULL FETCH) for URL: ${simplifiedUrl}`);

  const ytDlp = await getYtDlpInstance();
  if (!ytDlp) {
    logger.error('[ytDlpManager] yt-dlp instance is not available for getPlaylistMetadata.');
    throw new Error('yt-dlp instance not initialized.');
  }

  // Full metadata fetch (existing logic using spawn and stream processing)
  const args = [
    simplifiedUrl,
    '--dump-json', // Fetches detailed info for each video, not flat
    '--yes-playlist',
    '--no-warnings',
    '--no-progress',
    ...overrideArgs,
  ];

  logger.info(`[ytDlpManager] Spawning for FULL METADATA: ${ytDlpBinaryPath} ${args.join(' ')}`);
  return new Promise<ProcessedPlaylistMetadata | null>((resolve, reject) => {
    const functionStartTime = performance.now();
    const process = spawn(ytDlpBinaryPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let allEntriesRaw: YtDlpVideoInfoRaw[] = [];
    let rawJsonBuffer = '';
    let playlistTitle: string | undefined;
    let playlistUploader: string | undefined;
    let playlistDescription: string | undefined;
    let playlistWebpageUrl: string | undefined = simplifiedUrl; // Default to input URL
    let playlistChannel: string | undefined;
    let playlistIdFromYtDlp: string | undefined;
    let playlistThumbnails: ThumbnailDetail[] | undefined;


    process.stdout.on('data', (data) => {
      rawJsonBuffer += data.toString();
      // Process line by line, as yt-dlp --dump-json outputs one JSON object per video
      let newlineIndex;
      while ((newlineIndex = rawJsonBuffer.indexOf('\n')) >= 0) {
        const jsonLine = rawJsonBuffer.substring(0, newlineIndex);
        rawJsonBuffer = rawJsonBuffer.substring(newlineIndex + 1);
        if (jsonLine.trim()) {
          try {
            const entry = JSON.parse(jsonLine) as YtDlpVideoInfoRaw;
            allEntriesRaw.push(entry);

            // Try to extract playlist-level info from the first entry
            // This assumes yt-dlp might output playlist-global data with the first video when not using --dump-single-json
            if (allEntriesRaw.length === 1) {
              playlistTitle = entry.playlist_title || entry.playlist;
              playlistUploader = entry.playlist_uploader || entry.uploader || entry.channel;
              playlistDescription = entry.playlist_description || entry.description; // Less likely, but fallback
              playlistWebpageUrl = entry.playlist_webpage_url || entry.webpage_url; // Prefer playlist specific
              playlistChannel = entry.channel;
              playlistIdFromYtDlp = entry.playlist_id;
              // Note: Thumbnails are per-video here. A playlist-level thumbnail isn't directly given in this stream.
              // We might need a separate call or rely on the first video's thumbnail if that's the desired behavior.
              // For full metadata, the primary thumbnail might be from the first video or fetched differently.
              // For now, let's assume we want to use the first video's best thumbnail if no other strategy is in place.
              if (!playlistThumbnails && entry.thumbnails) {
                // This takes thumbnails from the *first video*. For a playlist-level thumbnail with --dump-json,
                // yt-dlp usually doesn't provide a single "playlist thumbnail" but rather thumbnails for each video.
                // The `getBestThumbnail` helper is designed for an array of thumbnail objects.
                 playlistThumbnails = entry.thumbnails; // Store the array from the first video
              }
            }
          } catch (e) {
            logger.warn('[ytDlpManager] Failed to parse JSON line from yt-dlp (full fetch):', jsonLine, e);
          }
        }
      }
    });

    process.stderr.on('data', (data) => {
      logger.error(`[ytDlpManager] yt-dlp stderr (full fetch for ${simplifiedUrl}): ${data.toString().trim()}`);
    });

    process.on('error', (err) => {
      const duration = performance.now() - functionStartTime;
      logger.error(`[ytDlpManager] Failed to start yt-dlp process (full fetch for ${simplifiedUrl}) after ${duration.toFixed(2)}ms: ${err.message}`, err);
      reject(err);
    });
    
    process.on('close', (code) => {
      const duration = performance.now() - functionStartTime;
      if (rawJsonBuffer.trim()) { // Process any remaining data in the buffer
        try {
          const entry = JSON.parse(rawJsonBuffer) as YtDlpVideoInfoRaw;
          allEntriesRaw.push(entry);
          if (allEntriesRaw.length === 1 && !playlistTitle) { // Check again if it was the only entry
             playlistTitle = entry.playlist_title || entry.playlist;
             playlistUploader = entry.playlist_uploader || entry.uploader || entry.channel;
             playlistWebpageUrl = entry.playlist_webpage_url || entry.webpage_url;
             playlistChannel = entry.channel;
             playlistIdFromYtDlp = entry.playlist_id;
             if (!playlistThumbnails && entry.thumbnails) {
                playlistThumbnails = entry.thumbnails;
             }
          }
        } catch (e) {
          logger.warn('[ytDlpManager] Failed to parse remaining JSON buffer from yt-dlp (full fetch):', rawJsonBuffer, e);
        }
      }

      if (code !== 0) {
        logger.error(`[ytDlpManager] yt-dlp process (full fetch for ${simplifiedUrl}) exited with code ${code} after ${duration.toFixed(2)}ms.`);
        return resolve(null); // Resolve with null on non-zero exit code
      }

      if (allEntriesRaw.length === 0) {
        logger.warn(`[ytDlpManager] No video entries found after full fetch for ${simplifiedUrl} (duration: ${duration.toFixed(2)}ms).`);
        return resolve(null);
      }
      
      logger.info(`[ytDlpManager] Full metadata fetch for ${simplifiedUrl} (yt-dlp process) took ${duration.toFixed(2)}ms. Processing ${allEntriesRaw.length} entries.`);
      
      const totalDuration = allEntriesRaw.reduce((acc, entry) => acc + (entry.duration || 0), 0);
      const bestOverallThumbnail = getBestThumbnail(playlistThumbnails);


      const processedData: ProcessedPlaylistMetadata = {
        id: playlistIdFromYtDlp || simplifiedUrl, // Use ID from yt-dlp if available
        title: playlistTitle || 'Unknown Playlist',
        uploader: playlistUploader,
        channel: playlistChannel,
        description: playlistDescription,
        webpage_url: playlistWebpageUrl,
        thumbnail: bestOverallThumbnail, // Using the best from the first video for now
        entries: allEntriesRaw,
        itemCount: allEntriesRaw.length,
        totalDuration: totalDuration,
        isDurationApproximate: false, // For full fetch, duration should be accurate
      };
      resolve(processedData);
    });

    // Timeout for the entire metadata fetching operation
    const timeoutId = setTimeout(() => {
      logger.error(`[ytDlpManager] Full metadata fetch for ${simplifiedUrl} timed out after ${YTDLP_PLAYLIST_METADATA_FETCH_TIMEOUT / 1000}s.`);
      if (!process.killed) {
        process.kill('SIGKILL'); // Force kill if still running
      }
      resolve(null); // Resolve with null on timeout
    }, YTDLP_PLAYLIST_METADATA_FETCH_TIMEOUT);

    process.on('exit', () => { // ensure timeout is cleared on normal exit too
        clearTimeout(timeoutId);
    });

  });
}

export async function getVideoMetadata(videoUrl: string, overrideArgs: string[] = []): Promise<YtDlpVideoInfoRaw | null> {
  logger.info(`[ytDlpManager] getVideoMetadata for URL: ${videoUrl}`);
  const ytDlp = await getYtDlpInstance();
  if (!ytDlp) {
    logger.error('[ytDlpManager] yt-dlp instance is not available for getVideoMetadata.');
    return null; // Or throw new Error('yt-dlp instance not initialized.');
  }

  const baseArgs = [
    videoUrl,
    '--dump-single-json', // Get metadata for a single video
    '--no-warnings',
    '--no-progress',
  ];

  const args = [...baseArgs, ...overrideArgs];
  logger.info(`[ytDlpManager] Spawning (getVideoMetadata): ${ytDlpBinaryPath} ${args.join(' ')}`);
  
  try {
    // Using YTDlpWrap's built-in execPromise for single JSON output
    const rawJsonString = await ytDlp.execPromise(args);
    if (!rawJsonString) {
        logger.warn(`[ytDlpManager] No JSON output from yt-dlp for ${videoUrl}`);
      return null;
    }
    const metadata = JSON.parse(rawJsonString) as YtDlpVideoInfoRaw;
    
    // Refine thumbnail
    const bestThumbnailUrl = getBestThumbnail(metadata.thumbnails as ThumbnailDetail[] | undefined) || metadata.thumbnail;
    
    logger.info(`[ytDlpManager] Successfully fetched metadata for video: ${metadata.title}`);
    return {
        ...metadata,
        thumbnail: bestThumbnailUrl, // Override with best selected thumbnail
        // Ensure key fields for VideoPreviewData are present
        id: metadata.id || '',
        title: metadata.title || 'Unknown Title',
        duration: metadata.duration || 0,
        channelName: metadata.channel || metadata.uploader || 'Unknown Channel', // Explicitly set channelName
    };
  } catch (error: any) {
    logger.error(`[ytDlpManager] Error fetching video metadata for ${videoUrl}: ${error.message}. Stderr: ${error.stderr || 'N/A'}`, error);
    
    if (error.message && error.message.includes('This playlist type is unviewable')) {
        // This specific error might occur if a playlist URL is passed to a function expecting a single video URL
        // and yt-dlp processes it as a playlist, then fails to get a "single" JSON dump for the playlist entity itself.
        // Or if the video is part of such a playlist and the URL resolves to the playlist context.
        logger.warn(`[ytDlpManager] The URL ${videoUrl} might be an unviewable playlist or a video within one.`);
        // Optionally, re-throw a more specific error or handle as per application logic.
        // For now, returning null as the function expects single video metadata.
    }
    return null;
  }
}

export async function importPlaylist(
  playlistUrlParam: string,
  customPlaylistName?: string,
  isPrivatePlaylist?: boolean
): Promise<Playlist> {
  logger.info(c.cyan(`[ytDlpManager] Importing playlist: ${playlistUrlParam}`));
  const ytDlpInstance = await getYtDlpInstance();
  const simplifiedUrl = simplifyPlaylistUrl(playlistUrlParam);

  // Fetch full playlist metadata including all video entries
  const metadata = await getPlaylistMetadata(simplifiedUrl);

  if (!metadata || !metadata.entries) {
    logger.error(c.red(`[ytDlpManager] Failed to fetch comprehensive metadata or no video entries for playlist: ${simplifiedUrl}`));
    throw new Error(`Failed to fetch comprehensive metadata for playlist: ${simplifiedUrl}`);
  }

  // Map raw video entries to Video objects
  const videos: Video[] = metadata.entries.map((rawVideo, index) => 
    mapRawVideoToVideo(rawVideo, index)
  );

  const newPlaylist: Playlist = {
    id: metadata.id || uuidv4(), // Use yt-dlp ID or generate a new one
    name: customPlaylistName || metadata.title || 'Unnamed Playlist',
    description: metadata.description,
    videos: videos, // Ensure this is Video[]
    thumbnail: metadata.thumbnail, // Assumes getPlaylistMetadata already selected the best playlist thumbnail for ProcessedPlaylistMetadata
    source_url: metadata.webpage_url || simplifiedUrl,
    source: 'youtube', // Assuming import is always from YouTube here
    item_count: metadata.itemCount || videos.length, // Use itemCount from processed metadata or fallback
    youtube_playlist_id: metadata.id, // yt-dlp's playlist ID
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_duration_seconds: metadata.totalDuration,
  };

  logger.info(c.greenBright(`[ytDlpManager] Successfully processed playlist data for: ${newPlaylist.name}`));
  logger.debug(c.gray(`[ytDlpManager] Playlist object created: ${JSON.stringify(newPlaylist, null, 2)}`));
  
  // Note: This function used to write metadata to a file.
  // This responsibility is now likely handled by the service that calls importPlaylist
  // and then saves the Playlist object to the database.
  // If direct file writing is still needed here for some reason, it should be re-evaluated.
  // Example: await writePlaylistMetadata(path.join(app.getPath('userData'), 'playlists_metadata'), `${newPlaylist.id}.json`, newPlaylist);

  return newPlaylist;
}

export async function ensureYtDlpBinaryIsReady(): Promise<{ ytDlpInstance: YTDlpWrap; ytDlpBinaryPath: string }> {
  if (!ytDlpWrapInstance) {
    // Assuming initializeYtDlpWrap correctly sets the global ytDlpBinaryPath
    // and returns the YTDlpWrap instance which we store in ytDlpWrapInstance.
    // The promise 'ytDlpWrapInstancePromise' is used to ensure single initialization.
    if (!ytDlpWrapInstancePromise) {
        ytDlpWrapInstancePromise = initializeYtDlpWrap();
    }
    ytDlpWrapInstance = await ytDlpWrapInstancePromise;
  }
  if (!ytDlpWrapInstance) { 
    throw new Error('Failed to initialize ytDlpWrapInstance after awaiting promise.');
  }
  // ytDlpBinaryPath should be set by initializeYtDlpWrap by now
  if (!ytDlpBinaryPath) {
    throw new Error('ytDlpBinaryPath was not set after YTDlpWrap initialization.');
  }
  return { ytDlpInstance: ytDlpWrapInstance, ytDlpBinaryPath };
}