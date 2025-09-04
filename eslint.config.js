// eslint.config.js — ESLint 9 (flat config)
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Ignora pastas/arquivos estáticos e build
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'public/**',              // 👈 ignora admin scripts estáticos
    ],
  },

  js.configs.recommended,

  // Frontend (browser + React)
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      // Globais do browser para evitar "no-undef"
      globals: {
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
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Diminui ruído por ora; podemos apertar depois
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Netlify Functions (Node 18+, arquivos js/cjs/mjs)
  {
    files: ['netlify/functions/**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      // Para .cjs o ideal é 'script'; para .mjs/js que usam import/export, pode ser 'module'.
      // Espreita ambos corretamente.
      sourceType: 'script',
      globals: {
        // Node globals
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortController: 'readonly',
        fetch: 'readonly', // disponível em Node 18+
        Response: 'readonly',
        exports: 'writable', // usado em alguns handlers cjs
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Functions rodam em Node, então tudo bem usar console/process.
      'no-undef': 'error',
    },
  },
];
