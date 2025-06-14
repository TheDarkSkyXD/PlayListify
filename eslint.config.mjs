import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginImport from 'eslint-plugin-import';

export default [
  { // Universal ignores
    ignores: [
      '.erb/dll/**',
      'release/app/dist/**',
      'dist/**',
      'node_modules/**',
      '**/*.log', // More general log pattern
      'consolelogs/**',
      'postcss.config.js', // Plain JS, might not need TS linting
      'tailwind.config.js', // Plain JS
      '.eslintrc.js', // Old config, should be ignored
      'babel.config.js', // If present
    ],
  },
  js.configs.recommended, // ESLint's recommended JavaScript rules

  // Base TypeScript configuration - applies to .ts, .tsx, .mts, .cts files
  // tseslint.configs.recommended is an array of configs.
  ...tseslint.configs.recommended,

  // React specific configuration - applies to .jsx, .tsx files
  {
    files: ['**/*.{jsx,tsx}'],
    ...pluginReact.configs.flat.recommended, // React recommended rules (includes parser plugins for JSX)
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions, // Inherit base languageOptions
      globals: { // Merge browser globals for React components
        ...Object.fromEntries(
          Object.entries(globals.browser).map(([key, value]) => [key.trim(), value])
        ),
      }
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
      'react/jsx-uses-react': 'off', // Also not needed with new JSX transform
      // Add other React-specific rule overrides here
    },
  },

  // General project-wide rules and language options
  {
    files: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '.erb/**/*.{js,ts}'], // Target main source and erb scripts
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { // Define globals available in most parts of the project
        ...Object.fromEntries(
          Object.entries(globals.browser).map(([key, value]) => [key.trim(), value])
        ),
        ...globals.node, // For Electron main process and scripts
      },
      // The parser is already set by tseslint.configs.recommended for TS files
      // and pluginReact.configs.flat.recommended for JSX/TSX.
    },
    plugins: {
      import: pluginImport,
    },
    rules: {
      // General rules:
      '@typescript-eslint/no-explicit-any': 'warn', // Downgrade to warn for now
      // Define import plugin rules if needed, e.g.:
      // 'import/no-unresolved': 'off', // Keep off for now, or configure resolver
      // 'import/prefer-default-export': 'off',
    },
  },
  // Specific overrides for CommonJS modules or scripts if needed
  {
    files: [
      '.erb/**/**.js',
      '.erb/**/**.ts',
      '*.config.js', // Catches tailwind.config.js, postcss.config.js etc.
      '*.config.mjs',
      '*.config.cjs',
      'src/backend/main.ts',
      'src/backend/preload.ts',
      'assets/**/*.d.ts', // For declaration files like assets.d.ts
      '*.eslintrc.js', // Old eslint config if present
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off', // Often used with require
    },
  }
];
