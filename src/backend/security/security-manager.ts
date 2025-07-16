/**
 * Security Manager Service
 * Comprehensive security implementation for process isolation, file system security,
 * dependency security, and Content Security Policy management
 */

import { SecurityError } from '@/shared/errors';
import * as crypto from 'crypto';
import { app } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
// Logger interface
interface Logger {
  info(message: string, context?: string, meta?: any): void;
  warn(message: string, context?: string, meta?: any): void;
  error(message: string, context?: string, meta?: any): void;
  debug(message: string, context?: string, meta?: any): void;
}

export interface SecurityConfig {
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

export interface SecurityViolation {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: any;
  source: string;
  blocked: boolean;
}

export interface FileSystemSecurityCheck {
  path: string;
  isValid: boolean;
  isSecure: boolean;
  hasPermission: boolean;
  violations: string[];
  sanitizedPath?: string;
}

export interface DependencySecurityCheck {
  name: string;
  path: string;
  isValid: boolean;
  isSecure: boolean;
  signatureValid: boolean;
  checksumValid: boolean;
  source: string;
  violations: string[];
}

export class SecurityManager {
  private config: SecurityConfig;
  private logger: Logger;
  private violations: SecurityViolation[] = [];
  private trustedHashes: Map<string, string> = new Map();
  private initialized = false;

  constructor(logger: Logger, config?: Partial<SecurityConfig>) {
    this.logger = logger;
    this.config = this.mergeWithDefaults(config || {});
    this.initializeTrustedHashes();
  }

