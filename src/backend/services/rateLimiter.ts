import { RATE_LIMITS } from '../../shared/constants/appConstants';

/**
 * A simple rate limiter implementation to prevent API abuse
 */
export class RateLimiter {
  private requestTimestamps: Map<string, number[]> = new Map();
  private limiters: Map<string, { maxRequests: number; perMinute: number; cooldownMs: number }> = new Map();

  constructor() {
    // Set up default rate limiters
    this.setupDefaultLimiters();
  }

  /**
   * Set up default rate limiters from constants
   */
  private setupDefaultLimiters(): void {
    this.limiters.set('youtube-api', RATE_LIMITS.YOUTUBE_API);
    this.limiters.set('yt-dlp', RATE_LIMITS.YT_DLP);
  }

  /**
   * Register a custom rate limiter
   */
  public registerLimiter(
    name: string,
    { maxRequests, perMinute, cooldownMs }: { maxRequests: number; perMinute: number; cooldownMs: number }
  ): void {
    this.limiters.set(name, { maxRequests, perMinute, cooldownMs });
  }

  /**
   * Check if a request can be made within rate limits
   * @param limiterName The name of the rate limiter to use
   * @returns Whether the request is allowed
   */
  public canMakeRequest(limiterName: string): boolean {
    const limiter = this.limiters.get(limiterName);
    if (!limiter) {
      console.warn(`Rate limiter "${limiterName}" not found. Using default.`);
      return true;
    }

    const now = Date.now();
    const timestamps = this.requestTimestamps.get(limiterName) || [];
    
    // Calculate time window in milliseconds (how far back to check)
    const timeWindow = (limiter.perMinute * 60 * 1000);
    
    // Filter timestamps to only include those within the time window
    const recentTimestamps = timestamps.filter(
      timestamp => now - timestamp < timeWindow
    );

    // Check if we're within rate limits
    if (recentTimestamps.length < limiter.maxRequests) {
      return true;
    }

    return false;
  }

  /**
   * Get the cooldown time remaining before the next request can be made
   * @param limiterName The name of the rate limiter to use
   * @returns Time in milliseconds until next allowed request
   */
  public getTimeUntilNextRequest(limiterName: string): number {
    const limiter = this.limiters.get(limiterName);
    if (!limiter) {
      console.warn(`Rate limiter "${limiterName}" not found. Using default.`);
      return 0;
    }

    const now = Date.now();
    const timestamps = this.requestTimestamps.get(limiterName) || [];
    
    if (timestamps.length === 0) {
      return 0;
    }

    // If we have at least one timestamp, ensure minimum cooldown
    const lastRequest = Math.max(...timestamps);
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < limiter.cooldownMs) {
      return limiter.cooldownMs - timeSinceLastRequest;
    }

    // Calculate time window in milliseconds
    const timeWindow = (limiter.perMinute * 60 * 1000);
    
    // If we're at capacity, calculate when the oldest request will expire
    const recentTimestamps = timestamps
      .filter(timestamp => now - timestamp < timeWindow)
      .sort();

    if (recentTimestamps.length >= limiter.maxRequests) {
      return (recentTimestamps[0] + timeWindow) - now;
    }

    return 0;
  }

  /**
   * Record that a request was made
   * @param limiterName The name of the rate limiter to use
   */
  public recordRequest(limiterName: string): void {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(limiterName) || [];
    
    // Add current timestamp
    timestamps.push(now);
    
    // Update timestamps
    this.requestTimestamps.set(limiterName, timestamps);
  }

  /**
   * Wait for rate limit to allow a request, then record it
   * @param limiterName The name of the rate limiter to use
   * @returns Promise that resolves when the request is allowed
   */
  public async waitForRateLimit(limiterName: string): Promise<void> {
    const waitTime = this.getTimeUntilNextRequest(limiterName);
    
    if (waitTime > 0) {
      // Log for debugging
      console.log(`Rate limiting ${limiterName} request for ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Record the request
    this.recordRequest(limiterName);
  }

  /**
   * Execute a function with rate limiting
   * @param limiterName The name of the rate limiter to use
   * @param fn The function to execute
   * @returns Promise with the function result
   */
  public async execute<T>(limiterName: string, fn: () => Promise<T>): Promise<T> {
    await this.waitForRateLimit(limiterName);
    return await fn();
  }
}

// Export a singleton instance
export const rateLimiter = new RateLimiter(); 