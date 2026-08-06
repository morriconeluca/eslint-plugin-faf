import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';
import { setProjectRoot } from '#_rules@shared/_utils/_primitives/set-project-root/index.js';

import noDirectFragmentImport from './no-direct-fragment-import.rule.js';

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
            hierarchies: [['button'], ['card']],
            paths: ['src'],
          },
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

describe('no-direct-fragment-import', () => {
  beforeAll(() => {
    clearDirCache();
    seedDirCache(
      'src/button',
      ['index.ts', 'button.component.tsx', 'button.hook.ts'],
      []
    );
    seedDirCache('src/card', ['index.ts', 'card.component.tsx'], []);
    seedDirCache('src/_src@shared', [], ['_ui']);
    seedDirCache('src/_src@shared/_ui', [], ['_components']);
    seedDirCache('src/_src@shared/_ui/_components', [], ['button']);
    seedDirCache(
      'src/_src@shared/_ui/_components/button',
      ['index.ts', 'button.component.tsx'],
      []
    );
    seedDirCache(
      'src/example',
      ['index.ts', 'example.component.tsx', 'example.type.ts'],
      ['_components']
    );
    seedDirCache('src/example/_components', [], ['child']);
    seedDirCache(
      'src/example/_components/child',
      ['index.ts', 'child.component.tsx'],
      []
    );
    seedDirCache('src/_components', [], ['alpha', 'beta']);
    seedDirCache(
      'src/_components/alpha',
      ['index.ts', 'alpha.component.tsx'],
      []
    );
    seedDirCache(
      'src/_components/beta',
      ['index.ts', 'beta.component.tsx'],
      []
    );
  });

  ruleTester.run('no-direct-fragment-import', noDirectFragmentImport, {
    invalid: [
      {
        code: "import { Button } from '../button/button.component';",
        errors: [
          {
            message:
              'Direct import of Fragment internal file "button.component.tsx" is forbidden. You must import through its Access Node (index file) in "src/button".',
          },
        ],
        filename: 'src/card/card.component.tsx',
        settings,
      },
      {
        code: "import { Button } from '#/_src@shared/_ui/_components/button/button.component';",
        errors: [
          {
            message:
              'Direct import of Fragment internal file "button.component.tsx" is forbidden. You must import through its Access Node (index file) in "src/_src@shared/_ui/_components/button".',
          },
        ],
        filename: 'src/card/card.component.tsx',
        settings,
      },
      {
        code: "import { Alpha } from '../alpha/alpha.component';",
        errors: [
          {
            message:
              'Direct import of Fragment internal file "alpha.component.tsx" is forbidden. You must import through its Access Node (index file) in "src/_components/alpha".',
          },
        ],
        filename: 'src/_components/beta/beta.component.tsx',
        settings,
      },
      {
        code: "export { Button } from '../button/button.component';",
        errors: [
          {
            message:
              'Direct import of Fragment internal file "button.component.tsx" is forbidden. You must import through its Access Node (index file) in "src/button".',
          },
        ],
        filename: 'src/card/card.component.tsx',
        settings,
      },
      {
        code: "import type { Button } from '../button/button.component';",
        errors: [
          {
            message:
              'Direct import of Fragment internal file "button.component.tsx" is forbidden. You must import through its Access Node (index file) in "src/button".',
          },
        ],
        filename: 'src/card/card.component.tsx',
        settings,
      },
    ],
    valid: [
      // Import via directory (Access Node implicit)
      {
        code: "import { Button } from '../button';",
        filename: 'src/card/card.component.tsx',
        settings,
      },
      // Internal import between sibling Fragment Nodes
      {
        code: "import { helper } from './button.hook';",
        filename: 'src/button/button.component.tsx',
        settings,
      },
      // Import of Access Node via alias
      {
        code: "import { Button } from '#/_src@shared/_ui/_components/button';",
        filename: 'src/card/card.component.tsx',
        settings,
      },
      // Sub-Fragment imports parent Fragment Node
      {
        code: "import { ExampleType } from '../../example.type';",
        filename: 'src/example/_components/child/child.component.tsx',
        settings,
      },
      // Re-export from Access Node (directory)
      {
        code: "export * from '../button';",
        filename: 'src/card/card.component.tsx',
        settings,
      },
    ],
  });
});
