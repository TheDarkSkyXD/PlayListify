/**
 * Content Security Policy Configuration
 * Comprehensive CSP setup for enhanced web security in Electron renderer processes
 */

import type { Logger } from '@/shared/interfaces/logger';
import { BrowserWindow, session } from 'electron';

export interface CSPConfig {
  enabled: boolean;
  reportOnly: boolean;
  reportUri?: string;
  policies: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    mediaSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    objectSrc: string[];
    frameSrc: string[];
    childSrc: string[];
    workerSrc: string[];
    manifestSrc: string[];
    baseUri: string[];
    formAction: string[];
    frameAncestors: string[];
  };
  nonce?: {
    enabled: boolean;
    scripts: boolean;
    styles: boolean;
  };
}

export interface CSPViolation {
  timestamp: Date;
  documentUri: string;
  violatedDirective: string;
  blockedUri: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
  sample?: string;
}

export class CSPManager {
  private logger: Logger;
  private config: CSPConfig;
  private violations: CSPViolation[] = [];
  private nonces: Map<string, string> = new Map();

  constructor(logger: Logger, config?: Partial<CSPConfig>) {
    this.logger = logger;
    this.config = this.mergeWithDefaults(config || {});
  }

  /**
   * Initialize CSP for all browser windows
   */
  initialize(): void {
    if (!this.config.enabled) {
      this.logger.info('CSP is disabled', 'CSPManager');
      return;
    }

    this.logger.info('Initializing Content Security Policy', 'CSPManager');

    // Set up CSP headers for all sessions
    this.setupCSPHeaders();

    // Monitor for CSP violations
    this.setupViolationReporting();

    // Set up CSP for new windows
    this.setupWindowCSP();

    this.logger.info('CSP initialized successfully', 'CSPManager', {
      reportOnly: this.config.reportOnly,
      reportUri: this.config.reportUri,
    });
  }

  /**
   * Generate CSP policy string
   */
  generatePolicyString(): string {
    const policies: string[] = [];

    // Add each directive
    Object.entries(this.config.policies).forEach(([directive, sources]) => {
      if (sources.length > 0) {
        const directiveName = this.camelToKebab(directive);
        policies.push(`${directiveName} ${sources.join(' ')}`);
      }
    });

    return policies.join('; ');
  }

  /**
   * Generate nonce for scripts or styles
   */
  generateNonce(type: 'script' | 'style'): string {
    if (!this.config.nonce?.enabled) {
      return '';
    }

    const nonce = this.createSecureNonce();
    this.nonces.set(`${type}-${Date.now()}`, nonce);

    // Clean up old nonces
    if (this.nonces.size > 100) {
      const entries = Array.from(this.nonces.entries());
      entries.slice(0, 50).forEach(([key]) => this.nonces.delete(key));
    }

    return nonce;
  }

  /**
   * Validate nonce
   */
  validateNonce(nonce: string, type: 'script' | 'style'): boolean {
    return Array.from(this.nonces.values()).includes(nonce);
  }

  /**
   * Get CSP violations
   */
  getViolations(limit = 50): CSPViolation[] {
    return this.violations.slice(-limit);
  }

  /**
   * Clear violation history
   */
  clearViolations(): void {
    this.violations = [];
    this.logger.info('CSP violations cleared', 'CSPManager');
  }

  /**
   * Update CSP configuration
   */
  updateConfig(updates: Partial<CSPConfig>): void {
    this.config = this.mergeWithDefaults({ ...this.config, ...updates });

    if (this.config.enabled) {
      this.setupCSPHeaders();
    }

    this.logger.info('CSP configuration updated', 'CSPManager');
  }

  /**
   * Get current CSP configuration
   */
  getConfig(): CSPConfig {
    return { ...this.config };
  }

  // Private methods

