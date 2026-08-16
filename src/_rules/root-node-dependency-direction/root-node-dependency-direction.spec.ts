import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';
import { setProjectRoot } from '#_rules@shared/_utils/_primitives/set-project-root/index.js';

import rootNodeDependencyDirection from './root-node-dependency-direction.rule.js';

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
            hierarchies: [['_types'], ['_classes'], ['_utils'], ['_apis']],
            paths: ['src/_src@shared/_network'],
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
          {
            hierarchies: [['_enums'], ['_dtos']],
            paths: ['src/_src@shared/_ui/_schemas'],
          },
          {
            hierarchies: [['_primitives'], ['_compounds']],
            paths: ['src/_src@shared/_ui/_schemas/_dtos'],
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
                rootNodes: [
                  ['app.tsx'],
                  ['cart/cart.tsx'],
                  ['checkout/checkout.tsx'],
                ],
                subRootFragments: [
                  {
                    paths: ['src/app/about'],
                    rootNodes: [['page.tsx']],
                  },
                  {
                    paths: ['src/app/contact'],
                    rootNodes: [['page.tsx']],
                  },
                  {
                    paths: ['src/app/foo'],
                    rootNodes: [['x.ts']],
                  },
                  {
                    paths: ['src/app/bar'],
                    rootNodes: [['y.ts']],
                  },
                  {
                    paths: ['src/app/help'],
                    rootNodes: [['help.util.ts']],
                  },
                  {
                    paths: ['src/app/support'],
                    rootNodes: [['support.util.ts']],
                  },
                  {
                    paths: ['src/app/cart'],
                    rootNodes: [['cart.tsx']],
                  },
                  {
                    paths: ['src/app/checkout'],
                    rootNodes: [['checkout.tsx']],
                  },
                ],
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

describe('root-node-dependency-direction', () => {
  beforeAll(() => {
    clearDirCache();
    seedDirCache(
      'src/app',
      ['app.tsx'],
      ['about', 'contact', 'foo', 'bar', 'help', 'support', 'cart', 'checkout']
    );
    seedDirCache('src/app/about', ['page.tsx'], []);
    seedDirCache('src/app/contact', ['page.tsx'], []);
    seedDirCache('src/app/foo', ['x.ts'], []);
    seedDirCache('src/app/bar', ['y.ts'], []);
    seedDirCache('src/app/help', ['help.util.ts'], []);
    seedDirCache('src/app/support', ['support.util.ts'], []);
    seedDirCache('src/app/cart', ['cart.tsx'], []);
    seedDirCache('src/app/checkout', ['checkout.tsx'], []);
    seedDirCache('src/configs', ['vitest-setup.ts', 'jest-setup.ts'], []);
    seedDirCache(
      'src',
      ['main.tsx', 'main.css'],
      ['_src@shared', 'app', 'button', 'configs']
    );
    seedDirCache('src/_src@shared', [], ['_network', '_ui']);
    seedDirCache('src/_src@shared/_ui', [], ['_components']);
    seedDirCache('src/_src@shared/_ui/_components', [], ['button']);
    seedDirCache(
      'src/_src@shared/_ui/_components/button',
      ['index.ts', 'button.component.tsx'],
      []
    );
  });

  ruleTester.run(
    'root-node-dependency-direction',
    rootNodeDependencyDirection,
    {
      invalid: [
        {
          code: "import { Contact } from '../contact/page';",
          errors: [
            {
              message:
                'Root Node import violation: "src/app/about/page.tsx" cannot import from "src/app/contact/page.tsx" because no "rootNodes" relationship is configured under Root Fragment "src/app". Relationships between Root Nodes must always be explicitly authorized by the architect.',
            },
          ],
          filename: 'src/app/about/page.tsx',
          settings,
        },
        {
          code: "import { Y } from '../bar/y';",
          errors: [
            {
              message:
                'Root Node import violation: "src/app/foo/x.ts" cannot import from "src/app/bar/y.ts" because no "rootNodes" relationship is configured under Root Fragment "src/app". Relationships between Root Nodes must always be explicitly authorized by the architect.',
            },
          ],
          filename: 'src/app/foo/x.ts',
          settings,
        },
        // Root Fragment whose Root Node name coincidentally matches a recognized Role: the
        // Role-fallback must never apply to Root Nodes, even when the name happens to align
        {
          code: "import { Support } from '../support/support.util';",
          errors: [
            {
              message:
                'Root Node import violation: "src/app/help/help.util.ts" cannot import from "src/app/support/support.util.ts" because no "rootNodes" relationship is configured under Root Fragment "src/app". Relationships between Root Nodes must always be explicitly authorized by the architect.',
            },
          ],
          filename: 'src/app/help/help.util.ts',
          settings,
        },
        {
          code: "import { main } from '../main';",
          errors: [
            {
              message:
                'Root Node import violation: "app.tsx" cannot import from "main.tsx" under Root Fragment "src".',
            },
          ],
          filename: 'src/app/app.tsx',
          settings,
        },
        // Explicit rootNodes relationship at the common ancestor: reverse of the authorized order
        {
          code: "import { Checkout } from '../checkout/checkout';",
          errors: [
            {
              message:
                'Root Node import violation: "cart.tsx" cannot import from "checkout.tsx" under Root Fragment "src/app".',
            },
          ],
          filename: 'src/app/cart/cart.tsx',
          settings,
        },
      ],
      valid: [
        // Root Node import in valid order (main.tsx at level 1 imports main.css at level 0)
        {
          code: "import './main.css';",
          filename: 'src/main.tsx',
          settings,
        },
        // Explicit rootNodes relationship authorizes order between sibling Root Fragments
        {
          code: "import { Cart } from '../cart/cart';",
          filename: 'src/app/checkout/checkout.tsx',
          settings,
        },
      ],
    }
  );
});
