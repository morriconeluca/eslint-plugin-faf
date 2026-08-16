import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';
import { setProjectRoot } from '#_rules@shared/_utils/_primitives/set-project-root/index.js';

import enforceAccessNode from './enforce-access-node.rule.js';

// Bind Vitest globals to globalThis so RuleTester can find them
Object.assign(globalThis, { afterAll, beforeAll, describe, it });

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
    seedDirCache('src/bad-folder', ['bad-folder.component.tsx'], []);
    seedDirCache('src/_components', [], ['button', '_atoms']);
    seedDirCache('src/empty-frag', ['index.ts'], []);
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
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Fragment directory "bad-folder" is missing an Access Node (index.ts/index.js).',
          },
        ],
        filename: 'src/bad-folder/bad-folder.component.tsx',
        settings,
      },
      {
        code: 'export * from "./x";',
        errors: [
          {
            message:
              'Access Nodes ("index.ts/index.js") are exclusive to Fragments. Found index file directly inside "_components" (classified as category).',
          },
        ],
        filename: 'src/_components/index.ts',
        settings,
      },
      // index.ts in a Root Fragment, not prescribed as a Root Node
      {
        code: 'export default {};',
        errors: [
          {
            message:
              'Access Nodes ("index.ts/index.js") are exclusive to Fragments. Found index file directly inside "app" (classified as root-fragment).',
          },
        ],
        filename: 'src/app/index.ts',
        settings,
      },
      // Fragment with an Access Node but no Fragment Node establishing its Role
      {
        code: 'export default {};',
        errors: [
          {
            message:
              'Fragment "empty-frag" has no Master Node. Every Fragment must contain at least one Fragment Node establishing its Role.',
          },
        ],
        filename: 'src/empty-frag/index.ts',
        settings,
      },
    ],
    valid: [
      // Re-export of own Fragment Nodes
      {
        code: `
          export * from './button.component';
          export * from './button.hook';
        `,
        filename: 'src/button/index.ts',
        settings,
      },
      // Type-only re-export
      {
        code: "export type * from './button.hook';",
        filename: 'src/button/index.ts',
        settings,
      },
      // Self-import (./index) is filtered as special case
      {
        code: "import { X } from './index';",
        filename: 'src/button/index.ts',
        settings,
      },
      // Access Node inside Fragment
      {
        code: 'export default {}',
        filename: 'src/button/index.ts',
        settings,
      },
      // index.ts as a Root Node, explicitly prescribed by the architect
      {
        code: 'export default {};',
        filename: 'src/widget-root/index.ts',
        settings: {
          faf: {
            ...settings.faf,
            trees: settings.faf.trees.map((tree, index) => {
              if (index === 0) {
                return {
                  ...tree,
                  rootFragments: [
                    ...(tree.rootFragments || []),
                    {
                      paths: ['src/widget-root'],
                      rootNodes: [['index.ts']],
                    },
                  ],
                };
              }
              return tree;
            }),
          },
        },
      },
    ],
  });
});
