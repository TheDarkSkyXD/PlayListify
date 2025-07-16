// src/backend/services/youtube-url-validation-service.ts

import { NetworkError, ValidationError } from '../../shared/errors';
import { StructuredLoggerService } from './structured-logger-service';

export interface YouTubeUrlInfo {
  type: 'playlist' | 'video' | 'channel' | 'invalid';
  id: string;
  originalUrl: string;
  normalizedUrl: string;
  isValid: boolean;
}

export interface YouTubePlaylistPreview {
  id: string;
  title: string;
  description?: string;
  videoCount: number;
  visibility: 'public' | 'unlisted' | 'private';
  thumbnailUrl?: string;
  channelTitle: string;
  channelId: string;
  createdAt?: string;
  updatedAt?: string;
  isAccessible: boolean;
  estimatedDuration?: number;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  cooldownPeriod: number; // in milliseconds
}

export interface ValidationResult {
  isValid: boolean;
  urlInfo: YouTubeUrlInfo;
  errors: string[];
  warnings: string[];
}

export class YouTubeUrlValidationService {
  private logger: StructuredLoggerService;
  private rateLimitConfig: RateLimitConfig;
  private requestHistory: Map<string, number[]> = new Map(); // IP -> timestamps
  private cooldownUsers: Set<string> = new Set();

  // YouTube URL patterns
  private readonly urlPatterns = {
    playlist: [
      /^https?:\/\/(?:www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
      /^https?:\/\/(?:www\.)?youtube\.com\/watch\?.*list=([a-zA-Z0-9_-]+)/,
      /^https?:\/\/youtu\.be\/.*\?.*list=([a-zA-Z0-9_-]+)/,
      /^https?:\/\/m\.youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    ],
    video: [
      /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /^https?:\/\/m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ],
    channel: [
      /^https?:\/\/(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /^https?:\/\/(?:www\.)?youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /^https?:\/\/(?:www\.)?youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /^https?:\/\/(?:www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)/,
    ],
  };

  constructor(
    logger?: StructuredLoggerService,
    rateLimitConfig?: Partial<RateLimitConfig>,
  ) {
    this.logger = logger || new StructuredLoggerService();
    this.rateLimitConfig = {
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 500,
      cooldownPeriod: 60000, // 1 minute
      ...rateLimitConfig,
    };
  }

  /**
   * Validate YouTube URL format and extract information
   */
  validateUrl(url: string, clientId?: string): ValidationResult {
    const result: ValidationResult = {
      isValid: false,
      urlInfo: {
        type: 'invalid',
        id: '',
        originalUrl: url,
        normalizedUrl: '',
        isValid: false,
      },
      errors: [],
      warnings: [],
    };

    try {
      // Basic URL validation
      if (!url || typeof url !== 'string') {
        result.errors.push('URL is required and must be a string');
        return result;
      }

      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        result.errors.push('URL cannot be empty');
        return result;
      }

      // Check URL length
      if (trimmedUrl.length > 2048) {
        result.errors.push('URL is too long (maximum 2048 characters)');
        return result;
      }

      // Try to parse as URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(trimmedUrl);
      } catch (urlError) {
        result.errors.push('Invalid URL format');
        return result;
      }

      // Check if it's a YouTube domain
      const validDomains = [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtu.be',
      ];

      if (!validDomains.includes(parsedUrl.hostname)) {
        result.errors.push(
          'URL must be from YouTube (youtube.com or youtu.be)',
        );
        return result;
      }

      // Check protocol
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        result.errors.push('URL must use HTTP or HTTPS protocol');
        return result;
      }

      // Extract URL information
      const urlInfo = this.extractUrlInfo(trimmedUrl);
      result.urlInfo = urlInfo;

      if (urlInfo.type === 'invalid') {
        result.errors.push('Unsupported YouTube URL format');
        return result;
      }

      // Additional validation based on type
      const typeValidation = this.validateByType(urlInfo);
      result.errors.push(...typeValidation.errors);
      result.warnings.push(...typeValidation.warnings);

      result.isValid = result.errors.length === 0;

      // Log validation attempt
      this.logger.logUserAction(
        'youtube_url_validation',
        clientId || 'anonymous',
        'validation_session',
        {
          url: trimmedUrl,
          type: urlInfo.type,
          isValid: result.isValid,
          errorCount: result.errors.length,
          warningCount: result.warnings.length,
        },
      );

      return result;
    } catch (error) {
      result.errors.push(
        `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      this.logger.error(
        'YouTube URL validation error',
        error instanceof Error ? error : new Error(String(error)),
        {
          url: url,
          clientId,
        },
      );

      return result;
    }
  }

  /**
   * Check if playlist is accessible (not private, not deleted)
   */
  async checkPlaylistAccessibility(
    playlistId: string,
    clientId?: string,
  ): Promise<{
    isAccessible: boolean;
    visibility: 'public' | 'unlisted' | 'private' | 'unknown';
    error?: string;
  }> {
    const endOperation = this.logger.startOperation(
      'check_playlist_accessibility',
      {
        playlistId,
        clientId,
      },
    );

    try {
      // Check rate limiting
      if (clientId && !this.checkRateLimit(clientId)) {
        throw new ValidationError(
          'Rate limit exceeded. Please try again later.',
        );
      }

      // In a real implementation, this would make an API call to YouTube
      // For now, we'll simulate the check based on playlist ID patterns
      const result = await this.simulateAccessibilityCheck(playlistId);

      // Record request for rate limiting
      if (clientId) {
        this.recordRequest(clientId);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Playlist accessibility check failed',
        error instanceof Error ? error : new Error(errorMessage),
        {
          playlistId,
          clientId,
        },
      );

      return {
        isAccessible: false,
        visibility: 'unknown',
        error: errorMessage,
      };
    } finally {
      endOperation();
    }
  }

  /**
   * Get playlist preview information
   */
  async getPlaylistPreview(
    playlistId: string,
    clientId?: string,
  ): Promise<YouTubePlaylistPreview | null> {
    const endOperation = this.logger.startOperation('get_playlist_preview', {
      playlistId,
      clientId,
    });

    try {
      // Check rate limiting
      if (clientId && !this.checkRateLimit(clientId)) {
        throw new ValidationError(
          'Rate limit exceeded. Please try again later.',
        );
      }

      // Check accessibility first
      const accessibilityCheck = await this.checkPlaylistAccessibility(
        playlistId,
        clientId,
      );
      if (!accessibilityCheck.isAccessible) {
        return null;
      }

      // In a real implementation, this would use yt-dlp or YouTube API
      // For now, we'll simulate preview data
      const preview = await this.simulatePlaylistPreview(
        playlistId,
        accessibilityCheck.visibility,
      );

      // Record request for rate limiting
      if (clientId) {
        this.recordRequest(clientId);
      }

      this.logger.info('Playlist preview retrieved', {
        playlistId,
        title: preview?.title,
        videoCount: preview?.videoCount,
        visibility: preview?.visibility,
      });

      return preview;
    } catch (error) {
      this.logger.error(
        'Playlist preview failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          playlistId,
          clientId,
        },
      );

      if (error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
      }

      throw new NetworkError(
        'PREVIEW_ERROR',
        `Failed to get playlist preview: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      endOperation();
    }
  }

