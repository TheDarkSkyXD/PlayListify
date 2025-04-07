import { getYtDlpInstance, initYtDlp } from '../../ytDlpManager';
import { logToFile } from '../../logger';
import { PlaylistInfo } from './types';

/**
 * Gets information about a YouTube playlist
 */
export async function getPlaylistInfo(playlistUrl: string): Promise<PlaylistInfo> {
  logToFile('INFO', `Getting playlist info for ${playlistUrl}`);

  try {
    // Ensure yt-dlp is initialized
    await initYtDlp();

    // Get the yt-dlp instance
    const ytDlpInstance = getYtDlpInstance();

    // Use yt-dlp to get playlist info
    const args = [
      '--dump-json',
      '--flat-playlist',
      '--playlist-end', '1', // Only get the first video to speed things up
      playlistUrl
    ];

    const result = await ytDlpInstance.execPromise(args);

    // Parse the JSON result
    let data;
    try {
      // Handle different return types from execPromise
      if (typeof result === 'string') {
        data = JSON.parse(result);
      } else if (result && typeof result === 'object') {
        // Use type assertion to handle the case where stdout exists
        const resultObj = result as any;
        if (resultObj.stdout) {
          data = JSON.parse(resultObj.stdout);
        }
      }
    } catch (parseError) {
      logToFile('ERROR', `Error parsing playlist info: ${parseError}`);
      throw new Error(`Failed to parse playlist info: ${parseError.message}`);
    }

    if (!data) {
      logToFile('ERROR', 'No data returned from yt-dlp');
      throw new Error('No data returned from yt-dlp');
    }

    // Extract playlist ID from the URL if not available in the data
    let playlistId = data.playlist_id || '';
    if (!playlistId) {
      // Try to extract from URL
      const match = playlistUrl.match(/list=([^&]+)/);
      if (match && match[1]) {
        playlistId = match[1];
      } else {
        logToFile('WARN', `Could not extract playlist ID from URL: ${playlistUrl}`);
      }
    }

    // Get the video count using a separate command
    let videoCount = 0;
    try {
      const countArgs = [
        '--flat-playlist',
        '--dump-json',
        playlistUrl
      ];

      const countResult = await ytDlpInstance.execPromise(countArgs);

      // Count the number of lines in the output (each line is a video)
      if (typeof countResult === 'string') {
        videoCount = countResult.split('\n').filter((line: string) => line.trim().length > 0).length;
      } else if (countResult && typeof countResult === 'object') {
        const resultObj = countResult as any;
        if (resultObj.stdout) {
          videoCount = resultObj.stdout.split('\n').filter((line: string) => line.trim().length > 0).length;
        }
      }
    } catch (countError) {
      logToFile('WARN', `Error getting video count: ${countError}`);
      // Default to 0 if we can't get the count
      videoCount = 0;
    }

    // Construct the playlist info
    const playlistInfo: PlaylistInfo = {
      id: playlistId,
      title: data.playlist || 'Unknown Playlist',
      description: data.description || '',
      // Ensure we always have a valid thumbnail URL
      // If no thumbnail is provided, use the first video's thumbnail or a default image
      thumbnailUrl: data.thumbnail ||
                   (data.id ? `https://i.ytimg.com/vi/${data.id}/hqdefault.jpg` :
                   'https://i.ytimg.com/vi/default/hqdefault.jpg'),
      videoCount: videoCount
    };

    // Log the thumbnail URL for debugging
    logToFile('INFO', `Playlist thumbnail URL: ${playlistInfo.thumbnailUrl}`);

    logToFile('INFO', `Got playlist info: ${JSON.stringify(playlistInfo)}`);
    return playlistInfo;
  } catch (error) {
    logToFile('ERROR', `Failed to get playlist info: ${error}`);
    throw error;
  }
}
