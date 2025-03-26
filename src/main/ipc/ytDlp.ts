import { 
  downloadVideo, 
  checkVideoStatus,
  isYtDlpAvailable,
  getPlaylistInfo,
  getPlaylistVideos,
  importYoutubePlaylist,
  getVideoInfo
} from '../services/ytDlpManager';

// Track download progress
let downloadProgress = {
  isDownloading: false,
  progress: 0
};

export const ytDlpHandlers = {
  'ytdlp:getStatus': async () => {
    const available = isYtDlpAvailable();
    return {
      available,
      errorMessage: available ? '' : 'Internal error with yt-dlp. Please restart the application.'
    };
  },
  
  'ytdlp:getVideoInfo': async (_event: any, videoUrl: string) => {
    return await getVideoInfo(videoUrl);
  },
  
  'yt:getVideoInfo': async (_event: any, videoUrl: string) => {
    return await getVideoInfo(videoUrl);
  },
  
  'yt:getPlaylistInfo': async (_event: any, playlistUrl: string) => {
    return await getPlaylistInfo(playlistUrl);
  },
  
  'yt:getPlaylistVideos': async (_event: any, playlistUrl: string) => {
    return await getPlaylistVideos(playlistUrl);
  },
  
  'yt:importPlaylist': async (_event: any, playlistUrl: string) => {
    return await importYoutubePlaylist(playlistUrl);
  },
  
  'yt:downloadVideo': async (_event: any, videoUrl: string, outputDir: string, videoId: string, options?: any) => {
    return await downloadVideo(videoUrl, outputDir, videoId, options);
  },
  
  'yt:checkVideoStatus': async (_event: any, videoUrl: string) => {
    return await checkVideoStatus(videoUrl);
  },
  
  'ytdlp:getDownloadProgress': async () => {
    return downloadProgress;
  }
}; 