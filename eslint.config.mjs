// eslint.config.mjs
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  history: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  AbortController: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  IntersectionObserver: 'readonly',
  MutationObserver: 'readonly',
  crypto: 'readonly',
  alert: 'readonly',
};

const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  AbortController: 'readonly',
  fetch: 'readonly',     // Node 18+
  Response: 'readonly',
  exports: 'writable',   // p/ CJS
  module: 'readonly',
  require: 'readonly',
  global: 'readonly',
};

export default [
  // Ignorar build/artefatos
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'public/**',
      '.netlify/**',
      '**/functions-serve/**',
      '**/chunks/**',
    ],
  },

  js.configs.recommended,

  // Frontend React (browser)
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: browserGlobals,
    },
    plugins: { react, 'react-hooks': reactHooks, 'unused-imports': unusedImports },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': 'off',

      // Remove imports não usados automaticamente no --fix
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['warn', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],

      'no-undef': 'error',
    },
  },

  // Netlify Functions ESM (.js)
  {
    files: ['netlify/functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: nodeGlobals,
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-undef': 'error',
    },
  },

  // Netlify Functions CJS (.cjs)
  {
    files: ['netlify/functions/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: nodeGlobals,
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': 'off',
      'no-undef': 'error',
    },
  },
];

