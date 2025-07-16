/**
 * Security Manager Tests
 * Comprehensive tests for security functionality
 */

import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { CSPManager } from '../../src/backend/security/csp-config';
import { DependencySecurityManager } from '../../src/backend/security/dependency-security';
import { SecurityAuditor } from '../../src/backend/security/security-audit';
import * as securityConfig from '../../src/backend/security/security-config';
import { SecurityManager } from '../../src/backend/security/security-manager';
import * as securityUtils from '../../src/backend/security/security-utils';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Mock electron app
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      switch (name) {
        case 'userData':
          return '/mock/userData';
        case 'downloads':
          return '/mock/downloads';
        case 'temp':
          return '/mock/temp';
        case 'home':
          return '/mock/home';
        default:
          return '/mock/default';
      }
    }),
    getVersion: jest.fn(() => '1.0.0'),
  },
  session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: jest.fn(),
        onBeforeRequest: jest.fn(),
      },
      on: jest.fn(),
    },
  },
  BrowserWindow: jest.fn(),
}));

describe('SecurityManager', () => {
  let securityManager: SecurityManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'security-test-'));
    securityManager = new SecurityManager(mockLogger);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(securityManager.initialize()).resolves.not.toThrow();
      expect(securityManager.isInitialized()).toBe(true);
    });

    it('should validate security configuration', async () => {
      await securityManager.initialize();
      const config = securityManager.getSecurityConfig();

      expect(config.processIsolation.contextIsolation).toBe(true);
      expect(config.processIsolation.nodeIntegration).toBe(false);
      expect(config.fileSystem.enablePathValidation).toBe(true);
    });
  });

  describe('file system security validation', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('should validate safe file paths', async () => {
      const safePath = path.join(tempDir, 'safe-file.txt');
      const result = await securityManager.validateFileSystemOperation(
        'read',
        safePath,
      );

      expect(result.isValid).toBe(true);
      expect(result.isSecure).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect directory traversal attempts', async () => {
      const maliciousPath = '../../../etc/passwd';
      const result = await securityManager.validateFileSystemOperation(
        'read',
        maliciousPath,
      );

      expect(result.isSecure).toBe(false);
      expect(result.violations).toContain(
        'Directory traversal attempt detected',
      );
    });

    it('should validate file extensions', async () => {
      const executablePath = path.join(tempDir, 'malicious.exe');
      const result = await securityManager.validateFileSystemOperation(
        'write',
        executablePath,
      );

      expect(result.isSecure).toBe(false);
      expect(
        result.violations.some(v => v.includes('Blocked file extension')),
      ).toBe(true);
    });

    it('should check file size limits', async () => {
      const largePath = path.join(tempDir, 'large-file.txt');
      const largeContent = Buffer.alloc(200 * 1024 * 1024); // 200MB

      const result = await securityManager.validateFileSystemOperation(
        'write',
        largePath,
        largeContent,
      );

      expect(result.isSecure).toBe(false);
      expect(
        result.violations.some(v => v.includes('File size exceeds limit')),
      ).toBe(true);
    });
  });

  describe('dependency security validation', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('should validate trusted sources', async () => {
      const testFile = path.join(tempDir, 'test-dependency');
      await fs.writeFile(testFile, 'test content');

      const result = await securityManager.validateDependencySecurity(
        'test-dep',
        testFile,
        undefined,
        'github.com',
      );

      expect(result.source).toBe('github.com');
      expect(result.sourceValid).toBe(true);
    });

    it('should detect untrusted sources', async () => {
      const testFile = path.join(tempDir, 'test-dependency');
      await fs.writeFile(testFile, 'test content');

      const result = await securityManager.validateDependencySecurity(
        'test-dep',
        testFile,
        undefined,
        'malicious-site.com',
      );

      expect(result.sourceValid).toBe(false);
      expect(result.violations).toContain('Untrusted dependency source');
    });
  });

  describe('security statistics', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('should track security violations', async () => {
      // Trigger some violations
      await securityManager.validateFileSystemOperation(
        'read',
        '../../../etc/passwd',
      );
      await securityManager.validateFileSystemOperation(
        'write',
        'malicious.exe',
      );

      const stats = securityManager.getSecurityStatistics();

      expect(stats.totalViolations).toBeGreaterThan(0);
      expect(stats.violationsByType).toBeDefined();
      expect(stats.recentViolations).toBeDefined();
    });
  });

  describe('security audit', () => {
    beforeEach(async () => {
      await securityManager.initialize();
    });

    it('should perform security audit', async () => {
      const audit = await securityManager.performSecurityAudit();

      expect(audit.passed).toBeDefined();
      expect(audit.issues).toBeDefined();
      expect(audit.recommendations).toBeDefined();
    });
  });
});

