import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';
import { setProjectRoot } from '#_rules@shared/_utils/_primitives/set-project-root/index.js';

import fragmentMasterNode from './fragment-master-node.rule.js';

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

describe('fragment-master-node', () => {
  beforeAll(() => {
    clearDirCache();
    seedDirCache(
      'src/button',
      ['index.ts', 'button.component.tsx', 'button.hook.ts', 'button.css'],
      []
    );
    seedDirCache('src/empty-frag', ['index.ts'], []);
    seedDirCache(
      'src/duo',
      ['index.ts', 'duo.component.tsx', 'duo.component.jsx'],
      []
    );
    seedDirCache('src/_components', [], ['button', '_atoms']);
    seedDirCache('src/_components/_atoms', [], ['icon']);
    seedDirCache(
      'src/_components/_atoms/icon',
      ['index.ts', 'icon.component.tsx'],
      []
    );
    seedDirCache(
      'src/_components/button',
      ['index.ts', 'button.type.ts', 'button.component.tsx'],
      []
    );
    seedDirCache('src/_utils', [], ['button']);
    seedDirCache('src/_utils/button', ['index.ts', 'button.component.tsx'], []);
    seedDirCache('src/bad-folder', ['bad-folder.component.tsx'], []);
    seedDirCache('src/_ui', [], ['_components', 'button']);
    seedDirCache('src/_ui/button', ['index.ts', 'button.component.tsx'], []);
    seedDirCache('src/_component', ['x.type.ts'], []);
    seedDirCache('src/_myFolder', ['x.type.ts'], []);
    seedDirCache('src/myFolder', ['index.ts', 'myFolder.component.tsx'], []);
    seedDirCache('src/components', [], ['button']);
    seedDirCache(
      'src/components/button',
      ['index.ts', 'button.component.tsx'],
      []
    );
    seedDirCache(
      'src/_apis',
      [],
      ['_me', '_[lead-id]', '_[lead_id]', '_apis@shared']
    );
    seedDirCache('src/_apis/_me', [], ['get-profile', 'get-profile-bad']);
    seedDirCache(
      'src/_apis/_me/get-profile',
      ['index.ts', 'get-profile.api.ts'],
      []
    );
    seedDirCache(
      'src/_apis/_me/get-profile-bad',
      ['index.ts', 'get-profile-bad.component.tsx'],
      []
    );
    seedDirCache('src/_apis/_[lead-id]', [], ['get-lead']);
    seedDirCache(
      'src/_apis/_[lead-id]/get-lead',
      ['index.ts', 'get-lead.api.ts'],
      []
    );
    seedDirCache('src/_apis/_[lead_id]', [], ['get-lead']);
    seedDirCache(
      'src/_apis/_[lead_id]/get-lead',
      ['index.ts', 'get-lead.api.ts'],
      []
    );
    seedDirCache('src/_apis/_apis@shared', [], ['_types']);
    seedDirCache('src/_apis/_apis@shared/_types', ['mutate.type.ts'], []);
    seedDirCache('src/_apis/fetch-todo', ['index.ts', 'fetch-todo.api.ts'], []);
    seedDirCache('src/_apis/GET-todo', ['index.ts', 'GET-todo.api.ts'], []);
    seedDirCache('src/utils', ['helper.util.ts'], []);
    seedDirCache('src/_button', ['index.ts', '_button.component.tsx'], []);
    seedDirCache('src/_styles', ['theme.css', 'theme-bad.ts'], []);
    seedDirCache(
      'src/_types',
      ['user.type.ts', 'user-bad.util.ts', 'setting.util.type.ts'],
      []
    );
    seedDirCache(
      'src/_components/button/sub-frag',
      ['index.ts', 'sub-frag.component.tsx'],
      []
    );
    seedDirCache(
      'src/_src@shared/direct-frag',
      ['index.ts', 'direct-frag.component.tsx'],
      []
    );
    seedDirCache(
      'src/app/direct-frag',
      ['index.ts', 'direct-frag.component.tsx'],
      []
    );
    seedDirCache('src/_components/button/_my-layer', [], ['child']);
    seedDirCache(
      'src/_components/button/_my-layer/child',
      ['index.ts', 'child.component.tsx'],
      []
    );
    seedDirCache('src/_src@shared/_src@shared@shared', ['some.type.ts'], []);
    seedDirCache('src/_components/my-root', ['page.tsx'], []);
    seedDirCache(
      'src/widget',
      ['index.ts', 'widget.component.tsx', 'helpers.ts'],
      []
    );
    seedDirCache('src/_hooks', [], ['_wrong@shared']);
    seedDirCache('src/_hooks/_wrong@shared', [], ['_types']);
    seedDirCache('src/_hooks/_wrong@shared/_types', ['helper.type.ts'], []);
    seedDirCache(
      'src/dialog',
      [
        'index.ts',
        'dialog.component.tsx',
        'dialog.spec.tsx',
        'dialog.story.tsx',
      ],
      []
    );
    seedDirCache(
      'src/pagination',
      [
        'index.ts',
        'pagination.component.tsx',
        'pagination.util.spec.ts',
        'pagination.util.type.spec.ts',
      ],
      []
    );
  });

  ruleTester.run('fragment-master-node', fragmentMasterNode, {
    invalid: [
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Fragment Node "wrong.component.tsx" must share the parent Fragment name: "button.<role>.tsx".',
          },
          {
            message:
              'Fragment Node "wrong.component.tsx" shares Role "component" with sibling "button.component.tsx". Each Fragment Node must have a unique Role within its Fragment.',
          },
        ],
        filename: 'src/button/wrong.component.tsx',
        settings,
      },
      {
        code: 'export const getProfile = () => null;',
        errors: [
          {
            message:
              'Route terminal Fragment "get-profile-bad" must contain a Master Node with role "api" (e.g. "get-profile-bad.api.ts").',
          },
        ],
        filename: 'src/_apis/_me/get-profile-bad/get-profile-bad.component.tsx',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Fragment "button" inside Category "_utils" must contain a Master Node with role "util" (e.g. "button.util.ts").',
          },
        ],
        filename: 'src/_utils/button/button.component.tsx',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Fragment Node "helpers.ts" must share the parent Fragment name: "widget.<role>.ts".',
          },
          {
            message:
              'File "helpers.ts" inside Fragment "widget" must have an explicit role suffix (e.g. "widget.style.ts").',
          },
        ],
        filename: 'src/widget/helpers.ts',
        settings,
      },
      // Real asset (no code extension) inside a Fragment must still carry an explicit role suffix
      {
        code: '/* styles */',
        errors: [
          {
            message:
              'File "button.css" inside Fragment "button" must have an explicit role suffix (e.g. "button.style.css").',
          },
        ],
        filename: 'src/button/button.css',
        settings,
      },
      // Two Fragment Nodes sharing the same Role in the same Fragment
      {
        code: 'export const Duo = () => null;',
        errors: [
          {
            message:
              'Fragment Node "duo.component.tsx" shares Role "component" with sibling "duo.component.jsx". Each Fragment Node must have a unique Role within its Fragment.',
          },
        ],
        filename: 'src/duo/duo.component.tsx',
        settings,
      },
      // Route terminal Fragment with an unrecognized HTTP method
      {
        code: 'export const fetchTodo = () => null;',
        errors: [
          {
            message:
              'Route terminal Fragment "fetch-todo" must follow the "<method>-<object>" pattern with a lowercase HTTP method (connect, delete, get, head, options, patch, post, put, trace).',
          },
        ],
        filename: 'src/_apis/fetch-todo/fetch-todo.api.ts',
        settings,
      },
      // Route terminal Fragment with an uppercase HTTP method
      {
        code: 'export const getTodo = () => null;',
        errors: [
          {
            message:
              'Route terminal Fragment "GET-todo" must follow the "<method>-<object>" pattern with a lowercase HTTP method (connect, delete, get, head, options, patch, post, put, trace).',
          },
        ],
        filename: 'src/_apis/GET-todo/GET-todo.api.ts',
        settings,
      },
    ],
    valid: [
      // Fragment Node shares parent Fragment name
      {
        code: 'export const Button = () => null;',
        filename: 'src/button/button.component.tsx',
        settings,
      },
      // Root Node in Root Fragment
      {
        code: 'export const main = 1;',
        filename: 'src/main.tsx',
        settings,
      },
      // Route terminal Fragment with correct Master Node role
      {
        code: 'export const getProfile = () => null;',
        filename: 'src/_apis/_me/get-profile/get-profile.api.ts',
        settings,
      },
      // Fragment Node with explicit role inside Category
      {
        code: 'export type MyType = string;',
        filename: 'src/_components/button/button.type.ts',
        settings,
      },
      // .spec.tsx as valid Fragment Node
      {
        code: 'export const test = 1;',
        filename: 'src/dialog/dialog.spec.tsx',
        settings,
      },
      // .story.tsx as valid Fragment Node
      {
        code: 'export const story = 1;',
        filename: 'src/dialog/dialog.story.tsx',
        settings,
      },
    ],
  });
});
