import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';
import { setProjectRoot } from '#_rules@shared/_utils/_primitives/set-project-root/index.js';

import enforceAccessNode from './enforce-access-node.rule.js';

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

describe('enforce-access-node', () => {
  beforeAll(() => {
    clearDirCache();
    seedDirCache(
      'src/button',
      ['index.ts', 'button.component.tsx', 'button.hook.ts'],
      []
    );
  });

  ruleTester.run('enforce-access-node', enforceAccessNode, {
    invalid: [
      {
        code: "import { something } from '../other';",
        errors: [
          {
            message:
              'Access Node (index file) can only import or export its own sibling Fragment Nodes using simple relative paths (e.g. "./example.component"). Got "../other".',
          },
        ],
        filename: 'src/button/index.ts',
        settings,
      },
      {
        code: "import React from 'react';",
        errors: [
          {
            message:
              'Access Node (index file) can only import or export its own sibling Fragment Nodes using simple relative paths (e.g. "./example.component"). Got "react".',
          },
        ],
        filename: 'src/button/index.ts',
        settings,
      },
      {
        code: "import { something } from './_components/child';",
        errors: [
          {
            message:
              'Access Node (index file) can only import or export its own sibling Fragment Nodes using simple relative paths (e.g. "./example.component"). Got "./_components/child".',
          },
        ],
        filename: 'src/button/index.ts',
        settings,
      },
      {
        code: "export * from './unrelated-file';",
        errors: [
          {
            message:
              'Access Node (index file) can only re-export its own Fragment Nodes (names starting with "button."). Got "unrelated-file".',
          },
        ],
        filename: 'src/button/index.ts',
        settings,
      },
      {
        code: "export * from './other.component';",
        errors: [
          {
            message:
              'Access Node (index file) can only re-export its own Fragment Nodes (names starting with "button."). Got "other.component".',
          },
        ],
        filename: 'src/button/index.ts',
        settings,
      },
    ],
    valid: [
      {
        code: `
          export * from './button.component';
          export * from './button.hook';
        `,
        filename: 'src/button/index.ts',
        settings,
      },
    ],
  });
});