  /**
   * Initialize the security manager
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Security Manager', 'SecurityManager');

      // Validate security configuration
      await this.validateSecurityConfig();

      // Initialize security logging
      if (this.config.audit.enableSecurityLogging) {
        await this.initializeSecurityLogging();
      }

      // Set up CSP if enabled
      if (this.config.csp.enabled) {
        this.setupContentSecurityPolicy();
      }

      // Initialize file system security
      await this.initializeFileSystemSecurity();

      // Initialize dependency security
      await this.initializeDependencySecurity();

      this.initialized = true;
      this.logger.info(
        'Security Manager initialized successfully',
        'SecurityManager',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        'Failed to initialize Security Manager',
        'SecurityManager',
        { error: message },
      );
      throw new SecurityError(
        `Failed to initialize Security Manager: ${message}`,
        'SECURITY_INIT_FAILED',
      );
    }
  }

  /**
   * Validate file system operations with comprehensive security checks
   */
  async validateFileSystemOperation(
    operation: 'read' | 'write' | 'delete' | 'execute',
    filePath: string,
    content?: Buffer | string,
  ): Promise<FileSystemSecurityCheck> {
    const result: FileSystemSecurityCheck = {
      path: filePath,
      isValid: true,
      isSecure: true,
      hasPermission: true,
      violations: [],
    };

    try {
      // Basic path validation
      if (!filePath || typeof filePath !== 'string') {
        result.isValid = false;
        result.violations.push('Invalid file path provided');
        return result;
      }

      // Sanitize and normalize path
      const sanitizedPath = this.sanitizeFilePath(filePath);
      result.sanitizedPath = sanitizedPath;

      // Check for directory traversal attempts
      if (this.hasDirectoryTraversalAttempt(filePath)) {
        result.isSecure = false;
        result.violations.push('Directory traversal attempt detected');
        await this.logSecurityViolation(
          'DIRECTORY_TRAVERSAL',
          'Directory traversal attempt',
          {
            originalPath: filePath,
            sanitizedPath,
            operation,
          },
        );
      }

      // Validate against allowed/blocked directories
      if (!this.isPathInAllowedDirectory(sanitizedPath)) {
        result.isSecure = false;
        result.violations.push('Path not in allowed directory');
        await this.logSecurityViolation(
          'UNAUTHORIZED_PATH',
          'Path not in allowed directory',
          {
            path: sanitizedPath,
            operation,
          },
        );
      }

      if (this.isPathInBlockedDirectory(sanitizedPath)) {
        result.isSecure = false;
        result.violations.push('Path in blocked directory');
        await this.logSecurityViolation(
          'BLOCKED_PATH',
          'Path in blocked directory',
          {
            path: sanitizedPath,
            operation,
          },
        );
      }

      // Check file extension
      const extension = path.extname(sanitizedPath).toLowerCase();
      if (this.config.fileSystem.blockedExtensions.includes(extension)) {
        result.isSecure = false;
        result.violations.push(`Blocked file extension: ${extension}`);
        await this.logSecurityViolation(
          'BLOCKED_EXTENSION',
          'Blocked file extension',
          {
            path: sanitizedPath,
            extension,
            operation,
          },
        );
      }

      // Check file size for write operations
      if (operation === 'write' && content) {
        const size = Buffer.isBuffer(content)
          ? content.length
          : Buffer.byteLength(content);
        if (size > this.config.fileSystem.maxFileSize) {
          result.isSecure = false;
          result.violations.push(
            `File size exceeds limit: ${size} > ${this.config.fileSystem.maxFileSize}`,
          );
          await this.logSecurityViolation(
            'FILE_SIZE_EXCEEDED',
            'File size exceeds limit',
            {
              path: sanitizedPath,
              size,
              limit: this.config.fileSystem.maxFileSize,
              operation,
            },
          );
        }
      }

      // Check file permissions
      if (await fs.pathExists(sanitizedPath)) {
        try {
          await fs.access(
            sanitizedPath,
            this.getRequiredPermissions(operation),
          );
        } catch (error) {
          result.hasPermission = false;
          result.violations.push('Insufficient file permissions');
          await this.logSecurityViolation(
            'PERMISSION_DENIED',
            'Insufficient file permissions',
            {
              path: sanitizedPath,
              operation,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          );
        }
      }

      // Update overall validity
      result.isValid = result.isSecure && result.hasPermission;

      return result;
    } catch (error) {
      result.isValid = false;
      result.isSecure = false;
      result.violations.push(
        `Security check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      await this.logSecurityViolation(
        'SECURITY_CHECK_FAILED',
        'File system security check failed',
        {
          path: filePath,
          operation,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
      return result;
    }
  }

  /**
   * Validate dependency security with signature verification
   */
  async validateDependencySecurity(
    name: string,
    filePath: string,
    expectedChecksum?: string,
    source?: string,
  ): Promise<DependencySecurityCheck> {
    const result: DependencySecurityCheck = {
      name,
      path: filePath,
      isValid: true,
      isSecure: true,
      signatureValid: false,
      checksumValid: false,
      source: source || 'unknown',
      violations: [],
    };

    try {
      // Check if file exists
      if (!(await fs.pathExists(filePath))) {
        result.isValid = false;
        result.violations.push('Dependency file not found');
        return result;
      }

      // Validate source
      if (source && !this.config.dependencies.trustedSources.includes(source)) {
        result.isSecure = false;
        result.violations.push('Untrusted dependency source');
        await this.logSecurityViolation(
          'UNTRUSTED_SOURCE',
          'Untrusted dependency source',
          {
            name,
            source,
            trustedSources: this.config.dependencies.trustedSources,
          },
        );
      }

      // Checksum validation
      if (this.config.dependencies.checksumValidation && expectedChecksum) {
        const actualChecksum = await this.calculateFileChecksum(filePath);
        result.checksumValid = actualChecksum === expectedChecksum;

        if (!result.checksumValid) {
          result.isSecure = false;
          result.violations.push('Checksum validation failed');
          await this.logSecurityViolation(
            'CHECKSUM_MISMATCH',
            'Dependency checksum mismatch',
            {
              name,
              path: filePath,
              expected: expectedChecksum,
              actual: actualChecksum,
            },
          );
        }
      } else {
        result.checksumValid = true; // Skip if not enabled or no expected checksum
      }

      // Signature verification (simplified - in production, use proper crypto libraries)
      if (this.config.dependencies.enableSignatureVerification) {
        result.signatureValid = await this.verifyDependencySignature(
          filePath,
          name,
        );

        if (!result.signatureValid) {
          result.isSecure = false;
          result.violations.push('Signature verification failed');
          await this.logSecurityViolation(
            'SIGNATURE_INVALID',
            'Dependency signature verification failed',
            {
              name,
              path: filePath,
            },
          );
        }
      } else {
        result.signatureValid = true; // Skip if not enabled
      }

      // Update overall validity
      result.isValid =
        result.isSecure && result.checksumValid && result.signatureValid;

      return result;
    } catch (error) {
      result.isValid = false;
      result.isSecure = false;
      result.violations.push(
        `Security check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      await this.logSecurityViolation(
        'DEPENDENCY_SECURITY_CHECK_FAILED',
        'Dependency security check failed',
        {
          name,
          path: filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
      return result;
    }
  }

  /**
   * Set up Content Security Policy for renderer processes
   */
  private setupContentSecurityPolicy(): void {
    app.on('web-contents-created', (_, contents) => {
      contents.on('did-finish-load', () => {
        if (this.config.csp.enabled) {
          contents
            .executeJavaScript(
              `
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = '${this.config.csp.policy}';
            document.head.appendChild(meta);
          `,
            )
            .catch(error => {
              this.logger.error('Failed to inject CSP', 'SecurityManager', {
                error,
              });
            });
        }
      });

      // Monitor for CSP violations
      contents.on('console-message', (_, level, message) => {
        if (message.includes('Content Security Policy')) {
          this.logSecurityViolation(
            'CSP_VIOLATION',
            'Content Security Policy violation',
            {
              message,
              level,
            },
          );
        }
      });
    });
  }

  /**
   * Log security violations with proper context
   */
  private async logSecurityViolation(
    type: string,
    message: string,
    context: any = {},
    severity: SecurityViolation['severity'] = 'medium',
  ): Promise<void> {
    const violation: SecurityViolation = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      severity,
      message,
      context,
      source: 'SecurityManager',
      blocked: true,
    };

    this.violations.push(violation);

    // Keep only recent violations in memory
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-500);
    }

    // Log to security log
    if (this.config.audit.enableSecurityLogging) {
      this.logger.error(
        `SECURITY VIOLATION: ${type} - ${message}`,
        'SecurityManager',
        {
          violationId: violation.id,
          severity,
          context,
        },
      );
    }

    // In production, you might want to send critical violations to a monitoring service
    if (severity === 'critical' && process.env.NODE_ENV === 'production') {
      // TODO: Implement external security monitoring integration
      this.logger.error(
        'CRITICAL SECURITY VIOLATION DETECTED',
        'SecurityManager',
        violation,
      );
    }
  }

  /**
   * Get security statistics and recent violations
   */
  getSecurityStatistics(): {
    totalViolations: number;
    violationsByType: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    recentViolations: SecurityViolation[];
  } {
    const violationsByType: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};

    this.violations.forEach(violation => {
      violationsByType[violation.type] =
        (violationsByType[violation.type] || 0) + 1;
      violationsBySeverity[violation.severity] =
        (violationsBySeverity[violation.severity] || 0) + 1;
    });

    return {
      totalViolations: this.violations.length,
      violationsByType,
      violationsBySeverity,
      recentViolations: this.violations.slice(-10),
    };
  }

