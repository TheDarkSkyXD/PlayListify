const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: {
    // Import support for CSS imports
    'postcss-import': {},
    
    // TailwindCSS with JIT mode for optimal performance
    tailwindcss: {
      config: './tailwind.config.js',
    },
    
    // Autoprefixer for browser compatibility
    autoprefixer: {
      flexbox: 'no-2009',
      grid: 'autoplace',
    },
    
    // Production optimizations
    ...(isProduction && {
      // CSS optimization and minification
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          colormin: true,
          convertValues: true,
          discardDuplicates: true,
          discardEmpty: true,
          mergeRules: true,
          minifyFontValues: true,
          minifyParams: true,
          minifySelectors: true,
          reduceIdents: false, // Keep for CSS custom properties
          zindex: false, // Avoid z-index optimization issues
        }],
      },
    }),
  },
}
