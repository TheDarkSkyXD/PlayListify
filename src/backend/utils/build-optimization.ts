/**
 * Build Optimization Utilities
 * Provides utilities for optimizing production builds and analyzing bundle performance
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { getLogger } from '../services/logger-service';

export interface BuildOptimizationConfig {
  enabled: boolean;
  minifyAssets: boolean;
  optimizeImages: boolean;
  generateSourceMaps: boolean;
  analyzeBundles: boolean;
  treeshaking: boolean;
  codesplitting: boolean;
  compression: 'gzip' | 'brotli' | 'both' | 'none';
}

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  assets: AssetInfo[];
  dependencies: DependencyInfo[];
  recommendations: OptimizationRecommendation[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  type: 'entry' | 'vendor' | 'async' | 'runtime';
}

export interface AssetInfo {
  name: string;
  size: number;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  optimized: boolean;
}

export interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  usage: 'critical' | 'important' | 'optional' | 'unused';
  treeshakeable: boolean;
}

export interface OptimizationRecommendation {
  type: 'size' | 'performance' | 'dependency' | 'caching';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  impact: string;
  solution: string;
}

class BuildOptimizer {
  private config: BuildOptimizationConfig;
  private logger = getLogger();

  constructor(config?: Partial<BuildOptimizationConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      minifyAssets: true,
      optimizeImages: true,
      generateSourceMaps: false,
      analyzeBundles: true,
      treeshaking: true,
      codesplitting: true,
      compression: 'gzip',
      ...config,
    };

    this.logger.debug('Build optimizer initialized', 'BuildOptimizer', {
      config: this.config,
    });
  }

  /**
   * Get webpack optimization configuration
   */
  public getWebpackOptimization(): any {
    if (!this.config.enabled) {
      return {
        minimize: false,
        splitChunks: false,
      };
    }

    const optimization: any = {
      minimize: this.config.minifyAssets,
      nodeEnv: false, // Prevent webpack from setting NODE_ENV

      // Code splitting configuration
      splitChunks: this.config.codesplitting
        ? {
            chunks: 'all',
            minSize: 20000,
            maxSize: 250000,
            cacheGroups: {
              default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true,
              },
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: -10,
                chunks: 'all',
              },
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                name: 'react',
                priority: 10,
                chunks: 'all',
              },
              tanstack: {
                test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
                name: 'tanstack',
                priority: 5,
                chunks: 'all',
              },
              ui: {
                test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
                name: 'ui',
                priority: 5,
                chunks: 'all',
              },
              utilities: {
                test: /[\\/]node_modules[\\/](lodash|date-fns|uuid)[\\/]/,
                name: 'utilities',
                priority: 3,
                chunks: 'all',
              },
            },
          }
        : false,

      // Tree shaking
      usedExports: this.config.treeshaking,
      sideEffects: false,

      // Minimizer configuration
      minimizer: this.config.minifyAssets
        ? [
            '...', // Use default minimizers
          ]
        : [],
    };

    return optimization;
  }

  /**
   * Get webpack performance configuration
   */
  public getWebpackPerformance(): any {
    return {
      hints: this.config.enabled ? 'warning' : false,
      maxEntrypointSize: 1024000, // 1MB
      maxAssetSize: 512000, // 512KB
      assetFilter: (assetFilename: string) => {
        // Only check JS and CSS files
        return /\.(js|css)$/.test(assetFilename);
      },
    };
  }

  /**
   * Get webpack stats configuration for analysis
   */
  public getWebpackStats(): any {
    return {
      colors: true,
      modules: this.config.analyzeBundles,
      chunks: this.config.analyzeBundles,
      chunkModules: this.config.analyzeBundles,
      timings: true,
      builtAt: true,
      assets: this.config.analyzeBundles,
      entrypoints: this.config.analyzeBundles,
      performance: this.config.analyzeBundles,
      warnings: true,
      errors: true,
    };
  }

  /**
   * Analyze webpack stats for optimization opportunities
   */
  public async analyzeBundleStats(statsPath: string): Promise<BundleAnalysis> {
    try {
      const stats = await fs.readJson(statsPath);

      const analysis: BundleAnalysis = {
        totalSize: 0,
        gzippedSize: 0,
        chunks: [],
        assets: [],
        dependencies: [],
        recommendations: [],
      };

      // Analyze assets
      if (stats.assets) {
        for (const asset of stats.assets) {
          const assetInfo: AssetInfo = {
            name: asset.name,
            size: asset.size,
            type: this.getAssetType(asset.name),
            optimized: this.isAssetOptimized(asset.name, asset.size),
          };

          analysis.assets.push(assetInfo);
          analysis.totalSize += asset.size;
        }
      }

      // Analyze chunks
      if (stats.chunks) {
        for (const chunk of stats.chunks) {
          const chunkInfo: ChunkInfo = {
            name: chunk.names?.[0] || `chunk-${chunk.id}`,
            size: chunk.size,
            gzippedSize: Math.round(chunk.size * 0.3), // Estimate
            modules: chunk.modules?.map((m: any) => m.name) || [],
            type: this.getChunkType(chunk),
          };

          analysis.chunks.push(chunkInfo);
        }
      }

      // Analyze dependencies
      if (stats.modules) {
        const dependencyMap = new Map<string, DependencyInfo>();

        for (const module of stats.modules) {
          if (module.name?.includes('node_modules')) {
            const depName = this.extractDependencyName(module.name);
            if (depName) {
              const existing = dependencyMap.get(depName);
              if (existing) {
                existing.size += module.size || 0;
              } else {
                dependencyMap.set(depName, {
                  name: depName,
                  version: 'unknown',
                  size: module.size || 0,
                  usage: this.analyzeDependencyUsage(depName, stats),
                  treeshakeable: this.isDependencyTreeshakeable(depName),
                });
              }
            }
          }
        }

        analysis.dependencies = Array.from(dependencyMap.values());
      }

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      this.logger.info('Bundle analysis completed', 'BuildOptimizer', {
        totalSize: `${Math.round(analysis.totalSize / 1024)}KB`,
        chunksCount: analysis.chunks.length,
        assetsCount: analysis.assets.length,
        dependenciesCount: analysis.dependencies.length,
        recommendationsCount: analysis.recommendations.length,
      });

      return analysis;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to analyze bundle stats', 'BuildOptimizer', {
        statsPath,
        error: errorMessage,
      });
      throw error;
    }
  }

  private getAssetType(filename: string): AssetInfo['type'] {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.js':
      case '.mjs':
        return 'js';
      case '.css':
        return 'css';
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.svg':
      case '.webp':
        return 'image';
      case '.woff':
      case '.woff2':
      case '.ttf':
      case '.eot':
        return 'font';
      default:
        return 'other';
    }
  }

  private isAssetOptimized(filename: string, size: number): boolean {
    const type = this.getAssetType(filename);

    switch (type) {
      case 'js':
        return filename.includes('.min.') || size < 100000; // 100KB
      case 'css':
        return filename.includes('.min.') || size < 50000; // 50KB
      case 'image':
        return size < 200000; // 200KB
      default:
        return true;
    }
  }

  private getChunkType(chunk: any): ChunkInfo['type'] {
    if (chunk.entry) return 'entry';
    if (chunk.names?.some((name: string) => name.includes('vendor')))
      return 'vendor';
    if (chunk.names?.some((name: string) => name.includes('runtime')))
      return 'runtime';
    return 'async';
  }

  private extractDependencyName(moduleName: string): string | null {
    const match = moduleName.match(/node_modules[\/\\]([^\/\\]+)/);
    return match ? match[1] : null;
  }

  private analyzeDependencyUsage(
    depName: string,
    stats: any,
  ): DependencyInfo['usage'] {
    // This is a simplified analysis - in a real implementation,
    // you'd analyze actual usage patterns
    const criticalDeps = ['react', 'react-dom', 'electron'];
    const importantDeps = [
      '@tanstack/react-query',
      '@tanstack/react-router',
      'zustand',
    ];

    if (criticalDeps.includes(depName)) return 'critical';
    if (importantDeps.includes(depName)) return 'important';
    return 'optional';
  }

  private isDependencyTreeshakeable(depName: string): boolean {
    // List of known tree-shakeable dependencies
    const treeshakeableDeps = [
      'lodash-es',
      'date-fns',
      '@tanstack/react-query',
      'lucide-react',
    ];

    return treeshakeableDeps.includes(depName) || depName.includes('-es');
  }

  private generateRecommendations(
    analysis: BundleAnalysis,
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Check total bundle size
    if (analysis.totalSize > 2 * 1024 * 1024) {
      // 2MB
      recommendations.push({
        type: 'size',
        severity: 'high',
        message: 'Total bundle size is very large',
        impact: 'Slow application startup and poor user experience',
        solution:
          'Consider code splitting, lazy loading, and removing unused dependencies',
      });
    } else if (analysis.totalSize > 1024 * 1024) {
      // 1MB
      recommendations.push({
        type: 'size',
        severity: 'medium',
        message: 'Bundle size is above recommended threshold',
        impact: 'Slower application startup',
        solution: 'Optimize large dependencies and consider code splitting',
      });
    }

    // Check for large chunks
    const largeChunks = analysis.chunks.filter(chunk => chunk.size > 500000); // 500KB
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: `Found ${largeChunks.length} large chunks`,
        impact: 'Slower initial load times',
        solution: 'Split large chunks into smaller, more focused bundles',
      });
    }

    // Check for unused dependencies
    const unusedDeps = analysis.dependencies.filter(
      dep => dep.usage === 'unused',
    );
    if (unusedDeps.length > 0) {
      recommendations.push({
        type: 'dependency',
        severity: 'medium',
        message: `Found ${unusedDeps.length} potentially unused dependencies`,
        impact: 'Increased bundle size without benefit',
        solution: 'Remove unused dependencies from package.json',
      });
    }

    // Check for non-tree-shakeable dependencies
    const nonTreeshakeable = analysis.dependencies.filter(
      dep => !dep.treeshakeable && dep.size > 50000, // 50KB
    );
    if (nonTreeshakeable.length > 0) {
      recommendations.push({
        type: 'dependency',
        severity: 'low',
        message: `Found ${nonTreeshakeable.length} large non-tree-shakeable dependencies`,
        impact: 'Larger bundle size than necessary',
        solution:
          'Consider tree-shakeable alternatives or import only needed parts',
      });
    }

    // Check for unoptimized assets
    const unoptimizedAssets = analysis.assets.filter(asset => !asset.optimized);
    if (unoptimizedAssets.length > 0) {
      recommendations.push({
        type: 'size',
        severity: 'low',
        message: `Found ${unoptimizedAssets.length} unoptimized assets`,
        impact: 'Larger than necessary asset sizes',
        solution: 'Enable asset optimization and compression',
      });
    }

    return recommendations;
  }

  /**
   * Generate optimization report
   */
  public async generateOptimizationReport(
    analysis: BundleAnalysis,
    outputPath: string,
  ): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSize: analysis.totalSize,
        totalSizeFormatted: `${Math.round(analysis.totalSize / 1024)}KB`,
        chunksCount: analysis.chunks.length,
        assetsCount: analysis.assets.length,
        dependenciesCount: analysis.dependencies.length,
      },
      chunks: analysis.chunks.map(chunk => ({
        name: chunk.name,
        size: chunk.size,
        sizeFormatted: `${Math.round(chunk.size / 1024)}KB`,
        type: chunk.type,
        modulesCount: chunk.modules.length,
      })),
      assets: analysis.assets.map(asset => ({
        name: asset.name,
        size: asset.size,
        sizeFormatted: `${Math.round(asset.size / 1024)}KB`,
        type: asset.type,
        optimized: asset.optimized,
      })),
      dependencies: analysis.dependencies.map(dep => ({
        name: dep.name,
        size: dep.size,
        sizeFormatted: `${Math.round(dep.size / 1024)}KB`,
        usage: dep.usage,
        treeshakeable: dep.treeshakeable,
      })),
      recommendations: analysis.recommendations,
      config: this.config,
    };

    try {
      await fs.writeJson(outputPath, report, { spaces: 2 });

      this.logger.info('Optimization report generated', 'BuildOptimizer', {
        outputPath,
        totalSize: report.summary.totalSizeFormatted,
        recommendationsCount: report.recommendations.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        'Failed to generate optimization report',
        'BuildOptimizer',
        {
          outputPath,
          error: errorMessage,
        },
      );
      throw error;
    }
  }

  /**
   * Get PostCSS optimization configuration
   */
  public getPostCSSOptimization(): any {
    if (!this.config.enabled) {
      return {};
    }

    return {
      plugins: [
        require('autoprefixer'),
        ...(this.config.minifyAssets
          ? [
              require('cssnano')({
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true },
                    normalizeWhitespace: true,
                    minifySelectors: true,
                    minifyParams: true,
                  },
                ],
              }),
            ]
          : []),
      ],
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<BuildOptimizationConfig>): void {
    this.config = { ...this.config, ...updates };

    this.logger.debug('Build optimization config updated', 'BuildOptimizer', {
      updates,
      newConfig: this.config,
    });
  }

  /**
   * Get current configuration
   */
  public getConfig(): BuildOptimizationConfig {
    return { ...this.config };
  }
}

// Singleton instance
let buildOptimizerInstance: BuildOptimizer | null = null;

export function createBuildOptimizer(
  config?: Partial<BuildOptimizationConfig>,
): BuildOptimizer {
  if (!buildOptimizerInstance) {
    buildOptimizerInstance = new BuildOptimizer(config);
  }
  return buildOptimizerInstance;
}

export function getBuildOptimizer(): BuildOptimizer | null {
  return buildOptimizerInstance;
}

export { BuildOptimizer };
