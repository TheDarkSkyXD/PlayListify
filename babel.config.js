module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          // Target Electron's Node.js version and modern browsers for renderer
          // Adjust based on your specific Electron version support if needed
          electron: "36", // Matched to package.json
          browsers: "defaults"
        },
        // Optional: Specify if you need core-js polyfills
        // useBuiltIns: 'usage',
        // corejs: 3,
      }
    ]
  ],
  plugins: [
    'add-module-exports'
  ]
  // Add plugins here if needed, e.g., for specific syntax or transformations
  // plugins: []
}; 