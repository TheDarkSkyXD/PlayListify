import { Playlist, Video } from '../../../shared/types/appTypes';
import { rateLimiter } from '../rateLimiter';
import { getBundledYtDlpPath, execAsync, initYtDlp } from './binary';
import { MAX_BUFFER_SIZE, videoRateLimiter } from './config';
import * as fileUtils from '../../utils/fileUtils';

/**
 * Extract playlist info from a YouTube URL
 */
export async function getPlaylistInfo(playlistUrl: string): Promise<{
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoCount: number;
}> {
  // Use the rate limiter to execute this function
  return rateLimiter.execute('yt-dlp', async () => {
    try {
      // Ensure yt-dlp is initialized
      try {
        await initYtDlp();
      } catch (error) {
        console.error('Failed to initialize yt-dlp, retrying...', error);
        await initYtDlp();
      }

      console.log(`Getting playlist info for: ${playlistUrl}`);

      // Extract playlist ID from URL if it's a playlist
      let playlistId = '';
      let isYouTubeMix = false;

      if (playlistUrl.includes('list=')) {
        const match = playlistUrl.match(/list=([^&]+)/);
        if (match && match[1]) {
          playlistId = match[1];
          // Check if this is a YouTube Mix/Radio playlist (starts with RD)
          isYouTubeMix = playlistId.startsWith('RD');
        }
      }

      // For YouTube Mix playlists, we need to get more videos to get an accurate count
      // These are dynamically generated and require special handling
      if (isYouTubeMix) {
        console.log('Detected YouTube Mix playlist, using specialized approach');

        // Use --flat-playlist for faster initial fetch and ignore unavailable videos
        const result = await execAsync(
          `"${getBundledYtDlpPath()}" --dump-json --flat-playlist --ignore-errors --playlist-end 100 --no-warnings "${playlistUrl}"`,
          { maxBuffer: MAX_BUFFER_SIZE },
          30000 // 30 second timeout
        );

        const mixOutput = typeof result === 'object' && result !== null && 'stdout' in result ? (result.stdout as string) : '';

        if (!mixOutput || mixOutput.trim() === '') {
          throw new Error('No video data returned from yt-dlp for Mix playlist');
        }

        // Parse the video data - each line is a separate JSON object
        const videoLines = mixOutput.split('\n').filter((line: string) => line.trim() !== '');
        const videoCount = videoLines.length;

        // Get the first video for metadata
        let firstVideo;
        try {
          firstVideo = JSON.parse(videoLines[0]);
        } catch (parseError) {
          console.error('Error parsing first video in Mix playlist:', parseError);
          throw new Error('Failed to parse Mix playlist data');
        }

        // For Mix playlists, use a more descriptive title
        const mixTitle = firstVideo.playlist || firstVideo.playlist_title ||
                         `YouTube Mix - ${firstVideo.title}` || 'YouTube Mix';

        return {
          id: playlistId,
          title: mixTitle,
          description: 'YouTube Mix playlist',
          thumbnailUrl: firstVideo.thumbnail || '',
          videoCount: videoCount
        };
      }

      // Get info for the first video to extract playlist metadata
      // Use --flat-playlist for faster fetch
      const videoResult = await execAsync(
        `"${getBundledYtDlpPath()}" --dump-json --flat-playlist --ignore-errors --playlist-end 1 --no-warnings "${playlistUrl}"`,
        { maxBuffer: MAX_BUFFER_SIZE },
        30000 // 30 second timeout
      );

      const videoOutput = typeof videoResult === 'object' && videoResult !== null && 'stdout' in videoResult ? (videoResult.stdout as string) : '';

      if (!videoOutput || videoOutput.trim() === '') {
        throw new Error('No video data returned from yt-dlp');
      }

      // Parse the video data
      const videoData = JSON.parse(videoOutput.trim());

      // Extract playlist information
      const title = videoData.playlist || videoData.playlist_title || videoData.title || 'Untitled Playlist';
      const description = videoData.description || '';

      // When using --flat-playlist, we need to construct the thumbnail URL
      let thumbnailUrl = videoData.thumbnail || '';
      if (!thumbnailUrl && videoData.id) {
        // Use hqdefault.jpg which is more reliably available
        thumbnailUrl = `https://i.ytimg.com/vi/${videoData.id}/hqdefault.jpg`;
      }

      // Get an accurate video count
      let videoCount = 1; // Default to 1 if we can't get a count

      try {
        // First try to get the count directly from the playlist info
        if (videoData.playlist_count && typeof videoData.playlist_count === 'number') {
          videoCount = videoData.playlist_count;
        } else if (videoData.n_entries && typeof videoData.n_entries === 'number') {
          videoCount = videoData.n_entries;
        } else {
          // Use --flat-playlist for faster video counting and skip unavailable videos
          const countResult = await execAsync(
            `"${getBundledYtDlpPath()}" --flat-playlist --ignore-errors --no-warnings --dump-json "${playlistUrl}"`,
            { maxBuffer: MAX_BUFFER_SIZE },
            30000 // 30 second timeout
          );

          const countOutput = typeof countResult === 'object' && countResult !== null && 'stdout' in countResult ? (countResult.stdout as string) : '';

          // Count the lines to get the video count
          const lines = countOutput.split('\n').filter((line: string) => line.trim() !== '');
          videoCount = lines.length;
        }
      } catch (countError) {
        console.warn('Could not get video count, using default:', countError);
      }

      return {
        id: playlistId || videoData.id || '',
        title: title,
        description: description,
        thumbnailUrl: thumbnailUrl,
        videoCount: videoCount
      };
    } catch (error: any) {
      console.error('Error extracting playlist info:', error);
      throw new Error(`Failed to extract playlist info: ${error.message}`);
    }
  });
}

