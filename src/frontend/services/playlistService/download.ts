/**
 * Download operations for playlists
 */
export const downloadOperations = {
  /**
   * Download an entire playlist
   */
  async downloadPlaylist(
    options: {
      playlistId: string;
      downloadLocation?: string;
      createPlaylistFolder?: boolean;
      format?: string;
      quality?: string;
    },
    onProgress: (completed: number, total: number) => void
  ): Promise<string[] | { status: string; message: string }> {
    try {
      console.log('=== PLAYLIST SERVICE DOWNLOAD START ===');
      console.log('playlistService.downloadPlaylist: Starting with options:', options);

      if (!window.api) {
        console.error('playlistService.downloadPlaylist: window.api is not available');
        throw new Error('IPC bridge not available');
      }

      if (!window.api.playlists) {
        console.error('playlistService.downloadPlaylist: window.api.playlists is not available');
        throw new Error('Playlists API not available');
      }

      // Get the playlist to find out how many videos are in it
      console.log('playlistService.downloadPlaylist: Fetching playlist with ID:', options.playlistId);
      const playlist = await window.api.playlists.getById(options.playlistId);

      if (!playlist) {
        console.error('playlistService.downloadPlaylist: Playlist not found:', options.playlistId);
        throw new Error(`Playlist ${options.playlistId} not found`);
      }

      console.log('playlistService.downloadPlaylist: Playlist fetched:', playlist.name);

      const videos = playlist.videos;
      const total = videos.length;
      console.log('playlistService.downloadPlaylist: Total videos in playlist:', total);

      const downloadPaths: string[] = [];

      // Prepare videos for batch download
      console.log('playlistService.downloadPlaylist: Filtering videos for download...');
      const videosToDownload = videos
        .filter((video: any) => {
          // Always download videos regardless of download status
          if (video.downloaded) {
            console.log('playlistService.downloadPlaylist: Re-downloading already downloaded video:', video.id, video.title);
          }
          return true;
        })
        .map((video: any) => {
          console.log('playlistService.downloadPlaylist: Preparing video for download:', video.id, video.title);
          return {
            videoId: video.id,
            url: video.url,
            title: video.title,
            thumbnail: video.thumbnail
          };
        });

      console.log('playlistService.downloadPlaylist: Videos to download:', videosToDownload.length);

      // If we have a custom download location and options, use the batch download API
      if (options.downloadLocation && videosToDownload.length > 0) {
        console.log('playlistService.downloadPlaylist: Using batch download API with custom location:', options.downloadLocation);

        // Use type assertion to access the downloads API
        const api = window.api as any;

        if (!api.downloads) {
          console.error('playlistService.downloadPlaylist: api.downloads is not available');
          throw new Error('Downloads API not available');
        }

        if (!api.downloads.addMultipleToQueue) {
          console.error('playlistService.downloadPlaylist: api.downloads.addMultipleToQueue is not available');
          throw new Error('addMultipleToQueue method not available');
        }

        console.log('playlistService.downloadPlaylist: Adding videos to download queue:', {
          videosCount: videosToDownload.length,
          playlistId: options.playlistId,
          playlistName: playlist.name,
          downloadLocation: options.downloadLocation,
          createPlaylistFolder: options.createPlaylistFolder
        });

        try {
          // Make sure the videos have valid URLs
          console.log('playlistService.downloadPlaylist: Validating videos before download...');
          const validVideos = videosToDownload.filter((video: {videoId: string, url: string, title: string, thumbnail?: string}) => {
            if (!video.url || !video.videoId || !video.title) {
              console.warn('playlistService.downloadPlaylist: Skipping invalid video:', video);
              return false;
            }
            return true;
          });

          if (validVideos.length === 0) {
            console.error('playlistService.downloadPlaylist: No valid videos to download');
            onProgress(total, total);
            return [];
          }

          console.log('playlistService.downloadPlaylist: Sending valid videos to download queue:', validVideos.length);
          console.log('playlistService.downloadPlaylist: First video:', validVideos[0]);

          // Call the addMultipleToQueue method
          console.log('playlistService.downloadPlaylist: Calling addMultipleToQueue with params:', {
            videosCount: validVideos.length,
            playlistId: options.playlistId,
            playlistName: playlist.name,
            downloadLocation: options.downloadLocation,
            createPlaylistFolder: options.createPlaylistFolder
          });

          console.log('playlistService.downloadPlaylist: About to call api.downloads.addMultipleToQueue...');
          const downloadIds = await api.downloads.addMultipleToQueue(
            validVideos,
            options.playlistId,
            playlist.name,
            options.downloadLocation,
            options.createPlaylistFolder
          );

          console.log('playlistService.downloadPlaylist: Videos added to download queue, download IDs:', downloadIds);
          console.log('playlistService.downloadPlaylist: Type of downloadIds:', typeof downloadIds);
          console.log('playlistService.downloadPlaylist: Is array:', Array.isArray(downloadIds));
          console.log('playlistService.downloadPlaylist: Length:', Array.isArray(downloadIds) ? downloadIds.length : 'N/A');

          // Force a refresh of the download store
          setTimeout(() => {
            console.log('playlistService.downloadPlaylist: Forcing download store refresh after adding videos...');
            if (api.downloads.getAll) {
              api.downloads.getAll().then((downloads: any) => {
                console.log('playlistService.downloadPlaylist: Download refresh after adding videos returned:', downloads);
              }).catch((error: any) => {
                console.error('playlistService.downloadPlaylist: Error in download refresh after adding videos:', error);
              });
            }
          }, 1000);

          // Update progress to show all videos are queued
          onProgress(total, total);
          console.log('playlistService.downloadPlaylist: Returning downloadIds:', downloadIds);
          console.log('=== PLAYLIST SERVICE DOWNLOAD COMPLETE ===');
          return downloadIds;
        } catch (error) {
          console.error('playlistService.downloadPlaylist: Error adding videos to download queue:', error);
          console.log('=== PLAYLIST SERVICE DOWNLOAD ERROR ===');
          throw error;
        }
      } else {
        // No download location or no videos to download
        if (!options.downloadLocation) {
          console.error('playlistService.downloadPlaylist: No download location provided');
        }
        if (videosToDownload.length === 0) {
          console.log('playlistService.downloadPlaylist: No videos to download');
          // Return a special result to indicate no videos to download
          onProgress(total, total);
          console.log('=== PLAYLIST SERVICE DOWNLOAD COMPLETE (NO VIDEOS) ===');
          return { status: 'no-videos', message: 'There are no videos in this playlist to download.' };
        }

        // Fallback to the old method if batch download is not available
        console.log('playlistService.downloadPlaylist: Using fallback method for downloading videos');

        // Download each video sequentially
        for (let i = 0; i < videos.length; i++) {
          const video = videos[i];

          try {
            // Skip already downloaded videos
            if (video.downloaded) {
              console.log(`playlistService.downloadPlaylist: Skipping already downloaded video ${i+1}/${total}:`, video.id);
              onProgress(i + 1, total);
              continue;
            }

            console.log(`playlistService.downloadPlaylist: Downloading video ${i+1}/${total}:`, video.id, video.title);
            const downloadPath = await window.api.playlists.downloadVideo(options.playlistId, video.id);
            downloadPaths.push(downloadPath as unknown as string);
            console.log(`playlistService.downloadPlaylist: Video downloaded to:`, downloadPath);

            // Update progress after each video
            onProgress(i + 1, total);
          } catch (videoError) {
            console.error(`playlistService.downloadPlaylist: Error downloading video ${video.id}:`, videoError);
            // Continue with next video instead of failing the whole operation
          }
        }

        console.log('playlistService.downloadPlaylist: All videos downloaded, paths:', downloadPaths);
        return downloadPaths;
      }
    } catch (error) {
      console.error(`playlistService.downloadPlaylist: Error downloading playlist ${options.playlistId}:`, error);
      throw error;
    }
  }
};
