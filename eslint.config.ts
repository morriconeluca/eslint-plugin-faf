import js from '@eslint/js';
import { importX } from 'eslint-plugin-import-x';
import { configs as perfectionistConfigs } from 'eslint-plugin-perfectionist';
import { defineConfig, globalIgnores } from 'eslint/config';
import { configs as tseslintConfigs } from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', 'tmp/**']),
  js.configs.recommended,
  ...tseslintConfigs.recommendedTypeChecked,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  perfectionistConfigs['recommended-natural'],
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'import-x/no-absolute-path': 'error',
      'import-x/no-cycle': [
        'error',
        {
          ignoreExternal: true,
          maxDepth: 22,
        },
      ],
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
    },
  },
]);
