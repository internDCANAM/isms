import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import security from 'eslint-plugin-security';
import globals from 'globals';

export default defineConfig(
  {ignores: ['**/dist/**', '**/node_modules/**', 'prisma/generated/**']},
  {
  files: ['**/*.{ts,tsx}'],
  plugins: {'@stylistic': stylistic},
  extends: [...tseslint.configs.recommendedTypeChecked],
  languageOptions: {parserOptions: {projectService: true, tsconfigRootDir: import.meta.dirname}},
  rules: {
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-deprecated': 'error',
    '@stylistic/semi':   ['error', 'always'],
    '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
    '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
    '@stylistic/comma-dangle': ['error', {
      arrays:    'ignore',
      objects:   'ignore',
      imports:   'ignore',
      exports:   'ignore',
      functions: 'never', }],
    '@stylistic/object-curly-spacing': ['error', 'never', {
      overrides: { TSTypeLiteral: 'always', TSInterfaceBody: 'always', TSEnumBody: 'always' } }],
    '@stylistic/arrow-parens': ['error', 'always'],
    '@stylistic/object-curly-newline': ['error', { ImportDeclaration: 'never' }],
    '@stylistic/max-len': ['error', {
      code: 100,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true }],
  },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/entry.tsx'],
    extends: [reactPlugin.configs.flat.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off' }
  },
  {
    files: ['src/{routes,http,lib,api,store,bankid,services}/**/*.ts', 'src/{main,domain}.ts', 'prisma.config.ts'],
    extends: [security.configs.recommended],
    languageOptions: { globals: globals.node },
    rules: {
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off' },
  },
);