  /**
   * Batch validate multiple URLs
   */
  async batchValidateUrls(
    urls: string[],
    clientId?: string,
  ): Promise<ValidationResult[]> {
    if (urls.length > 50) {
      throw new ValidationError('Maximum 50 URLs allowed per batch request');
    }

    const results: ValidationResult[] = [];

    for (const url of urls) {
      try {
        const result = this.validateUrl(url, clientId);
        results.push(result);
      } catch (error) {
        results.push({
          isValid: false,
          urlInfo: {
            type: 'invalid',
            id: '',
            originalUrl: url,
            normalizedUrl: '',
            isValid: false,
          },
          errors: [
            `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
          ],
          warnings: [],
        });
      }
    }

    return results;
  }

  /**
   * Extract URL information and normalize
   */
  private extractUrlInfo(url: string): YouTubeUrlInfo {
    const baseInfo: YouTubeUrlInfo = {
      type: 'invalid',
      id: '',
      originalUrl: url,
      normalizedUrl: '',
      isValid: false,
    };

    // Check playlist patterns
    for (const pattern of this.urlPatterns.playlist) {
      const match = url.match(pattern);
      if (match) {
        const playlistId = match[1];
        return {
          ...baseInfo,
          type: 'playlist',
          id: playlistId,
          normalizedUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
          isValid: true,
        };
      }
    }

    // Check video patterns
    for (const pattern of this.urlPatterns.video) {
      const match = url.match(pattern);
      if (match) {
        const videoId = match[1];
        return {
          ...baseInfo,
          type: 'video',
          id: videoId,
          normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
          isValid: true,
        };
      }
    }

    // Check channel patterns
    for (const pattern of this.urlPatterns.channel) {
      const match = url.match(pattern);
      if (match) {
        const channelId = match[1];
        return {
          ...baseInfo,
          type: 'channel',
          id: channelId,
          normalizedUrl: `https://www.youtube.com/channel/${channelId}`,
          isValid: true,
        };
      }
    }

    return baseInfo;
  }

  /**
   * Validate based on URL type
   */
  private validateByType(urlInfo: YouTubeUrlInfo): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (urlInfo.type) {
      case 'playlist':
        if (!this.isValidPlaylistId(urlInfo.id)) {
          errors.push('Invalid playlist ID format');
        }
        break;

      case 'video':
        if (!this.isValidVideoId(urlInfo.id)) {
          errors.push('Invalid video ID format');
        }
        warnings.push(
          'Individual videos will be converted to single-item playlists',
        );
        break;

      case 'channel':
        warnings.push(
          'Channel URLs are not directly supported. Please use a specific playlist URL from this channel.',
        );
        break;
    }

    return { errors, warnings };
  }

  /**
   * Validate playlist ID format
   */
  private isValidPlaylistId(id: string): boolean {
    // YouTube playlist IDs are typically 34 characters long and start with 'PL' or 'UU'
    return /^[a-zA-Z0-9_-]{10,50}$/.test(id);
  }

  /**
   * Validate video ID format
   */
  private isValidVideoId(id: string): boolean {
    // YouTube video IDs are exactly 11 characters long
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  }

  /**
   * Check rate limiting for client
   */
  private checkRateLimit(clientId: string): boolean {
    if (this.cooldownUsers.has(clientId)) {
      return false;
    }

    const now = Date.now();
    const clientHistory = this.requestHistory.get(clientId) || [];

    // Clean old requests (older than 1 hour)
    const recentRequests = clientHistory.filter(
      timestamp => now - timestamp < 3600000,
    );

    // Check per-minute limit
    const lastMinuteRequests = recentRequests.filter(
      timestamp => now - timestamp < 60000,
    );
    if (
      lastMinuteRequests.length >= this.rateLimitConfig.maxRequestsPerMinute
    ) {
      this.addToCooldown(clientId);
      return false;
    }

    // Check per-hour limit
    if (recentRequests.length >= this.rateLimitConfig.maxRequestsPerHour) {
      this.addToCooldown(clientId);
      return false;
    }

    return true;
  }

  /**
   * Record request for rate limiting
   */
  private recordRequest(clientId: string): void {
    const now = Date.now();
    const clientHistory = this.requestHistory.get(clientId) || [];
    clientHistory.push(now);

    // Keep only recent requests
    const recentRequests = clientHistory.filter(
      timestamp => now - timestamp < 3600000,
    );
    this.requestHistory.set(clientId, recentRequests);
  }

  /**
   * Add client to cooldown
   */
  private addToCooldown(clientId: string): void {
    this.cooldownUsers.add(clientId);
    setTimeout(() => {
      this.cooldownUsers.delete(clientId);
    }, this.rateLimitConfig.cooldownPeriod);

    this.logger.warn('Client added to cooldown due to rate limiting', {
      clientId,
      cooldownPeriod: this.rateLimitConfig.cooldownPeriod,
    });
  }

  /**
   * Simulate accessibility check (replace with real implementation)
   */
  private async simulateAccessibilityCheck(playlistId: string): Promise<{
    isAccessible: boolean;
    visibility: 'public' | 'unlisted' | 'private' | 'unknown';
    error?: string;
  }> {
    // Simulate network delay
    await new Promise(resolve =>
      setTimeout(resolve, 100 + Math.random() * 200),
    );

    // Simulate different scenarios based on playlist ID patterns
    if (playlistId.includes('private') || playlistId.includes('PRIVATE')) {
      return {
        isAccessible: false,
        visibility: 'private',
        error: 'Playlist is private',
      };
    }

    if (playlistId.includes('deleted') || playlistId.includes('DELETED')) {
      return {
        isAccessible: false,
        visibility: 'unknown',
        error: 'Playlist not found or deleted',
      };
    }

    if (playlistId.includes('unlisted') || playlistId.includes('UNLISTED')) {
      return {
        isAccessible: true,
        visibility: 'unlisted',
      };
    }

    return {
      isAccessible: true,
      visibility: 'public',
    };
  }

  /**
   * Simulate playlist preview (replace with real implementation)
   */
  private async simulatePlaylistPreview(
    playlistId: string,
    visibility: 'public' | 'unlisted' | 'private' | 'unknown',
  ): Promise<YouTubePlaylistPreview> {
    // Simulate network delay
    await new Promise(resolve =>
      setTimeout(resolve, 200 + Math.random() * 300),
    );

    return {
      id: playlistId,
      title: `Sample Playlist ${playlistId.substring(0, 8)}`,
      description:
        'This is a sample playlist description for testing purposes.',
      videoCount: Math.floor(Math.random() * 100) + 1,
      visibility,
      thumbnailUrl: `https://i.ytimg.com/vi/sample/maxresdefault.jpg`,
      channelTitle: 'Sample Channel',
      channelId: 'UC' + playlistId.substring(2, 24),
      createdAt: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updatedAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      isAccessible: true,
      estimatedDuration: Math.floor(Math.random() * 10000) + 1000, // seconds
    };
  }

  /**
   * Get rate limit status for client
   */
  getRateLimitStatus(clientId: string): {
    requestsInLastMinute: number;
    requestsInLastHour: number;
    isInCooldown: boolean;
    remainingRequests: {
      perMinute: number;
      perHour: number;
    };
  } {
    const now = Date.now();
    const clientHistory = this.requestHistory.get(clientId) || [];

    const lastMinuteRequests = clientHistory.filter(
      timestamp => now - timestamp < 60000,
    );
    const lastHourRequests = clientHistory.filter(
      timestamp => now - timestamp < 3600000,
    );

    return {
      requestsInLastMinute: lastMinuteRequests.length,
      requestsInLastHour: lastHourRequests.length,
      isInCooldown: this.cooldownUsers.has(clientId),
      remainingRequests: {
        perMinute: Math.max(
          0,
          this.rateLimitConfig.maxRequestsPerMinute - lastMinuteRequests.length,
        ),
        perHour: Math.max(
          0,
          this.rateLimitConfig.maxRequestsPerHour - lastHourRequests.length,
        ),
      },
    };
  }
}
