/**
 * Security Module Index
 * Exports all security-related components and utilities
 */

// Core security components
export { CSPManager } from './csp-config';
export { DependencySecurityManager } from './dependency-security';
export { SecurityAuditor } from './security-audit';
export { SecurityManager } from './security-manager';

// Configuration and utilities
export * from './security-config';
export * from './security-utils';

// Types and interfaces
export type {
  DependencySecurityCheck,
  FileSystemSecurityCheck,
  SecurityConfig,
  SecurityViolation,
} from './security-manager';

export type {
  SecurityAuditResult,
  SecurityCategoryResult,
  SecurityCheck,
  SecurityIssue,
  SecurityRecommendation,
} from './security-audit';

export type { CSPConfig, CSPViolation } from './csp-config';

export type {
  DependencySecurityCheck as DependencyCheck,
  DependencySignature,
  TrustedSource,
} from './dependency-security';

export type { SecuritySettings } from './security-config';

/**
 * Initialize all security components
 */
export async function initializeSecurity(logger: any): Promise<{
  securityManager: SecurityManager;
  securityAuditor: SecurityAuditor;
  cspManager: CSPManager;
  dependencySecurityManager: DependencySecurityManager;
}> {
  const { getSecurityConfig } = await import('./security-config');
  const { app } = await import('electron');
  const path = await import('path');

  const config = getSecurityConfig();
  const quarantineDir = path.join(app.getPath('userData'), 'quarantine');

  // Initialize security components
  const securityManager = new SecurityManager(logger, config);
  const securityAuditor = new SecurityAuditor(logger);
  const cspManager = new CSPManager(logger, config.csp);
  const dependencySecurityManager = new DependencySecurityManager(
    logger,
    quarantineDir,
  );

  // Initialize all components
  await Promise.all([
    securityManager.initialize(),
    dependencySecurityManager.initialize(),
  ]);

  // Initialize CSP
  cspManager.initialize();

  logger.info('Security system initialized successfully', 'SecurityModule');

  return {
    securityManager,
    securityAuditor,
    cspManager,
    dependencySecurityManager,
  };
}

/**
 * Perform comprehensive security audit
 */
export async function performSecurityAudit(logger: any) {
  const securityAuditor = new SecurityAuditor(logger);
  return await securityAuditor.performFullAudit();
}

/**
 * Get security configuration for BrowserWindow
 */
export function getSecureBrowserWindowConfig(): Electron.BrowserWindowConstructorOptions['webPreferences'] {
  const { getBrowserWindowSecurityConfig } = require('./security-config');
  return getBrowserWindowSecurityConfig();
}

/**
 * Validate file operation security
 */
export async function validateFileOperation(
  operation: 'read' | 'write' | 'delete' | 'execute',
  filePath: string,
  content?: Buffer | string,
  logger?: any,
) {
  if (!logger) {
    // Use console logger as fallback
    logger = {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
  }

  const securityManager = new SecurityManager(logger);
  await securityManager.initialize();

  return await securityManager.validateFileSystemOperation(
    operation,
    filePath,
    content,
  );
}

/**
 * Validate dependency security
 */
export async function validateDependency(
  name: string,
  filePath: string,
  expectedChecksum?: string,
  source?: string,
  version?: string,
  logger?: any,
) {
  if (!logger) {
    // Use console logger as fallback
    logger = {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
  }

  const { app } = await import('electron');
  const path = await import('path');
  const quarantineDir = path.join(app.getPath('userData'), 'quarantine');

  const dependencySecurityManager = new DependencySecurityManager(
    logger,
    quarantineDir,
  );
  await dependencySecurityManager.initialize();

  return await dependencySecurityManager.verifyDependency(
    name,
    filePath,
    expectedChecksum,
    source,
    version,
  );
}

/**
 * Security constants
 */
export const SECURITY_CONSTANTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  LOG_RETENTION_DAYS: 30,
  RATE_LIMIT_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  NONCE_LENGTH: 16,
  TOKEN_LENGTH: 32,
} as const;

/**
 * Security event types
 */
export const SECURITY_EVENTS = {
  VIOLATION_DETECTED: 'security:violation',
  AUDIT_COMPLETED: 'security:audit:completed',
  CSP_VIOLATION: 'security:csp:violation',
  DEPENDENCY_QUARANTINED: 'security:dependency:quarantined',
  FILE_BLOCKED: 'security:file:blocked',
  RATE_LIMIT_EXCEEDED: 'security:rate_limit:exceeded',
} as const;

/**
 * Default security policies
 */
export const DEFAULT_POLICIES = {
  CSP: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;",
  ALLOWED_EXTENSIONS: ['.json', '.txt', '.log', '.mp4', '.mp3', '.jpg', '.png'],
  BLOCKED_EXTENSIONS: ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif'],
  TRUSTED_SOURCES: ['github.com', 'npmjs.org', 'pypi.org', 'ffmpeg.org'],
} as const;
