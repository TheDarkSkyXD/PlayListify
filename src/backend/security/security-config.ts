/**
 * Security Configuration
 * Centralized security configuration for the application
 */

import { app } from 'electron';
import * as path from 'path';

export interface SecuritySettings {
  processIsolation: {
    contextIsolation: boolean;
    nodeIntegration: boolean;
    webSecurity: boolean;
    allowRunningInsecureContent: boolean;
    experimentalFeatures: boolean;
    sandbox: boolean;
  };
  fileSystem: {
    enablePathValidation: boolean;
    enablePermissionChecks: boolean;
    allowedDirectories: string[];
    blockedDirectories: string[];
    maxFileSize: number;
    allowedExtensions: string[];
    blockedExtensions: string[];
  };
  dependencies: {
    enableSignatureVerification: boolean;
    trustedSources: string[];
    checksumValidation: boolean;
    quarantineUnknown: boolean;
  };
  csp: {
    enabled: boolean;
    policy: string;
    reportUri?: string;
    reportOnly: boolean;
  };
  audit: {
    enableSecurityLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    maxLogSize: number;
    retentionDays: number;
  };
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecuritySettings = {
  processIsolation: {
    contextIsolation: true,
    nodeIntegration: false,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
    sandbox: process.env.NODE_ENV === 'production',
  },
  fileSystem: {
    enablePathValidation: true,
    enablePermissionChecks: true,
    allowedDirectories: [
      app.getPath('userData'),
      app.getPath('downloads'),
      app.getPath('temp'),
      path.join(app.getPath('userData'), 'dependencies'),
      path.join(app.getPath('userData'), 'cache'),
      path.join(app.getPath('userData'), 'logs'),
    ],
    blockedDirectories: [
      app.getPath('home'),
      '/etc',
      '/usr',
      '/System',
      'C:\\Windows',
      'C:\\Program Files',
      'C:\\Program Files (x86)',
    ],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedExtensions: [
      '.json',
      '.txt',
      '.log',
      '.md',
      '.mp4',
      '.mp3',
      '.webm',
      '.mkv',
      '.avi',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.zip',
      '.tar',
      '.gz',
      '.xz',
    ],
    blockedExtensions: [
      '.exe',
      '.bat',
      '.cmd',
      '.scr',
      '.com',
      '.pif',
      '.vbs',
      '.js',
      '.jar',
      '.app',
      '.deb',
      '.rpm',
    ],
  },
  dependencies: {
    enableSignatureVerification: true,
    trustedSources: [
      'github.com',
      'api.github.com',
      'npmjs.org',
      'registry.npmjs.org',
      'pypi.org',
      'files.pythonhosted.org',
      'ffmpeg.org',
      'johnvansickle.com', // FFmpeg static builds
    ],
    checksumValidation: true,
    quarantineUnknown: true,
  },
  csp: {
    enabled: true,
    policy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for React dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https: blob:",
      "connect-src 'self' https: wss:",
      "font-src 'self' https://fonts.gstatic.com data:",
      "object-src 'none'",
      "frame-src 'none'",
      "child-src 'none'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
    reportOnly: process.env.NODE_ENV === 'development',
  },
  audit: {
    enableSecurityLogging: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    maxLogSize: 10 * 1024 * 1024, // 10MB
    retentionDays: 30,
  },
};

/**
 * Production security configuration with stricter settings
 */
export const PRODUCTION_SECURITY_CONFIG: Partial<SecuritySettings> = {
  processIsolation: {
    ...DEFAULT_SECURITY_CONFIG.processIsolation,
    sandbox: true,
  },
  csp: {
    ...DEFAULT_SECURITY_CONFIG.csp,
    policy: [
      "default-src 'self'",
      "script-src 'self'", // No unsafe-inline in production
      "style-src 'self' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "media-src 'self' https:",
      "connect-src 'self' https:",
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "frame-src 'none'",
      "child-src 'none'",
      "worker-src 'self'",
      "manifest-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
    reportOnly: false,
  },
  audit: {
    ...DEFAULT_SECURITY_CONFIG.audit,
    logLevel: 'warn',
  },
};

/**
 * Development security configuration with relaxed settings for debugging
 */
export const DEVELOPMENT_SECURITY_CONFIG: Partial<SecuritySettings> = {
  processIsolation: {
    ...DEFAULT_SECURITY_CONFIG.processIsolation,
    sandbox: false, // Disable sandbox in development for easier debugging
  },
  csp: {
    ...DEFAULT_SECURITY_CONFIG.csp,
    reportOnly: true, // Report-only mode in development
  },
  audit: {
    ...DEFAULT_SECURITY_CONFIG.audit,
    logLevel: 'debug',
  },
};

/**
 * Get security configuration based on environment
 */
export function getSecurityConfig(): SecuritySettings {
  const baseConfig = { ...DEFAULT_SECURITY_CONFIG };

  if (process.env.NODE_ENV === 'production') {
    return mergeSecurityConfig(baseConfig, PRODUCTION_SECURITY_CONFIG);
  } else if (process.env.NODE_ENV === 'development') {
    return mergeSecurityConfig(baseConfig, DEVELOPMENT_SECURITY_CONFIG);
  }

  return baseConfig;
}

/**
 * Merge security configurations
 */
function mergeSecurityConfig(
  base: SecuritySettings,
  override: Partial<SecuritySettings>,
): SecuritySettings {
  return {
    processIsolation: {
      ...base.processIsolation,
      ...override.processIsolation,
    },
    fileSystem: { ...base.fileSystem, ...override.fileSystem },
    dependencies: { ...base.dependencies, ...override.dependencies },
    csp: { ...base.csp, ...override.csp },
    audit: { ...base.audit, ...override.audit },
  };
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config: SecuritySettings): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate process isolation
  if (!config.processIsolation.contextIsolation) {
    errors.push('Context isolation must be enabled for security');
  }

  if (config.processIsolation.nodeIntegration) {
    errors.push('Node integration should be disabled in renderer processes');
  }

  if (!config.processIsolation.webSecurity) {
    warnings.push(
      'Web security is disabled - only recommended for development',
    );
  }

  // Validate file system settings
  if (config.fileSystem.maxFileSize <= 0) {
    errors.push('Maximum file size must be greater than 0');
  }

  if (config.fileSystem.allowedDirectories.length === 0) {
    warnings.push(
      'No allowed directories specified - file operations may fail',
    );
  }

  // Validate CSP
  if (config.csp.enabled && !config.csp.policy) {
    errors.push('CSP policy must be specified when CSP is enabled');
  }

  // Validate audit settings
  if (config.audit.maxLogSize <= 0) {
    errors.push('Maximum log size must be greater than 0');
  }

  if (config.audit.retentionDays <= 0) {
    errors.push('Log retention days must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Security configuration for BrowserWindow
 */
export function getBrowserWindowSecurityConfig(): Electron.BrowserWindowConstructorOptions['webPreferences'] {
  const config = getSecurityConfig();

  return {
    contextIsolation: config.processIsolation.contextIsolation,
    nodeIntegration: config.processIsolation.nodeIntegration,
    webSecurity: config.processIsolation.webSecurity,
    allowRunningInsecureContent:
      config.processIsolation.allowRunningInsecureContent,
    experimentalFeatures: config.processIsolation.experimentalFeatures,
    sandbox: config.processIsolation.sandbox,
    preload: path.join(__dirname, '../../preload.js'),
  };
}

/**
 * Get trusted dependency sources
 */
export function getTrustedSources(): string[] {
  return getSecurityConfig().dependencies.trustedSources;
}

/**
 * Check if a URL is from a trusted source
 */
export function isTrustedSource(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const trustedSources = getTrustedSources();

    return trustedSources.some(source => {
      // Handle both domain and subdomain matching
      return (
        urlObj.hostname === source || urlObj.hostname.endsWith(`.${source}`)
      );
    });
  } catch {
    return false;
  }
}

/**
 * Get allowed file extensions
 */
export function getAllowedExtensions(): string[] {
  return getSecurityConfig().fileSystem.allowedExtensions;
}

/**
 * Get blocked file extensions
 */
export function getBlockedExtensions(): string[] {
  return getSecurityConfig().fileSystem.blockedExtensions;
}

/**
 * Check if file extension is allowed
 */
export function isExtensionAllowed(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const config = getSecurityConfig();

  // Check if explicitly blocked
  if (config.fileSystem.blockedExtensions.includes(ext)) {
    return false;
  }

  // Check if explicitly allowed (if allowlist is not empty)
  if (config.fileSystem.allowedExtensions.length > 0) {
    return config.fileSystem.allowedExtensions.includes(ext);
  }

  // Default to allowed if no specific rules
  return true;
}

/**
 * Get maximum allowed file size
 */
export function getMaxFileSize(): number {
  return getSecurityConfig().fileSystem.maxFileSize;
}

/**
 * Export security configuration for external use
 */
export function exportSecurityConfig(): SecuritySettings {
  return getSecurityConfig();
}
