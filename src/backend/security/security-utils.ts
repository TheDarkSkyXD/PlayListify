/**
 * Security Utilities
 * Helper functions for security operations and validations
 */

import { SecurityError } from '@/shared/errors';
import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Generate cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate secure nonce for CSP
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Hash data using SHA-256
 */
export function hashData(
  data: string | Buffer,
  algorithm: string = 'sha256',
): string {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

/**
 * Verify data against hash
 */
export function verifyHash(
  data: string | Buffer,
  expectedHash: string,
  algorithm: string = 'sha256',
): boolean {
  const actualHash = hashData(data, algorithm);
  return actualHash === expectedHash.toLowerCase();
}

/**
 * Sanitize filename for safe file system operations
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    throw new SecurityError('Invalid filename provided', 'INVALID_FILENAME');
  }

  // Remove or replace dangerous characters
  let sanitized = filename
    .replace(/[<>:"|?*]/g, '_') // Windows invalid chars
    .replace(/[\x00-\x1f\x80-\x9f]/g, '_') // Control characters
    .replace(/^\.+/, '_') // Leading dots
    .replace(/\.+$/, '_') // Trailing dots
    .replace(/\s+/g, '_') // Multiple spaces
    .trim();

  // Ensure filename is not empty after sanitization
  if (!sanitized) {
    sanitized = 'sanitized_file';
  }

  // Limit length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 255 - ext.length) + ext;
  }

  return sanitized;
}

/**
 * Validate file path for security issues
 */
export function validateFilePath(
  filePath: string,
  allowedBasePaths?: string[],
): {
  isValid: boolean;
  isSecure: boolean;
  sanitizedPath: string;
  errors: string[];
} {
  const result = {
    isValid: true,
    isSecure: true,
    sanitizedPath: filePath,
    errors: [] as string[],
  };

  try {
    // Basic validation
    if (!filePath || typeof filePath !== 'string') {
      result.isValid = false;
      result.errors.push('Path must be a non-empty string');
      return result;
    }

    // Normalize and resolve path
    const normalizedPath = path.normalize(filePath);
    const resolvedPath = path.resolve(normalizedPath);
    result.sanitizedPath = resolvedPath;

    // Check for directory traversal attempts
    if (filePath.includes('..') || filePath.includes('~')) {
      result.isSecure = false;
      result.errors.push('Path contains directory traversal attempts');
    }

    // Check for null bytes
    if (filePath.includes('\0')) {
      result.isSecure = false;
      result.errors.push('Path contains null bytes');
    }

    // Check against allowed base paths
    if (allowedBasePaths && allowedBasePaths.length > 0) {
      const isInAllowedPath = allowedBasePaths.some(basePath => {
        const resolvedBasePath = path.resolve(basePath);
        return resolvedPath.startsWith(resolvedBasePath);
      });

      if (!isInAllowedPath) {
        result.isSecure = false;
        result.errors.push('Path is not within allowed directories');
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\$\{.*\}/, // Variable expansion
      /%[0-9a-fA-F]{2}/, // URL encoding
      /\\\\/, // UNC paths
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(filePath)) {
        result.isSecure = false;
        result.errors.push(
          `Path contains suspicious pattern: ${pattern.source}`,
        );
      }
    }

    // Update validity based on security
    if (!result.isSecure) {
      result.isValid = false;
    }
  } catch (error) {
    result.isValid = false;
    result.isSecure = false;
    result.errors.push(
      `Path validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  return result;
}

/**
 * Check if URL is safe for external requests
 */
export function validateUrl(
  url: string,
  allowedProtocols: string[] = ['https:', 'http:'],
): {
  isValid: boolean;
  isSecure: boolean;
  errors: string[];
} {
  const result = {
    isValid: true,
    isSecure: true,
    errors: [] as string[],
  };

  try {
    const urlObj = new URL(url);

    // Check protocol
    if (!allowedProtocols.includes(urlObj.protocol)) {
      result.isSecure = false;
      result.errors.push(`Protocol ${urlObj.protocol} is not allowed`);
    }

    // Prefer HTTPS
    if (urlObj.protocol === 'http:') {
      result.errors.push('HTTP is less secure than HTTPS');
    }

    // Check for suspicious patterns
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      result.isSecure = false;
      result.errors.push('Localhost URLs are not allowed');
    }

    // Check for private IP ranges
    if (isPrivateIP(urlObj.hostname)) {
      result.isSecure = false;
      result.errors.push('Private IP addresses are not allowed');
    }

    // Update validity
    if (!result.isSecure) {
      result.isValid = false;
    }
  } catch (error) {
    result.isValid = false;
    result.isSecure = false;
    result.errors.push(
      `Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  return result;
}

/**
 * Check if IP address is in private range
 */
function isPrivateIP(hostname: string): boolean {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./, // Link-local
    /^127\./, // Loopback
  ];

  return privateRanges.some(range => range.test(hostname));
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove control characters and normalize whitespace
  let sanitized = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Generate secure file path within allowed directory
 */
export function generateSecureFilePath(
  baseDir: string,
  filename: string,
): string {
  const sanitizedFilename = sanitizeFilename(filename);
  const timestamp = Date.now();
  const random = generateSecureToken(8);

  // Add timestamp and random component to prevent conflicts
  const name = path.parse(sanitizedFilename).name;
  const ext = path.parse(sanitizedFilename).ext;
  const secureFilename = `${name}_${timestamp}_${random}${ext}`;

  return path.join(baseDir, secureFilename);
}

/**
 * Verify file integrity using checksum
 */
export async function verifyFileIntegrity(
  filePath: string,
  expectedChecksum: string,
  algorithm: string = 'sha256',
): Promise<boolean> {
  try {
    if (!(await fs.pathExists(filePath))) {
      return false;
    }

    const fileBuffer = await fs.readFile(filePath);
    const actualChecksum = hashData(fileBuffer, algorithm);

    return actualChecksum === expectedChecksum.toLowerCase();
  } catch (error) {
    throw new SecurityError(
      `File integrity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'INTEGRITY_CHECK_FAILED',
    );
  }
}

/**
 * Calculate file checksum
 */
export async function calculateFileChecksum(
  filePath: string,
  algorithm: string = 'sha256',
): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return hashData(fileBuffer, algorithm);
  } catch (error) {
    throw new SecurityError(
      `Failed to calculate file checksum: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CHECKSUM_CALCULATION_FAILED',
    );
  }
}

/**
 * Secure random number generation
 */
export function generateSecureRandom(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const randomBytes = crypto.randomBytes(bytesNeeded);

  let randomValue = 0;
  for (let i = 0; i < bytesNeeded; i++) {
    randomValue = randomValue * 256 + randomBytes[i];
  }

  // Ensure uniform distribution
  if (randomValue >= maxValue - (maxValue % range)) {
    return generateSecureRandom(min, max);
  }

  return min + (randomValue % range);
}

/**
 * Time-safe string comparison to prevent timing attacks
 */
export function timeSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000, // 1 minute
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Record this attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);

    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [identifier, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter(time => now - time < this.windowMs);
      if (validAttempts.length === 0) {
        this.attempts.delete(identifier);
      } else {
        this.attempts.set(identifier, validAttempts);
      }
    }
  }
}

/**
 * Security headers for HTTP responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;

/**
 * Validate security headers
 */
export function validateSecurityHeaders(headers: Record<string, string>): {
  valid: boolean;
  missing: string[];
  recommendations: string[];
} {
  const missing: string[] = [];
  const recommendations: string[] = [];

  Object.keys(SECURITY_HEADERS).forEach(header => {
    if (!headers[header]) {
      missing.push(header);
    }
  });

  if (missing.length > 0) {
    recommendations.push('Add missing security headers to improve protection');
  }

  return {
    valid: missing.length === 0,
    missing,
    recommendations,
  };
}
