module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // JSX specific
  jsxSingleQuote: true,
  bracketSameLine: false,

  // Other options
  arrowParens: 'avoid',
  endOfLine: 'lf',
  bracketSpacing: true,
  embeddedLanguageFormatting: 'auto',

  // Plugin configurations
  plugins: ['prettier-plugin-tailwindcss'],

  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
      },
    },
  ],
};