describe('SecurityAuditor', () => {
  let securityAuditor: SecurityAuditor;

  beforeEach(() => {
    securityAuditor = new SecurityAuditor(mockLogger);
    jest.clearAllMocks();
  });

  describe('full security audit', () => {
    it('should perform comprehensive audit', async () => {
      const result = await securityAuditor.performFullAudit();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.passed).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.categories).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.criticalIssues).toBeDefined();
    });

    it('should audit process isolation', async () => {
      const result = await securityAuditor.performFullAudit();

      expect(result.categories.processIsolation).toBeDefined();
      expect(result.categories.processIsolation.checks).toBeDefined();
      expect(result.categories.processIsolation.score).toBeGreaterThanOrEqual(
        0,
      );
    });

    it('should audit file system security', async () => {
      const result = await securityAuditor.performFullAudit();

      expect(result.categories.fileSystemSecurity).toBeDefined();
      expect(result.categories.fileSystemSecurity.checks).toBeDefined();
    });

    it('should generate recommendations', async () => {
      const result = await securityAuditor.performFullAudit();

      expect(Array.isArray(result.recommendations)).toBe(true);
      result.recommendations.forEach(rec => {
        expect(rec.category).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.action).toBeDefined();
      });
    });
  });

  describe('audit history', () => {
    it('should maintain audit history', async () => {
      await securityAuditor.performFullAudit();
      await securityAuditor.performFullAudit();

      const history = securityAuditor.getAuditHistory();
      expect(history.length).toBe(2);
    });

    it('should get latest audit result', async () => {
      const audit1 = await securityAuditor.performFullAudit();
      const latest = securityAuditor.getLatestAuditResult();

      expect(latest).toEqual(audit1);
    });
  });
});

describe('CSPManager', () => {
  let cspManager: CSPManager;

  beforeEach(() => {
    cspManager = new CSPManager(mockLogger);
    jest.clearAllMocks();
  });

  describe('CSP policy generation', () => {
    it('should generate valid CSP policy string', () => {
      const policy = cspManager.generatePolicyString();

      expect(typeof policy).toBe('string');
      expect(policy).toContain("default-src 'self'");
      expect(policy).toContain('script-src');
      expect(policy).toContain('style-src');
    });

    it('should generate nonces when enabled', () => {
      cspManager.updateConfig({
        nonce: { enabled: true, scripts: true, styles: true },
      });

      const scriptNonce = cspManager.generateNonce('script');
      const styleNonce = cspManager.generateNonce('style');

      expect(scriptNonce).toBeTruthy();
      expect(styleNonce).toBeTruthy();
      expect(scriptNonce).not.toBe(styleNonce);
    });

    it('should validate nonces', () => {
      cspManager.updateConfig({
        nonce: { enabled: true, scripts: true, styles: true },
      });

      const nonce = cspManager.generateNonce('script');

      expect(cspManager.validateNonce(nonce, 'script')).toBe(true);
      expect(cspManager.validateNonce('invalid-nonce', 'script')).toBe(false);
    });
  });

  describe('violation tracking', () => {
    it('should track CSP violations', () => {
      const initialViolations = cspManager.getViolations();
      expect(Array.isArray(initialViolations)).toBe(true);
    });

    it('should clear violations', () => {
      cspManager.clearViolations();
      const violations = cspManager.getViolations();
      expect(violations).toHaveLength(0);
    });

    it('should generate statistics', () => {
      const stats = cspManager.getStatistics();

      expect(stats.totalViolations).toBeDefined();
      expect(stats.violationsByDirective).toBeDefined();
      expect(stats.recentViolations).toBeDefined();
      expect(stats.criticalViolations).toBeDefined();
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig = {
        enabled: false,
        reportOnly: true,
      };

      cspManager.updateConfig(newConfig);
      const config = cspManager.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.reportOnly).toBe(true);
    });

    it('should generate comprehensive report', () => {
      const report = cspManager.generateReport();

      expect(report.config).toBeDefined();
      expect(report.policy).toBeDefined();
      expect(report.statistics).toBeDefined();
      expect(report.recentViolations).toBeDefined();
    });
  });
});

