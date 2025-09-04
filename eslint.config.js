// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

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
  exports: 'writable',   // para handlers CJS que usam exports
  module: 'readonly',
  require: 'readonly',
  global: 'readonly',    // 👈 resolve “global is not defined”
};

export default [
  // Ignorar estáticos e build
  {
    ignores: ['node_modules/**', 'dist/**', 'public/**'],
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
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
    },
  },

  // Netlify Functions ESM (.js) — usa import/export
  {
    files: ['netlify/functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',   // 👈 resolve o parsing error do admin-create-consent-fields.js
      globals: nodeGlobals,
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-undef': 'error',
    },
  },

  // Netlify Functions CJS (.cjs) — CommonJS/Script
  {
    files: ['netlify/functions/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: nodeGlobals, // inclui 'global'
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Desliga no-empty nas CJS (há blocos intencionais vazios)
      'no-empty': 'off',
      'no-undef': 'error',
    },
  },
];

