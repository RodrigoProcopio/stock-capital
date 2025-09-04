// eslint.config.js (ESLint 9 - flat config)
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Arquivos/pastas ignorados (substitui .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'public/admin/decap-cms-*.js'
    ],
  },

  // Regras base do JS
  js.configs.recommended,

  // Regras para arquivos do app
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
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
      // React 17+ (Vite) não precisa de import React no topo
      'react/react-in-jsx-scope': 'off',
      // Evitar barulho se você não usa PropTypes
      'react/prop-types': 'off',
      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
