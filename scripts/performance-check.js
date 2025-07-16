#!/usr/bin/env node

/**
 * Performance Check Script
 * Analyzes build performance and provides optimization recommendations
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceChecker {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.results = {
      bundleSize: {},
      buildTime: {},
      dependencies: {},
      recommendations: [],
    };
  }

  async run() {
    console.log('🔍 Running performance analysis...\n');

    try {
      await this.checkBundleSize();
      await this.checkBuildTime();
      await this.checkDependencies();
      await this.generateRecommendations();

      this.printResults();
    } catch (error) {
      console.error('❌ Performance check failed:', error.message);
      process.exit(1);
    }
  }

  async checkBundleSize() {
    console.log('📦 Analyzing bundle size...');

    try {
      // Build production bundle
      execSync('npm run build:prod', {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });

      // Check webpack output
      const webpackDir = path.join(this.projectRoot, '.webpack');

      if (await fs.pathExists(webpackDir)) {
        const stats = await this.analyzeBundleDirectory(webpackDir);
        this.results.bundleSize = stats;
      }

      console.log('✅ Bundle size analysis complete');
    } catch (error) {
      console.warn('⚠️  Bundle size analysis failed:', error.message);
    }
  }

  async analyzeBundleDirectory(dir) {
    const stats = {
      main: { size: 0, files: [] },
      renderer: { size: 0, files: [] },
      total: 0,
    };

    const analyzeDir = async (dirPath, category) => {
      if (!(await fs.pathExists(dirPath))) return;

      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStat = await fs.stat(filePath);

        if (fileStat.isFile() && !file.endsWith('.map')) {
          const size = fileStat.size;
          stats[category].size += size;
          stats[category].files.push({
            name: file,
            size,
            sizeFormatted: this.formatBytes(size),
          });
          stats.total += size;
        }
      }
    };

    await analyzeDir(path.join(dir, 'main'), 'main');
    await analyzeDir(path.join(dir, 'renderer'), 'renderer');

    return stats;
  }

  async checkBuildTime() {
    console.log('⏱️  Measuring build time...');

    const buildCommands = [
      {
        name: 'Development Build',
        command: 'npm run build:main && npm run build:renderer',
      },
      { name: 'Production Build', command: 'npm run build:prod' },
    ];

    for (const { name, command } of buildCommands) {
      try {
        const startTime = Date.now();
        execSync(command, {
          cwd: this.projectRoot,
          stdio: 'pipe',
        });
        const endTime = Date.now();

        this.results.buildTime[name] = {
          time: endTime - startTime,
          timeFormatted: this.formatTime(endTime - startTime),
        };
      } catch (error) {
        console.warn(`⚠️  ${name} failed:`, error.message);
      }
    }

    console.log('✅ Build time analysis complete');
  }

  async checkDependencies() {
    console.log('📚 Analyzing dependencies...');

    try {
      const packageJson = await fs.readJson(
        path.join(this.projectRoot, 'package.json'),
      );

      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Analyze dependency sizes
      const depSizes = await this.analyzeDependencySizes(dependencies);

      this.results.dependencies = {
        total: Object.keys(dependencies).length,
        production: Object.keys(packageJson.dependencies || {}).length,
        development: Object.keys(packageJson.devDependencies || {}).length,
        largest: depSizes.slice(0, 10),
      };

      console.log('✅ Dependency analysis complete');
    } catch (error) {
      console.warn('⚠️  Dependency analysis failed:', error.message);
    }
  }

  async analyzeDependencySizes(dependencies) {
    const sizes = [];

    for (const [name, version] of Object.entries(dependencies)) {
      try {
        const packagePath = path.join(this.projectRoot, 'node_modules', name);
        if (await fs.pathExists(packagePath)) {
          const size = await this.getDirectorySize(packagePath);
          sizes.push({
            name,
            version,
            size,
            sizeFormatted: this.formatBytes(size),
          });
        }
      } catch (error) {
        // Skip packages that can't be analyzed
      }
    }

    return sizes.sort((a, b) => b.size - a.size);
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }

    return totalSize;
  }

  async generateRecommendations() {
    console.log('💡 Generating recommendations...');

    const recommendations = [];

    // Bundle size recommendations
    if (this.results.bundleSize.total > 5 * 1024 * 1024) {
      // > 5MB
      recommendations.push({
        type: 'bundle-size',
        severity: 'high',
        message:
          'Bundle size is large (>5MB). Consider code splitting and lazy loading.',
        actions: [
          'Implement lazy loading for non-critical components',
          'Use dynamic imports for large dependencies',
          'Enable tree shaking in webpack configuration',
          'Consider using webpack-bundle-analyzer to identify large modules',
        ],
      });
    }

    // Build time recommendations
    const prodBuildTime = this.results.buildTime['Production Build']?.time;
    if (prodBuildTime && prodBuildTime > 60000) {
      // > 1 minute
      recommendations.push({
        type: 'build-time',
        severity: 'medium',
        message:
          'Build time is slow (>1 minute). Consider build optimizations.',
        actions: [
          'Enable webpack caching',
          'Use parallel processing with thread-loader',
          'Optimize TypeScript compilation with incremental builds',
          'Consider using esbuild for faster builds',
        ],
      });
    }

    // Dependency recommendations
    const largeDeps =
      this.results.dependencies.largest?.filter(
        dep => dep.size > 10 * 1024 * 1024,
      ) || [];
    if (largeDeps.length > 0) {
      recommendations.push({
        type: 'dependencies',
        severity: 'medium',
        message: `Found ${largeDeps.length} large dependencies (>10MB each).`,
        actions: [
          'Review if all large dependencies are necessary',
          'Consider lighter alternatives for large packages',
          'Use dynamic imports for large optional dependencies',
          'Check if dependencies can be externalized',
        ],
        details: largeDeps.map(dep => `${dep.name}: ${dep.sizeFormatted}`),
      });
    }

    // General recommendations
    recommendations.push({
      type: 'general',
      severity: 'info',
      message: 'General performance optimization recommendations',
      actions: [
        'Enable gzip compression for production builds',
        'Implement service worker for caching',
        'Use CDN for static assets',
        'Monitor runtime performance with performance metrics',
        'Implement lazy loading for images and components',
        'Use React.memo and useMemo for expensive computations',
      ],
    });

    this.results.recommendations = recommendations;
    console.log('✅ Recommendations generated');
  }

  printResults() {
    console.log('\n📊 Performance Analysis Results\n');
    console.log('='.repeat(50));

    // Bundle Size Results
    if (this.results.bundleSize.total) {
      console.log('\n📦 Bundle Size Analysis:');
      console.log(
        `Total Bundle Size: ${this.formatBytes(this.results.bundleSize.total)}`,
      );

      if (this.results.bundleSize.main.size > 0) {
        console.log(
          `Main Process: ${this.formatBytes(this.results.bundleSize.main.size)}`,
        );
      }

      if (this.results.bundleSize.renderer.size > 0) {
        console.log(
          `Renderer Process: ${this.formatBytes(this.results.bundleSize.renderer.size)}`,
        );
      }
    }

    // Build Time Results
    if (Object.keys(this.results.buildTime).length > 0) {
      console.log('\n⏱️  Build Time Analysis:');
      for (const [name, data] of Object.entries(this.results.buildTime)) {
        console.log(`${name}: ${data.timeFormatted}`);
      }
    }

    // Dependency Results
    if (this.results.dependencies.total) {
      console.log('\n📚 Dependency Analysis:');
      console.log(`Total Dependencies: ${this.results.dependencies.total}`);
      console.log(`Production: ${this.results.dependencies.production}`);
      console.log(`Development: ${this.results.dependencies.development}`);

      if (this.results.dependencies.largest.length > 0) {
        console.log('\nLargest Dependencies:');
        this.results.dependencies.largest.slice(0, 5).forEach((dep, index) => {
          console.log(`${index + 1}. ${dep.name}: ${dep.sizeFormatted}`);
        });
      }
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    this.results.recommendations.forEach((rec, index) => {
      const severityIcon = {
        high: '🔴',
        medium: '🟡',
        low: '🟢',
        info: 'ℹ️',
      }[rec.severity];

      console.log(`\n${index + 1}. ${severityIcon} ${rec.message}`);

      if (rec.actions && rec.actions.length > 0) {
        console.log('   Actions:');
        rec.actions.forEach(action => {
          console.log(`   • ${action}`);
        });
      }

      if (rec.details && rec.details.length > 0) {
        console.log('   Details:');
        rec.details.forEach(detail => {
          console.log(`   • ${detail}`);
        });
      }
    });

    console.log('\n='.repeat(50));
    console.log('✅ Performance analysis complete!\n');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTime(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// Run the performance checker
if (require.main === module) {
  const checker = new PerformanceChecker();
  checker.run().catch(console.error);
}

module.exports = PerformanceChecker;
