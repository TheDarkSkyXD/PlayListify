// Configuration constants for yt-dlp operations

// Default max buffer size for yt-dlp commands (increased to 100MB)
export const MAX_BUFFER_SIZE = 100 * 1024 * 1024; // 100MB

// Default timeout for yt-dlp operations (2 minutes)
export const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000;

// Video processing rate limiter to make progress bar movement visible
export class VideoProcessingRateLimiter {
  private delayMs: number;

  constructor(delayMs: number = 30) {
    this.delayMs = delayMs;
  }

  async delay() {
    console.log(`Applying rate limit delay of ${this.delayMs}ms`);
    return new Promise(resolve => setTimeout(resolve, this.delayMs));
  }

  setDelay(delayMs: number) {
    this.delayMs = delayMs;
  }
}

// Create a rate limiter instance
// Use a more conservative delay to ensure the progress bar shows properly
export const videoRateLimiter = new VideoProcessingRateLimiter(500); // 500ms (0.5 seconds) delay by default
