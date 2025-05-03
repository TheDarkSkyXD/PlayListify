/**
 * Determines if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Extracts a YouTube video ID from a URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!isYouTubeUrl(url)) return null;
  
  try {
    if (url.includes('youtu.be')) {
      // Handle youtu.be format
      const path = new URL(url).pathname;
      return path.split('/')[1] || null;
    } else {
      // Handle youtube.com format
      const urlParams = new URLSearchParams(new URL(url).search);
      return urlParams.get('v');
    }
  } catch (e) {
    console.error('Failed to extract YouTube video ID:', e);
    return null;
  }
}

/**
 * Constructs a YouTube thumbnail URL from a video ID
 */
export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Constructs a local file URL from a video path
 */
export function getLocalFileUrl(
  downloadLocation: string,
  playlistName: string,
  videoId: string,
  format: string = 'mp4'
): string {
  return `file://${downloadLocation}/${playlistName}/${videoId}.${format}`;
}

/**
 * Converts a file URL to a local path
 */
export function fileUrlToLocalPath(fileUrl: string): string {
  if (!fileUrl.startsWith('file://')) return fileUrl;
  
  // Remove the file:// prefix
  return fileUrl.substring(7);
}

/**
 * Creates a subtitle track object for ReactPlayer
 */
export interface SubtitleTrack {
  kind: 'subtitles';
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
}

export function createSubtitleTrack(
  src: string,
  language: string,
  label: string,
  isDefault: boolean = false
): SubtitleTrack {
  return {
    kind: 'subtitles',
    src,
    srcLang: language,
    label,
    default: isDefault
  };
}

/**
 * Gets the player config for different media types
 */
export function getPlayerConfig(url: string, playing: boolean) {
  if (isYouTubeUrl(url)) {
    return {
      youtube: {
        playerVars: {
          origin: window.location.origin,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          controls: 1,
          iv_load_policy: 3,  // Disable annotations
          fs: 1,              // Enable fullscreen button
          playsinline: 1,     // Play inline on mobile devices
          disablekb: 0,       // Enable keyboard controls
          enablejsapi: 1,     // Enable JavaScript API
          autoplay: playing ? 1 : 0  // Respect the playing state
        },
        embedOptions: {},
        onUnstarted: () => console.log('Video unstarted')
      }
    };
  }
  
  // Local file config
  return {
    file: {
      attributes: {
        controlsList: 'nodownload',
      },
      // Subtitle tracks could be added here if available
      tracks: [],
    },
  };
} 