/**
 * Extract video entries from a YouTube playlist
 */
export async function getPlaylistVideos(playlistUrl: string, progressCallback?: (currentCount: number) => void): Promise<Video[]> {
  // Use the rate limiter to execute this function
  return rateLimiter.execute('yt-dlp', async () => {
    try {
      // Ensure yt-dlp is initialized
      try {
        await initYtDlp();
      } catch (error) {
        console.error('Failed to initialize yt-dlp, retrying...', error);
        await initYtDlp();
      }

      // Get the current date string for addedAt field
      const currentDate = new Date().toISOString();

      console.log(`Getting playlist videos for: ${playlistUrl}`);

      // Define a timeout for the yt-dlp command (2 minutes)
      const TIMEOUT_MS = 2 * 60 * 1000;

      // Create a promise that rejects after the timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out after 2 minutes')), TIMEOUT_MS);
      });

      // Use --flat-playlist for faster initial fetch and ignore unavailable videos
      // This is much faster but provides less detailed data
      const commandPromise = execAsync(`"${getBundledYtDlpPath()}" --dump-json --flat-playlist --ignore-errors --no-warnings "${playlistUrl}"`, {
        maxBuffer: MAX_BUFFER_SIZE
      }, 30000); // 30 second timeout

      // Race the command against the timeout
      console.log(`Executing yt-dlp command with ${TIMEOUT_MS}ms timeout...`);
      const { stdout } = await Promise.race([commandPromise, timeoutPromise]) as { stdout: string };

      console.log('Command completed, processing results...');

      if (!stdout || stdout.trim() === '') {
        console.error('No data returned from yt-dlp command');
        throw new Error('No data returned from yt-dlp');
      }

      // Parse each line as a JSON object for each video
      const videos: Video[] = [];
      const lines = stdout.split('\n').filter(Boolean);

      console.log(`Found ${lines.length} video entries to process`);

      let validVideoCount = 0;
      lines.forEach((line, index) => {
        try {
          const videoInfo = JSON.parse(line);
          // When using --flat-playlist, we need to construct the thumbnail URL
          const videoId = videoInfo.id;
          // Use hqdefault.jpg which is more reliably available
          const thumbnailUrl = videoInfo.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          // Skip private videos
          if (videoInfo.title === 'Private video' || videoInfo.title === '[Private video]' || videoInfo.title === 'Deleted video') {
            console.log(`Skipping private/deleted video at index ${index}`);
            return; // Skip this video
          }

          videos.push({
            id: videoId,
            title: videoInfo.title || `Video ${index + 1}`,
            url: videoInfo.url || `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail: thumbnailUrl,
            duration: videoInfo.duration || 0, // duration may not be available in flat-playlist mode
            downloaded: false,
            addedAt: currentDate,
            status: 'available'
          });
          validVideoCount++;
          progressCallback?.(validVideoCount);
        } catch (e) {
          // Skip lines that can't be parsed
          console.error('Error parsing video info:', e);
        }
      });

      const skippedCount = lines.length - videos.length;
      console.log(`Successfully processed ${videos.length} videos from playlist (skipped ${skippedCount} private/deleted videos)`);

      // Log if we skipped any private videos
      if (skippedCount > 0) {
        console.log(`Skipped ${skippedCount} private or deleted videos that cannot be accessed`);
      }

      // Handle if we got no videos but no error was thrown
      if (videos.length === 0) {
        console.error('No videos could be processed from the playlist');
        throw new Error('No videos could be extracted from this playlist. The playlist might be empty, private, or all videos are unavailable.');
      }

      return videos;
    } catch (error: any) {
      console.error('Error extracting playlist videos:', error);

      // Provide more helpful error messages
      if (error.message.includes('timed out')) {
        throw new Error('The playlist import timed out. This could be because the playlist is too large or YouTube is throttling requests.');
      } else if (error.message.includes('Private video')) {
        throw new Error('This playlist contains private videos that cannot be accessed. Try importing again - private videos will be skipped.');
      } else if (error.message.includes('sign in')) {
        throw new Error('This playlist requires you to sign in to YouTube.');
      } else {
        throw new Error(`Failed to extract playlist videos: ${error.message}`);
      }
    }
  });
}

/**
 * Import a YouTube playlist and save it locally
 * @param playlistUrl The URL of the YouTube playlist
 * @param progressCallback Optional callback for progress updates
 * @param existingPlaylistInfo Optional playlist info to avoid fetching it again
 */
export async function importYoutubePlaylist(
  playlistUrl: string,
  progressCallback?: (status: string, count?: number, total?: number) => void,
  existingPlaylistInfo?: any // Add optional parameter to avoid duplicate fetching
): Promise<Playlist> {
  try {
    // Report starting status - don't set total videos yet
    progressCallback?.('Starting playlist import...', 0, 0);
    console.log(`Starting import for playlist: ${playlistUrl}`);

    // Get playlist general info
    let playlistInfo: any;

    // Use existing playlist info if provided, otherwise fetch it
    if (existingPlaylistInfo) {
      console.log('[BACKEND] Using existing playlist info (avoiding duplicate fetch)');
      playlistInfo = existingPlaylistInfo;
      console.log(`Found playlist: "${playlistInfo.title}" with ${playlistInfo.videoCount} videos`);

      // Send an update with the actual video count
      progressCallback?.(`Found playlist: ${playlistInfo.title} (${playlistInfo.videoCount} videos)`, 0, playlistInfo.videoCount);
      console.log(`[BACKEND] Sent progress update: Found playlist with ${playlistInfo.videoCount} videos`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay to ensure UI updates
    } else {
      try {
        console.log('Fetching playlist info...');
        playlistInfo = await getPlaylistInfo(playlistUrl);
        console.log(`Found playlist: "${playlistInfo.title}" with ${playlistInfo.videoCount} videos`);

        // Send an update with the actual video count as soon as we know it
        // But don't send a count yet - this prevents the UI from showing a count before we start processing
        progressCallback?.(`Found playlist: ${playlistInfo.title} (${playlistInfo.videoCount} videos)`, 0, playlistInfo.videoCount);
        console.log(`[BACKEND] Sent progress update: Found playlist with ${playlistInfo.videoCount} videos`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay to ensure UI updates
      } catch (error: any) {
        console.error('Error retrieving playlist info:', error);
        progressCallback?.(`Error: ${error.message}`);
        throw new Error(`Failed to retrieve playlist info: ${error.message}`);
      }
    }

    // REMOVED DUPLICATE PROGRESS UPDATE

    // Prepare to retrieve videos
    // Don't send a count yet - this prevents the UI from showing a count before we start processing
    progressCallback?.('Preparing to retrieve videos...', 0, playlistInfo.videoCount);
    console.log(`[BACKEND] Sent progress update: Preparing to retrieve videos (count: 0/${playlistInfo.videoCount})`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay to ensure UI updates
    let videos: Video[] = [];

    try {
      console.log('Fetching videos from playlist using optimized approach...');

      // Check if this is a YouTube Mix playlist (starts with RD)
      const isYouTubeMix = playlistUrl.includes('list=') &&
                          playlistUrl.match(/list=([^&]+)/)?.[1]?.startsWith('RD');

      // For Mix playlists, we'll use our specialized approach
      if (isYouTubeMix) {
        console.log('Using specialized approach for YouTube Mix playlist');
        // Use --flat-playlist for faster initial fetch and ignore unavailable videos
        // Limit to 100 videos for Mix playlists to keep it reasonably fast
        const result = await execAsync(
          `"${getBundledYtDlpPath()}" --dump-json --flat-playlist --ignore-errors --playlist-end 100 --no-warnings "${playlistUrl}"`,
          { maxBuffer: MAX_BUFFER_SIZE },
          30000 // 30 second timeout
        );

        const stdout = typeof result === 'object' && result !== null && 'stdout' in result ? (result.stdout as string) : '';

        if (!stdout || stdout.trim() === '') {
          throw new Error('No data returned from yt-dlp');
        }

        // Parse each line as a video
        const lines = stdout.split('\n').filter((line: string) => line.trim() !== '');
        const currentDate = new Date().toISOString();

        console.log(`Found ${lines.length} video entries to process`);

        // IMPORTANT: Don't send a count > 0 before we actually start processing videos
        // This prevents the UI from showing fake progress

        // Add delays to make progress visible
        videoRateLimiter.setDelay(300); // Temporarily increase delay for progress update
        await videoRateLimiter.delay();

        // Add a small delay before starting to process videos
        videoRateLimiter.setDelay(200); // Adjust delay for pre-processing
        await videoRateLimiter.delay();

        // Use a more moderate delay for individual videos to ensure smooth progress updates
        videoRateLimiter.setDelay(300);

        // Send an initial progress update before starting to process videos
        // IMPORTANT: Always use count=0 before we start processing videos
        progressCallback?.(`Starting to process ${lines.length} videos...`, 0, playlistInfo.videoCount);
        console.log(`[BACKEND] Sent progress update: Starting to process ${lines.length} videos (count: 0/${playlistInfo.videoCount})`);

        // Add a moderate delay before starting to process videos
        // This ensures the UI has time to update and show the progress
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log(`[BACKEND] *** ACTUAL PROCESSING BEGINS HERE ***`);

        // Process videos in batches to avoid UI freezing
        let processedCount = 0;
        for (const line of lines) {
          try {
            const videoInfo = JSON.parse(line);
            // When using --flat-playlist, we need to construct the thumbnail URL
            const videoId = videoInfo.id;
            // Use hqdefault.jpg which is more reliably available
            const thumbnailUrl = videoInfo.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            // Skip private videos
            if (videoInfo.title === 'Private video' || videoInfo.title === '[Private video]' || videoInfo.title === 'Deleted video') {
              console.log(`Skipping private/deleted video at index ${processedCount}`);
              processedCount++;
              continue; // Skip this video
            }

            videos.push({
              id: videoId,
              title: videoInfo.title || `Video ${processedCount + 1}`,
              url: videoInfo.url || `https://www.youtube.com/watch?v=${videoId}`,
              thumbnail: thumbnailUrl,
              duration: videoInfo.duration || 0,
              downloaded: false,
              addedAt: currentDate,
              status: 'available'
            });
            processedCount++;

            // Report progress for each video
            // Calculate progress value based on processed count
            // IMPORTANT: Start from 0 and go up to 100 (not 15 to 90)
            // const progressValue = Math.floor((processedCount / lines.length) * 100);
            progressCallback?.(`Processing video ${processedCount} of ${lines.length}...`, processedCount, playlistInfo.videoCount);

            // Log the first few videos to track progress
            if (processedCount <= 3 || processedCount % 10 === 0) {
              console.log(`[BACKEND] Processing video ${processedCount}/${lines.length} - Progress: ${processedCount}/${playlistInfo.videoCount}`);
            }

            // Apply a delay AFTER updating the progress to ensure the UI has time to render
            // This slows down processing just enough to see the progress clearly
            await videoRateLimiter.delay();
          } catch (e) {
            console.error('Error parsing video info:', e);
          }
        }

        // Final progress update
        progressCallback?.('Retrieving videos...', 90, playlistInfo.videoCount);
        const skippedCount = processedCount - videos.length;
        console.log(`Successfully processed ${videos.length} videos from Mix playlist (skipped ${skippedCount} private/deleted videos)`);

        // Log if we skipped any private videos
        if (skippedCount > 0) {
          console.log(`Skipped ${skippedCount} private or deleted videos that cannot be accessed`);
        }
      } else {
        // For regular playlists, use the standard approach but with optimizations
        console.log('Using optimized approach for standard playlist');

        // Use --flat-playlist for faster initial fetch and ignore unavailable videos
        // This is much faster but provides less detailed data
        const result = await execAsync(
          `"${getBundledYtDlpPath()}" --dump-json --flat-playlist --ignore-errors --no-warnings "${playlistUrl}"`,
          { maxBuffer: MAX_BUFFER_SIZE },
          30000 // 30 second timeout
        );

        const stdout = typeof result === 'object' && result !== null && 'stdout' in result ? (result.stdout as string) : '';

        if (!stdout || stdout.trim() === '') {
          throw new Error('No data returned from yt-dlp');
        }

        // Parse each line as a video
        const lines = stdout.split('\n').filter((line: string) => line.trim() !== '');
        const currentDate = new Date().toISOString();

        console.log(`Found ${lines.length} video entries to process`);

        // Add a small delay before starting to process videos
        videoRateLimiter.setDelay(200); // Temporarily increase delay for initial processing
        await videoRateLimiter.delay();
        videoRateLimiter.setDelay(300); // Use a more moderate delay for individual videos

        // Send an initial progress update before starting to process videos
        // Don't send a count yet - this prevents the UI from showing a count before we start processing
        progressCallback?.(`Starting to process ${lines.length} videos...`, 0, playlistInfo.videoCount);

        // Add a moderate delay before starting to process videos
        // This ensures the UI has time to update and show the progress
        await new Promise(resolve => setTimeout(resolve, 800));

        // Process videos in batches to avoid UI freezing
        let processedCount = 0;
        for (const line of lines) {
          try {
            const videoInfo = JSON.parse(line);
            // When using --flat-playlist, we need to construct the thumbnail URL
            const videoId = videoInfo.id;
            // Use hqdefault.jpg which is more reliably available
            const thumbnailUrl = videoInfo.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            // Skip private videos
            if (videoInfo.title === 'Private video' || videoInfo.title === '[Private video]' || videoInfo.title === 'Deleted video') {
              console.log(`Skipping private/deleted video at index ${processedCount}`);
              processedCount++;
              continue; // Skip this video
            }

            videos.push({
              id: videoId,
              title: videoInfo.title || `Video ${processedCount + 1}`,
              url: videoInfo.url || `https://www.youtube.com/watch?v=${videoId}`,
              thumbnail: thumbnailUrl,
              duration: videoInfo.duration || 0,
              downloaded: false,
              addedAt: currentDate,
              status: 'available'
            });
            processedCount++;

            // Report progress for each video
            // Calculate progress value based on processed count
            // IMPORTANT: Start from 0 and go up to 100 (not 15 to 90)
            // const progressValue = Math.floor((processedCount / lines.length) * 100);
            progressCallback?.(`Processing video ${processedCount} of ${lines.length}...`, processedCount, playlistInfo.videoCount);

            // Apply a delay AFTER updating the progress to ensure the UI has time to render
            // This slows down processing just enough to see the progress clearly
            await videoRateLimiter.delay();
          } catch (e) {
            console.error('Error parsing video info:', e);
          }
        }

        // Final progress update
        progressCallback?.('Retrieving videos...', 90, playlistInfo.videoCount);
        const skippedCount = processedCount - videos.length;
        console.log(`Successfully processed ${videos.length} videos from playlist (skipped ${skippedCount} private/deleted videos)`);

        // Log if we skipped any private videos
        if (skippedCount > 0) {
          console.log(`Skipped ${skippedCount} private or deleted videos that cannot be accessed`);
        }
      }
    } catch (error: any) {
      console.error('Error retrieving playlist videos:', error);
      progressCallback?.(`Error: ${error.message}`);
      throw new Error(`Failed to retrieve playlist videos: ${error.message}`);
    }

    // Report videos retrieved
    progressCallback?.(`Retrieved ${videos.length} videos`, 92, playlistInfo.videoCount);
    videoRateLimiter.setDelay(400); // Increase delay for major progress update
    await videoRateLimiter.delay();

    // Create a new playlist object
    progressCallback?.('Creating playlist...', 95, playlistInfo.videoCount);
    videoRateLimiter.setDelay(300); // Adjust delay for next stage
    await videoRateLimiter.delay();
    console.log('Creating playlist in local database...');
    const currentDate = new Date().toISOString();
    const playlistId = fileUtils.createPlaylistId();

    const playlist: Playlist = {
      id: playlistId,
      name: playlistInfo.title,
      description: playlistInfo.description,
      thumbnail: playlistInfo.thumbnailUrl,
      videos,
      source: 'youtube',
      sourceUrl: playlistUrl,
      createdAt: currentDate,
      updatedAt: currentDate
    };

    // Create a directory for the playlist
    progressCallback?.('Saving playlist metadata...', 98, playlistInfo.videoCount);
    videoRateLimiter.setDelay(300); // Adjust delay for next stage
    await videoRateLimiter.delay();
    console.log(`Creating directory for playlist ID: ${playlistId}`);

    try {
      await fileUtils.createPlaylistDir(playlistId, playlist.name);
      console.log('Playlist directory created successfully');

      // Save playlist metadata
      console.log('Saving playlist metadata...');
      await fileUtils.writePlaylistMetadata(playlistId, playlist.name, playlist);
      console.log('Playlist metadata saved successfully');
    } catch (error: any) {
      console.error('Error saving playlist:', error);
      progressCallback?.(`Error: ${error.message}`);
      throw new Error(`Failed to save playlist: ${error.message}`);
    }

    // Check if we got any videos
    if (videos.length === 0) {
      throw new Error('No videos could be imported from this playlist. The playlist might be empty, private, or all videos are unavailable.');
    }

    // Add a note about skipped videos in the final progress message
    const totalSkipped = playlistInfo.videoCount - videos.length;

    // Import complete
    if (totalSkipped > 0) {
      progressCallback?.(`Import complete! (${totalSkipped} private/deleted videos were skipped)`, videos.length, videos.length);
    } else {
      progressCallback?.('Import complete!', videos.length, videos.length);
    }

    // Note: Videos that already exist in the playlist will be reported separately
    // by the database manager when they are added

    videoRateLimiter.setDelay(300); // Final delay to show completion
    await videoRateLimiter.delay();

    if (totalSkipped > 0) {
      console.log(`Playlist "${playlist.name}" imported successfully with ${videos.length} videos (${totalSkipped} private/deleted videos were skipped)`);
    } else {
      console.log(`Playlist "${playlist.name}" imported successfully with ${videos.length} videos`);
    }
    return playlist;
  } catch (error: any) {
    console.error('Error importing YouTube playlist:', error);
    progressCallback?.(`Error: ${error.message}`);
    throw new Error(`Failed to import YouTube playlist: ${error.message}`);
  }
}
