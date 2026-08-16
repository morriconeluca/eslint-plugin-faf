import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';
import { setProjectRoot } from '#_rules@shared/_utils/_primitives/set-project-root/index.js';

import logicalDomainPlacement from './logical-domain-placement.rule.js';

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

describe('logical-domain-placement', () => {
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

  ruleTester.run('logical-domain-placement', logicalDomainPlacement, {
    invalid: [
      {
        code: 'export type X = string;',
        errors: [
          {
            message:
              'Layers cannot contain files directly. File "x.type.ts" is placed directly inside Layer "_component".',
          },
        ],
        filename: 'src/_component/x.type.ts',
        settings,
      },
      {
        code: 'export type X = string;',
        errors: [
          {
            message:
              'Layers cannot contain files directly. File "x.type.ts" is placed directly inside Layer "_myFolder".',
          },
        ],
        filename: 'src/_myFolder/x.type.ts',
        settings,
      },
      {
        code: 'export const Button = () => null;',
        errors: [
          {
            message:
              'Fragment directory "button" cannot be placed directly inside Layer "_ui". Fragments must be contained within a Category.',
          },
        ],
        filename: 'src/_ui/button/button.component.tsx',
        settings,
      },
      {
        code: 'export const x = 1;',
        errors: [
          {
            message:
              'Layers cannot contain files directly. File "direct-file.ts" is placed directly inside Layer "_ui".',
          },
        ],
        filename: 'src/_ui/direct-file.ts',
        settings,
      },
      {
        code: 'export const Button = () => null;',
        errors: [
          {
            message:
              'Layers cannot contain files directly. File "_button.component.tsx" is placed directly inside Layer "_button".',
          },
        ],
        filename: 'src/_button/_button.component.tsx',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Fragment directory "sub-frag" cannot be placed directly inside Fragment "button". Sub-Fragments must be contained within a Private Category.',
          },
        ],
        filename: 'src/_components/button/sub-frag/sub-frag.component.tsx',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Fragment directory "direct-frag" cannot be placed directly inside Fractal Branch "_src@shared". Fragments must be contained within a Category.',
          },
        ],
        filename: 'src/_src@shared/direct-frag/direct-frag.component.tsx',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Fragment directory "direct-frag" cannot be placed directly inside Root Fragment "app". Fragments must be contained within a Category.',
          },
        ],
        filename: 'src/app/direct-frag/direct-frag.component.tsx',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Fragment directory "child" cannot be placed directly inside Layer "_my-layer". Fragments must be contained within a Category.',
          },
          {
            message:
              'Layer directory "_my-layer" cannot be placed inside "button" (classified as fragment). Layers cannot reside within Fragments.',
          },
        ],
        filename: 'src/_components/button/_my-layer/child/child.component.tsx',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Fractal Branch "_src@shared@shared" cannot be placed inside another Fractal Branch "_src@shared".',
          },
          {
            message:
              'Fractal Branches cannot contain files directly. File "some.type.ts" is placed directly inside Fractal Branch "_src@shared@shared".',
          },
        ],
        filename: 'src/_src@shared/_src@shared@shared/some.type.ts',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Root Fragment directory "my-root" must be placed directly inside a Root Container or another Root Fragment, not inside "_components" (classified as category).',
          },
        ],
        filename: 'src/_components/my-root/page.tsx',
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
                      paths: ['src/_components/my-root'],
                      rootNodes: [['page.tsx']],
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
    valid: [
      // Fragment inside Sub-Category
      {
        code: 'export const Icon = () => null;',
        filename: 'src/_components/_atoms/icon/icon.component.tsx',
        settings,
      },
    ],
  });
});
