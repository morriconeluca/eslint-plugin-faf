import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, beforeAll, describe, it } from 'vitest';

import {
  clearDirCache,
  seedDirCache,
  setProjectRoot,
} from '#_rules@shared/_utils/context/index.js';

import noPeerDependency from './no-peer-dependency.rule.js';

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

describe('no-peer-dependency', () => {
  beforeAll(() => {
    clearDirCache();
    seedDirCache(
      'src/button',
      ['index.ts', 'button.component.tsx', 'button.hook.ts', 'button.type.ts'],
      []
    );
    seedDirCache('src/_src@shared/_ui', [], ['_components', '_utils']);
    seedDirCache('src/_src@shared/_ui/_components', [], ['button']);
    seedDirCache(
      'src/_src@shared/_ui/_components/button',
      ['index.ts', 'button.component.tsx'],
      []
    );
    seedDirCache('src/_src@shared/_ui/_utils', [], ['format']);
    seedDirCache(
      'src/_src@shared/_ui/_utils/format',
      ['index.ts', 'format.util.ts'],
      []
    );
    seedDirCache('src/app', [], ['about', 'contact', 'foo', 'bar']);
    seedDirCache('src/app/about', ['index.ts', 'about.route.ts'], []);
    seedDirCache('src/app/contact', ['index.ts', 'contact.route.ts'], []);
    seedDirCache('src/app/foo', ['x.ts'], []);
    seedDirCache('src/app/bar', ['y.ts'], []);
    seedDirCache('src/configs', ['vitest-setup.ts'], []);
  });

  ruleTester.run('no-peer-dependency', noPeerDependency, {
    invalid: [
      {
        code: "import { Button } from './button.component';",
        errors: [
          {
            message:
              'Sibling import violation: "button.hook.ts" (role "hook", level 11) cannot import from "button.component.tsx" (role "component", level 12). Imports must flow from lower to higher levels.',
          },
        ],
        filename: 'src/button/button.hook.ts',
        settings,
      },
      {
        code: "import { Button } from '../../_components/button';",
        errors: [
          {
            message:
              'Horizontal hierarchy violation: "_utils" cannot import from "_components" under parent "src/_src@shared/_ui".',
          },
        ],
        filename: 'src/_src@shared/_ui/_utils/format/format.util.ts',
        settings,
      },
      {
        code: "import { Button } from './index';",
        errors: [
          {
            message:
              'Sibling import violation: "button.component.tsx" (role "component", level 12) cannot import from "index.ts" (role "index", level 13). Imports must flow from lower to higher levels.',
          },
        ],
        filename: 'src/button/button.component.tsx',
        settings,
      },
      {
        code: "import { Contact } from '../contact';",
        errors: [
          {
            message:
              'Horizontal hierarchy violation (fallback to roles): sibling directory "about" (mapped to role "route", level 12) cannot import from "contact" (mapped to role "route", level 12) under parent "src/app".',
          },
        ],
        filename: 'src/app/about/about.route.ts',
        settings,
      },
      {
        code: "import { Y } from '../bar/y';",
        errors: [
          {
            message:
              'Peer separation violation: sibling directories "foo" and "bar" cannot import each other because no horizontal hierarchy is defined under parent "src/app".',
          },
        ],
        filename: 'src/app/foo/x.ts',
        settings,
      },
      {
        code: "import { setup } from '../configs/vitest-setup';",
        errors: [
          {
            message:
              'Importing from Foreign Domain "src/configs/vitest-setup.ts" is forbidden for Logical Nodes.',
          },
        ],
        filename: 'src/button/button.component.tsx',
        settings,
      },
      {
        code: "import { Button } from '../_src@shared/_ui/_components/button';",
        errors: [
          {
            message:
              'Foreign Domain files cannot import Logical Nodes from FAF tree ("src/_src@shared/_ui/_components/button/index.ts").',
          },
        ],
        filename: 'src/configs/vitest-setup.ts',
        settings,
      },
    ],
    valid: [
      {
        code: "import { useSomething } from './button.hook';",
        filename: 'src/button/button.component.tsx',
        settings,
      },
      {
        code: "import { format } from '../../_utils/format';",
        filename: 'src/_src@shared/_ui/_components/button/button.component.tsx',
        settings,
      },
    ],
  });
});
