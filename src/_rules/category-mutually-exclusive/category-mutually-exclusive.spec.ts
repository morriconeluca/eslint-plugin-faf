import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';
import { setProjectRoot } from '#_rules@shared/_utils/_primitives/set-project-root/index.js';

import categoryMutuallyExclusive from './category-mutually-exclusive.rule.js';

// Bind Vitest globals to globalThis so RuleTester can find them
Object.assign(globalThis, { afterAll, beforeAll, describe, it });

// Set project root
setProjectRoot(process.cwd());

const settings = {
  faf: {
    aliases: {
      '#/_apis@shared': 'src/_src@shared/_network/_apis/_apis@shared',
      '#/_app@shared': 'src/app/_app@shared',
      '#/_src@shared': 'src/_src@shared',
    },
    trees: [
      {
        categories: [
          { name: '_apis', role: 'api' },
          { name: '_boundaries', role: 'boundary' },
          { name: '_classes', role: 'class' },
          { name: '_components', role: 'component' },
          { allowSingleFiles: true, name: '_constants', role: 'constant' },
          { name: '_contexts', role: 'context' },
          { name: '_factories', role: 'factory' },
          { allowedExtensions: ['.ttf', '.woff', '.woff2'], name: '_fonts' },
          { name: '_hooks', role: 'hook' },
          {
            allowedExtensions: ['.png', '.jpg', '.jpeg', '.svg'],
            name: '_images',
          },
          { name: '_instances', role: 'instance' },
          { name: '_layouts', role: 'layout' },
          { allowSingleFiles: true, name: '_mixed', role: 'type' },
          { allowSingleFiles: true, name: '_mocks', role: 'mock' },
          { name: '_pages', role: 'page' },
          { name: '_recipes', role: 'recipe' },
          { name: '_routes', role: 'route' },
          { allowSingleFiles: true, name: '_schemas', role: 'schema' },
          { name: '_stores', role: 'store' },
          { allowedExtensions: ['.css'], name: '_styles' },
          { allowSingleFiles: true, name: '_types', role: 'type' },
          { name: '_utils', role: 'util' },
        ],
        excludes: ['src/configs'],
        globalHorizontalHierarchies: [
          [
            ['_atoms'],
            ['_molecules'],
            ['_organisms'],
            ['_templates'],
            ['_pages'],
          ],
        ],
        includes: ['src'],
        localHorizontalHierarchies: [
          {
            hierarchies: [['_domain'], ['_network', '_state', '_ui']],
            paths: ['src/_src@shared'],
          },
          {
            hierarchies: [
              ['_constants'],
              ['_types'],
              ['_utils'],
              ['_recipes'],
              ['_components'],
              ['_pages'],
            ],
            paths: ['src/_src@shared/_ui'],
          },
        ],
        roles: [
          ['constant'],
          ['schema'],
          ['type'],
          ['class'],
          ['config'],
          ['mock'],
          ['util'],
          ['style'],
          ['recipe'],
          ['factory'],
          ['instance'],
          ['hook'],
          ['api', 'component', 'context', 'layout', 'page', 'route', 'store'],
          ['index', 'spec', 'story'],
        ],
        rootFragments: [
          {
            paths: ['src'],
            rootNodes: [['main.css', 'app/app.tsx'], ['main.tsx']],
            subRootFragments: [
              {
                paths: ['src/app'],
                rootNodes: [['app.tsx']],
              },
            ],
          },
        ],
        routeHierarchies: [
          {
            paths: ['src/_apis'],
            role: 'api',
          },
        ],
      },
    ],
  },
};

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    parser: tsParser,
    sourceType: 'module',
  },
});

describe('category-mutually-exclusive', () => {
  beforeAll(() => {
    clearDirCache();
    seedDirCache('src/_components', [], ['button', 'card', '_atoms-bad']);
    seedDirCache('src/_components/_atoms-bad', ['icon.component.tsx'], []);
    seedDirCache('src/_components/button', ['index.ts'], []);
    seedDirCache('src/_components/card', ['index.ts'], []);
    seedDirCache('src/_types', ['user.type.ts', 'api.type.ts'], []);
    seedDirCache('src/_mixed', ['direct-file.type.ts'], ['sub-fragment']);
    seedDirCache('src/_mixed/sub-fragment', ['index.ts'], []);
    seedDirCache('src/_utils', ['helper.util.ts'], []);
    seedDirCache('src/_styles', ['theme.css'], []);
  });

  ruleTester.run('category-mutually-exclusive', categoryMutuallyExclusive, {
    invalid: [
      {
        code: 'export type Direct = string;',
        errors: [
          {
            message:
              'Mutua Esclusività violation in Category "_mixed": cannot mix single files (direct-file.type.ts) and Fragment directories (sub-fragment).',
          },
        ],
        filename: 'src/_mixed/direct-file.type.ts',
        settings,
      },
      {
        code: 'export const add = (a: number, b: number) => a + b;',
        errors: [
          {
            message:
              'Category "_utils" cannot contain file nodes directly. File "helper.util.ts" must be encapsulated inside a Fragment.',
          },
        ],
        filename: 'src/_utils/helper.util.ts',
        settings,
      },
      {
        code: 'export const Icon = () => null;',
        errors: [
          {
            message:
              'Category "_atoms-bad" cannot contain file nodes directly. File "icon.component.tsx" must be encapsulated inside a Fragment.',
          },
        ],
        filename: 'src/_components/_atoms-bad/icon.component.tsx',
        settings,
      },
    ],
    valid: [
      {
        code: 'export type User = { name: string };',
        filename: 'src/_types/user.type.ts',
        settings,
      },
      {
        code: 'export default {}',
        filename: 'src/_components/button/index.ts',
        settings,
      },
      {
        code: '/* CSS */',
        filename: 'src/_styles/theme.css',
        settings,
      },
    ],
  });
});