describe('DependencySecurityManager', () => {
  let dependencySecurityManager: DependencySecurityManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dep-security-test-'));
    dependencySecurityManager = new DependencySecurityManager(
      mockLogger,
      tempDir,
    );
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(
        dependencySecurityManager.initialize(),
      ).resolves.not.toThrow();
    });

    it('should create quarantine directory', async () => {
      await dependencySecurityManager.initialize();
      expect(await fs.pathExists(tempDir)).toBe(true);
    });
  });

  describe('dependency verification', () => {
    let testFile: string;

    beforeEach(async () => {
      await dependencySecurityManager.initialize();
      testFile = path.join(tempDir, 'test-dependency');
      await fs.writeFile(testFile, 'test content');
    });

    it('should verify dependency with valid checksum', async () => {
      const content = 'test content';
      const expectedChecksum = securityUtils.hashData(content);

      const result = await dependencySecurityManager.verifyDependency(
        'test-dep',
        testFile,
        expectedChecksum,
        'github.com',
      );

      expect(result.checksumValid).toBe(true);
      expect(result.sourceValid).toBe(true);
    });

    it('should detect invalid checksum', async () => {
      const result = await dependencySecurityManager.verifyDependency(
        'test-dep',
        testFile,
        'invalid-checksum',
        'github.com',
      );

      expect(result.checksumValid).toBe(false);
      expect(result.securityIssues).toContain('Checksum verification failed');
    });

    it('should detect untrusted source', async () => {
      const result = await dependencySecurityManager.verifyDependency(
        'test-dep',
        testFile,
        undefined,
        'untrusted-source.com',
      );

      expect(result.sourceValid).toBe(false);
      expect(
        result.securityIssues.some(issue => issue.includes('Untrusted source')),
      ).toBe(true);
    });
  });

  describe('trusted sources management', () => {
    beforeEach(async () => {
      await dependencySecurityManager.initialize();
    });

    it('should add trusted source', () => {
      dependencySecurityManager.addTrustedSource('example.com', [
        'key1',
        'key2',
      ]);

      // This would be tested by verifying a dependency from this source
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Trusted source added',
        'DependencySecurityManager',
        { domain: 'example.com' },
      );
    });

    it('should remove trusted source', () => {
      dependencySecurityManager.addTrustedSource('example.com', ['key1']);
      dependencySecurityManager.removeTrustedSource('example.com');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Trusted source removed',
        'DependencySecurityManager',
        { domain: 'example.com' },
      );
    });
  });

  describe('security reporting', () => {
    beforeEach(async () => {
      await dependencySecurityManager.initialize();
    });

    it('should generate security report', () => {
      const report = dependencySecurityManager.generateSecurityReport();

      expect(report.summary).toBeDefined();
      expect(report.trustedSources).toBeDefined();
      expect(report.securityChecks).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should export configuration', () => {
      const config = dependencySecurityManager.exportConfiguration();

      expect(config.trustedSources).toBeDefined();
      expect(config.knownSignatures).toBeDefined();
    });
  });
});