  /**
   * Perform security audit of the application
   */
  async performSecurityAudit(): Promise<{
    passed: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check process isolation
      if (!this.config.processIsolation.contextIsolation) {
        issues.push('Context isolation is disabled');
        recommendations.push('Enable context isolation for better security');
      }

      if (this.config.processIsolation.nodeIntegration) {
        issues.push('Node integration is enabled in renderer');
        recommendations.push('Disable node integration in renderer processes');
      }

      // Check file system security
      if (!this.config.fileSystem.enablePathValidation) {
        issues.push('File path validation is disabled');
        recommendations.push('Enable file path validation');
      }

      // Check dependency security
      if (!this.config.dependencies.enableSignatureVerification) {
        issues.push('Dependency signature verification is disabled');
        recommendations.push('Enable dependency signature verification');
      }

      // Check CSP
      if (!this.config.csp.enabled) {
        issues.push('Content Security Policy is disabled');
        recommendations.push('Enable Content Security Policy');
      }

      // Check for recent critical violations
      const criticalViolations = this.violations.filter(
        v => v.severity === 'critical',
      );
      if (criticalViolations.length > 0) {
        issues.push(
          `${criticalViolations.length} critical security violations detected`,
        );
        recommendations.push('Review and address critical security violations');
      }

      return {
        passed: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      issues.push(
        `Security audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        passed: false,
        issues,
        recommendations,
      };
    }
  }

  // Private helper methods

  private mergeWithDefaults(config: Partial<SecurityConfig>): SecurityConfig {
    return {
      processIsolation: {
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        sandbox: true,
        ...config.processIsolation,
      },
      fileSystem: {
        enablePathValidation: true,
        enablePermissionChecks: true,
        allowedDirectories: [
          app.getPath('userData'),
          app.getPath('downloads'),
          app.getPath('temp'),
        ],
        blockedDirectories: [
          app.getPath('home'),
          '/etc',
          '/usr',
          '/System',
          'C:\\Windows',
          'C:\\Program Files',
        ],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedExtensions: [
          '.json',
          '.txt',
          '.log',
          '.mp4',
          '.mp3',
          '.webm',
          '.jpg',
          '.png',
        ],
        blockedExtensions: ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif'],
        ...config.fileSystem,
      },
      dependencies: {
        enableSignatureVerification: true,
        trustedSources: ['github.com', 'npmjs.org', 'pypi.org', 'ffmpeg.org'],
        checksumValidation: true,
        quarantineUnknown: true,
        ...config.dependencies,
      },
      csp: {
        enabled: true,
        policy:
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https:;",
        reportOnly: false,
        ...config.csp,
      },
      audit: {
        enableSecurityLogging: true,
        logLevel: 'warn',
        maxLogSize: 10 * 1024 * 1024, // 10MB
        retentionDays: 30,
        ...config.audit,
      },
    };
  }

  private sanitizeFilePath(filePath: string): string {
    // Normalize path separators
    let sanitized = path.normalize(filePath);

    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*]/g, '_');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Resolve to absolute path
    sanitized = path.resolve(sanitized);

    return sanitized;
  }

  private hasDirectoryTraversalAttempt(filePath: string): boolean {
    return (
      filePath.includes('..') ||
      filePath.includes('~') ||
      filePath.includes('%2e%2e')
    );
  }

  private isPathInAllowedDirectory(filePath: string): boolean {
    const resolvedPath = path.resolve(filePath);
    return this.config.fileSystem.allowedDirectories.some(allowedDir => {
      const resolvedAllowedDir = path.resolve(allowedDir);
      return resolvedPath.startsWith(resolvedAllowedDir);
    });
  }

  private isPathInBlockedDirectory(filePath: string): boolean {
    const resolvedPath = path.resolve(filePath);
    return this.config.fileSystem.blockedDirectories.some(blockedDir => {
      const resolvedBlockedDir = path.resolve(blockedDir);
      return resolvedPath.startsWith(resolvedBlockedDir);
    });
  }

  private getRequiredPermissions(operation: string): number {
    switch (operation) {
      case 'read':
        return fs.constants.R_OK;
      case 'write':
        return fs.constants.W_OK;
      case 'execute':
        return fs.constants.X_OK;
      case 'delete':
        return fs.constants.W_OK;
      default:
        return fs.constants.F_OK;
    }
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async verifyDependencySignature(
    filePath: string,
    name: string,
  ): Promise<boolean> {
    // Simplified signature verification - in production, use proper crypto libraries
    // This is a placeholder implementation
    try {
      const trustedHash = this.trustedHashes.get(name);
      if (!trustedHash) {
        return false; // No trusted hash available
      }

      const actualHash = await this.calculateFileChecksum(filePath);
      return actualHash === trustedHash;
    } catch (error) {
      this.logger.error('Signature verification failed', 'SecurityManager', {
        name,
        filePath,
        error,
      });
      return false;
    }
  }

  private initializeTrustedHashes(): void {
    // In production, these would be loaded from a secure source
    // This is a simplified implementation for demonstration
    this.trustedHashes.set('yt-dlp', 'placeholder-hash-for-ytdlp');
    this.trustedHashes.set('ffmpeg', 'placeholder-hash-for-ffmpeg');
  }

  private async validateSecurityConfig(): Promise<void> {
    // Validate configuration values
    if (this.config.fileSystem.maxFileSize <= 0) {
      throw new SecurityError(
        'Invalid max file size configuration',
        'INVALID_CONFIG',
      );
    }

    if (this.config.audit.retentionDays <= 0) {
      throw new SecurityError(
        'Invalid log retention configuration',
        'INVALID_CONFIG',
      );
    }
  }

  private async initializeSecurityLogging(): Promise<void> {
    // Set up security-specific logging if needed
    this.logger.info('Security logging initialized', 'SecurityManager');
  }

  private async initializeFileSystemSecurity(): Promise<void> {
    // Ensure allowed directories exist and have proper permissions
    for (const dir of this.config.fileSystem.allowedDirectories) {
      try {
        await fs.ensureDir(dir);
      } catch (error) {
        this.logger.warn(
          'Failed to ensure allowed directory',
          'SecurityManager',
          { dir, error },
        );
      }
    }
  }

  private async initializeDependencySecurity(): Promise<void> {
    // Initialize dependency security checks
    this.logger.info('Dependency security initialized', 'SecurityManager');
  }

  /**
   * Check if the security manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current security configuration
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Update security configuration
   */
  updateSecurityConfig(updates: Partial<SecurityConfig>): void {
    this.config = this.mergeWithDefaults({ ...this.config, ...updates });
    this.logger.info('Security configuration updated', 'SecurityManager');
  }
}
