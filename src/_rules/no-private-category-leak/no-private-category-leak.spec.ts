import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';
import { setProjectRoot } from '#_rules@shared/_utils/_primitives/set-project-root/index.js';

import noPrivateCategoryLeak from './no-private-category-leak.rule.js';

// Bind Vitest globals to globalThis so RuleTester can find them
Object.assign(globalThis, { afterAll, beforeAll, describe, it });

setProjectRoot(process.cwd());

const settings = {
  faf: {
    aliases: {
      '#/_apis@shared': 'src/_src@shared/_network/_apis/_apis@shared',
      '#/_app@shared': 'src/app/_app@shared',
      '#/_components@shared': 'src/example/_components/_components@shared',
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

describe('no-private-category-leak', () => {
  beforeAll(() => {
    clearDirCache();
    seedDirCache(
      'src/example',
      ['index.ts', 'example.component.tsx'],
      ['_components', '_types']
    );
    seedDirCache('src/example/_types', ['example.type.ts'], []);
    seedDirCache(
      'src/example/_components',
      [],
      ['private-child', 'another-child', '_components@shared']
    );
    seedDirCache('src/example/_components/_components@shared', [], ['_types']);
    seedDirCache(
      'src/example/_components/_components@shared/_types',
      ['shared-helper.type.ts'],
      []
    );
    seedDirCache(
      'src/example/_components/private-child',
      ['index.ts', 'private-child.component.tsx', 'private-child.type.ts'],
      ['_utils']
    );
    seedDirCache(
      'src/example/_components/private-child/_utils',
      ['sub-helper.util.ts'],
      []
    );
    seedDirCache(
      'src/example/_components/another-child',
      ['index.ts', 'another-child.component.tsx'],
      []
    );
    seedDirCache('src/other', ['index.ts', 'other.component.tsx'], []);
    seedDirCache('src', ['main.tsx'], ['_types', 'app']);
    seedDirCache('src/_types', ['global.type.ts'], []);
    seedDirCache('src/app', ['app.tsx'], []);
  });

  ruleTester.run('no-private-category-leak', noPrivateCategoryLeak, {
    invalid: [
      {
        code: "import { Child } from '../example/_components/private-child';",
        errors: [
          {
            message:
              'Importing from Private Category is forbidden. The imported resource is private to "src/example".',
          },
        ],
        filename: 'src/other/other.component.tsx',
        settings,
      },
      {
        code: "import { Another } from '../another-child';",
        errors: [
          {
            message:
              'Importing from Private Category is forbidden. The imported resource is private to "src/example".',
          },
        ],
        filename:
          'src/example/_components/private-child/private-child.component.tsx',
        settings,
      },
      {
        code: "import { Util } from '../../_types/example.type';",
        errors: [
          {
            message:
              'Importing from Private Category is forbidden. The imported resource is private to "src/example".',
          },
        ],
        filename:
          'src/example/_components/private-child/private-child.component.tsx',
        settings,
      },
      {
        code: "import { Helper } from '#/_components@shared/_types/shared-helper.type';",
        errors: [
          {
            message:
              'Importing from Private Category is forbidden. The imported resource is private to "src/example".',
          },
        ],
        filename: 'src/other/other.component.tsx',
        settings,
      },
      {
        code: "import { SubHelper } from './_components/private-child/_utils/sub-helper.util';",
        errors: [
          {
            message:
              'Importing from Private Category is forbidden. The imported resource is private to "src/example/_components/private-child".',
          },
        ],
        filename: 'src/example/example.component.tsx',
        settings,
      },
    ],
    valid: [
      // Direct child of owner imports from Private Category
      {
        code: "import { Child } from './_components/private-child';",
        filename: 'src/example/example.component.tsx',
        settings,
      },
      // Internal import within same Sub-Fragment
      {
        code: "import { SomeType } from './private-child.type';",
        filename:
          'src/example/_components/private-child/private-child.component.tsx',
        settings,
      },
      // Fractal Branch inside Private Category
      {
        code: "import { Helper } from '#/_components@shared/_types/shared-helper.type';",
        filename:
          'src/example/_components/private-child/private-child.component.tsx',
        settings,
      },
      // Root Node importing from its own Private Category
      {
        code: "import { GlobalType } from './_types/global.type';",
        filename: 'src/main.tsx',
        settings,
      },
    ],
  });
});