describe('Security Utils', () => {
  describe('token generation', () => {
    it('should generate secure tokens', () => {
      const token1 = securityUtils.generateSecureToken();
      const token2 = securityUtils.generateSecureToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate nonces', () => {
      const nonce1 = securityUtils.generateNonce();
      const nonce2 = securityUtils.generateNonce();

      expect(nonce1).toBeTruthy();
      expect(nonce2).toBeTruthy();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('hashing and verification', () => {
    it('should hash data consistently', () => {
      const data = 'test data';
      const hash1 = securityUtils.hashData(data);
      const hash2 = securityUtils.hashData(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
    });

    it('should verify hashes correctly', () => {
      const data = 'test data';
      const hash = securityUtils.hashData(data);

      expect(securityUtils.verifyHash(data, hash)).toBe(true);
      expect(securityUtils.verifyHash('different data', hash)).toBe(false);
    });
  });

  describe('filename sanitization', () => {
    it('should sanitize dangerous filenames', () => {
      const dangerous = 'file<>:"|?*.txt';
      const sanitized = securityUtils.sanitizeFilename(dangerous);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain(':');
      expect(sanitized).not.toContain('|');
      expect(sanitized).not.toContain('?');
      expect(sanitized).not.toContain('*');
    });

    it('should handle empty filenames', () => {
      expect(() => securityUtils.sanitizeFilename('')).toThrow();
      expect(() => securityUtils.sanitizeFilename(null as any)).toThrow();
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const sanitized = securityUtils.sanitizeFilename(longName);

      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized.endsWith('.txt')).toBe(true);
    });
  });

  describe('path validation', () => {
    it('should validate safe paths', () => {
      const safePath = '/safe/path/file.txt';
      const result = securityUtils.validateFilePath(safePath);

      expect(result.isValid).toBe(true);
      expect(result.isSecure).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect directory traversal', () => {
      const maliciousPath = '../../../etc/passwd';
      const result = securityUtils.validateFilePath(maliciousPath);

      expect(result.isSecure).toBe(false);
      expect(result.errors.some(e => e.includes('directory traversal'))).toBe(
        true,
      );
    });

    it('should validate against allowed base paths', () => {
      const allowedPaths = ['/allowed'];
      const validPath = '/allowed/file.txt';
      const invalidPath = '/forbidden/file.txt';

      const validResult = securityUtils.validateFilePath(
        validPath,
        allowedPaths,
      );
      const invalidResult = securityUtils.validateFilePath(
        invalidPath,
        allowedPaths,
      );

      expect(validResult.isSecure).toBe(true);
      expect(invalidResult.isSecure).toBe(false);
    });
  });

  describe('URL validation', () => {
    it('should validate HTTPS URLs', () => {
      const result = securityUtils.validateUrl('https://example.com');

      expect(result.isValid).toBe(true);
      expect(result.isSecure).toBe(true);
    });

    it('should warn about HTTP URLs', () => {
      const result = securityUtils.validateUrl('http://example.com');

      expect(result.isValid).toBe(true);
      expect(result.errors.some(e => e.includes('less secure'))).toBe(true);
    });

    it('should block localhost URLs', () => {
      const result = securityUtils.validateUrl('http://localhost:3000');

      expect(result.isSecure).toBe(false);
      expect(result.errors.some(e => e.includes('Localhost'))).toBe(true);
    });

    it('should block private IP addresses', () => {
      const result = securityUtils.validateUrl('http://192.168.1.1');

      expect(result.isSecure).toBe(false);
      expect(result.errors.some(e => e.includes('Private IP'))).toBe(true);
    });
  });

  describe('input sanitization', () => {
    it('should sanitize user input', () => {
      const maliciousInput = 'Hello\x00World\x01Test';
      const sanitized = securityUtils.sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('\x00');
      expect(sanitized).not.toContain('\x01');
      expect(sanitized).toBe('HelloWorldTest');
    });

    it('should limit input length', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = securityUtils.sanitizeInput(longInput, 100);

      expect(sanitized.length).toBe(100);
    });

    it('should escape HTML', () => {
      const htmlInput = '<script>alert("xss")</script>';
      const escaped = securityUtils.escapeHtml(htmlInput);

      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });
  });

  describe('rate limiting', () => {
    it('should allow requests within limit', () => {
      const rateLimiter = new securityUtils.RateLimiter(5, 60000);

      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const rateLimiter = new securityUtils.RateLimiter(2, 60000);

      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(false);
    });

    it('should reset rate limits', () => {
      const rateLimiter = new securityUtils.RateLimiter(1, 60000);

      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(false);

      rateLimiter.reset('user1');
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });
  });
});

describe('Security Configuration', () => {
  describe('configuration loading', () => {
    it('should load default configuration', () => {
      const config = securityConfig.getSecurityConfig();

      expect(config.processIsolation.contextIsolation).toBe(true);
      expect(config.processIsolation.nodeIntegration).toBe(false);
      expect(config.fileSystem.enablePathValidation).toBe(true);
      expect(config.csp.enabled).toBe(true);
    });

    it('should validate configuration', () => {
      const config = securityConfig.getSecurityConfig();
      const validation = securityConfig.validateSecurityConfig(config);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      const invalidConfig = {
        ...securityConfig.DEFAULT_SECURITY_CONFIG,
        processIsolation: {
          ...securityConfig.DEFAULT_SECURITY_CONFIG.processIsolation,
          contextIsolation: false,
        },
      };

      const validation = securityConfig.validateSecurityConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('browser window configuration', () => {
    it('should generate secure browser window config', () => {
      const config = securityConfig.getBrowserWindowSecurityConfig();

      expect(config.contextIsolation).toBe(true);
      expect(config.nodeIntegration).toBe(false);
      expect(config.webSecurity).toBe(true);
      expect(config.preload).toBeDefined();
    });
  });

  describe('trusted sources', () => {
    it('should identify trusted sources', () => {
      expect(
        securityConfig.isTrustedSource('https://github.com/user/repo'),
      ).toBe(true);
      expect(
        securityConfig.isTrustedSource('https://api.github.com/repos'),
      ).toBe(true);
      expect(securityConfig.isTrustedSource('https://malicious-site.com')).toBe(
        false,
      );
    });

    it('should handle subdomains', () => {
      expect(securityConfig.isTrustedSource('https://api.github.com')).toBe(
        true,
      );
      expect(
        securityConfig.isTrustedSource('https://raw.githubusercontent.com'),
      ).toBe(true);
    });
  });

  describe('file extension validation', () => {
    it('should allow safe extensions', () => {
      expect(securityConfig.isExtensionAllowed('document.txt')).toBe(true);
      expect(securityConfig.isExtensionAllowed('data.json')).toBe(true);
      expect(securityConfig.isExtensionAllowed('video.mp4')).toBe(true);
    });

    it('should block dangerous extensions', () => {
      expect(securityConfig.isExtensionAllowed('malware.exe')).toBe(false);
      expect(securityConfig.isExtensionAllowed('script.bat')).toBe(false);
      expect(securityConfig.isExtensionAllowed('virus.com')).toBe(false);
    });
  });
});