  private mergeWithDefaults(config: Partial<CSPConfig>): CSPConfig {
    return {
      enabled: true,
      reportOnly: false,
      reportUri: undefined,
      policies: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for React development
          "'unsafe-eval'", // Required for development tools
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for styled-components and CSS-in-JS
          'https://fonts.googleapis.com',
        ],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        mediaSrc: ["'self'", 'https:', 'blob:'],
        connectSrc: ["'self'", 'https:', 'wss:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        childSrc: ["'none'"],
        workerSrc: ["'self'", 'blob:'],
        manifestSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        ...config.policies,
      },
      nonce: {
        enabled: false,
        scripts: false,
        styles: false,
        ...config.nonce,
      },
      ...config,
    };
  }

  private setupCSPHeaders(): void {
    const policyString = this.generatePolicyString();
    const headerName = this.config.reportOnly
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';

    // Set CSP headers for the default session
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const headers = { ...details.responseHeaders };
      headers[headerName] = [policyString];

      if (this.config.reportUri) {
        const reportDirective = `; report-uri ${this.config.reportUri}`;
        headers[headerName][0] += reportDirective;
      }

      callback({ responseHeaders: headers });
    });

    this.logger.debug('CSP headers configured', 'CSPManager', {
      policy: policyString,
      reportOnly: this.config.reportOnly,
    });
  }

  private setupViolationReporting(): void {
    // Listen for CSP violation reports
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      if (details.url.includes('csp-report') && details.method === 'POST') {
        this.handleCSPViolationReport(details);
      }
      callback({});
    });

    // Monitor console messages for CSP violations
    session.defaultSession.on(
      'console-message',
      (event, level, message, line, sourceId) => {
        if (message.includes('Content Security Policy')) {
          this.handleConsoleCSPViolation(message, sourceId, line);
        }
      },
    );
  }

  private setupWindowCSP(): void {
    // Apply CSP to new browser windows
    const originalCreateWindow = BrowserWindow.prototype.constructor;

    // Note: This is a simplified approach. In production, you might want to use a different method
    // to ensure CSP is applied to all windows
  }

  private handleCSPViolationReport(details: any): void {
    try {
      if (details.uploadData && details.uploadData[0]) {
        const reportData = JSON.parse(details.uploadData[0].bytes.toString());
        const violation: CSPViolation = {
          timestamp: new Date(),
          documentUri: reportData['document-uri'] || '',
          violatedDirective: reportData['violated-directive'] || '',
          blockedUri: reportData['blocked-uri'] || '',
          sourceFile: reportData['source-file'],
          lineNumber: reportData['line-number'],
          columnNumber: reportData['column-number'],
          sample: reportData['script-sample'],
        };

        this.recordViolation(violation);
      }
    } catch (error) {
      this.logger.error('Failed to parse CSP violation report', 'CSPManager', {
        error,
      });
    }
  }

  private handleConsoleCSPViolation(
    message: string,
    sourceId?: string,
    line?: number,
  ): void {
    // Parse console CSP violation messages
    const violation: CSPViolation = {
      timestamp: new Date(),
      documentUri: sourceId || 'unknown',
      violatedDirective: this.extractDirectiveFromMessage(message),
      blockedUri: this.extractBlockedUriFromMessage(message),
      sourceFile: sourceId,
      lineNumber: line,
      sample:
        message.length > 100 ? message.substring(0, 100) + '...' : message,
    };

    this.recordViolation(violation);
  }

  private recordViolation(violation: CSPViolation): void {
    this.violations.push(violation);

    // Keep only recent violations
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-500);
    }

    this.logger.warn('CSP violation detected', 'CSPManager', {
      directive: violation.violatedDirective,
      blockedUri: violation.blockedUri,
      documentUri: violation.documentUri,
    });

    // In production, you might want to send critical violations to a monitoring service
    if (this.isCriticalViolation(violation)) {
      this.logger.error('Critical CSP violation', 'CSPManager', violation);
    }
  }

  private isCriticalViolation(violation: CSPViolation): boolean {
    const criticalDirectives = ['script-src', 'object-src', 'base-uri'];
    return criticalDirectives.some(directive =>
      violation.violatedDirective.includes(directive),
    );
  }

  private extractDirectiveFromMessage(message: string): string {
    const match = message.match(
      /violates the following Content Security Policy directive: "([^"]+)"/,
    );
    return match ? match[1] : 'unknown';
  }

  private extractBlockedUriFromMessage(message: string): string {
    const match = message.match(/Refused to [^"]+ '([^']+)'/);
    return match ? match[1] : 'unknown';
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  private createSecureNonce(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Get CSP statistics
   */
  getStatistics(): {
    totalViolations: number;
    violationsByDirective: Record<string, number>;
    recentViolations: number;
    criticalViolations: number;
  } {
    const violationsByDirective: Record<string, number> = {};
    let criticalViolations = 0;
    const recentThreshold = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    this.violations.forEach(violation => {
      const directive = violation.violatedDirective;
      violationsByDirective[directive] =
        (violationsByDirective[directive] || 0) + 1;

      if (this.isCriticalViolation(violation)) {
        criticalViolations++;
      }
    });

    const recentViolations = this.violations.filter(
      v => v.timestamp.getTime() > recentThreshold,
    ).length;

    return {
      totalViolations: this.violations.length,
      violationsByDirective,
      recentViolations,
      criticalViolations,
    };
  }

  /**
   * Generate CSP report for debugging
   */
  generateReport(): {
    config: CSPConfig;
    policy: string;
    statistics: ReturnType<typeof this.getStatistics>;
    recentViolations: CSPViolation[];
  } {
    return {
      config: this.getConfig(),
      policy: this.generatePolicyString(),
      statistics: this.getStatistics(),
      recentViolations: this.getViolations(20),
    };
  }
}
