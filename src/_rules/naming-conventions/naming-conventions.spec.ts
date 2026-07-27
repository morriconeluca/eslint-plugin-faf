import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';
import { setProjectRoot } from '#_rules@shared/_utils/_primitives/set-project-root/index.js';

import namingConventions from './naming-conventions.rule.js';

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

describe('naming-conventions', () => {
  beforeAll(() => {
    clearDirCache();
    seedDirCache(
      'src/button',
      ['index.ts', 'button.component.tsx', 'button.hook.ts'],
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
    seedDirCache('src/utils', ['helper.util.ts'], []);
    seedDirCache('src/_button', ['index.ts', '_button.component.tsx'], []);
    seedDirCache('src/_styles', ['theme.css', 'theme-bad.ts'], []);
    seedDirCache('src/_types', ['user.type.ts', 'user-bad.util.ts'], []);
    // Seeds for parent-child relationship constraints
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
  });

  ruleTester.run('naming-conventions', namingConventions, {
    invalid: [
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Fragment Node "wrong.component.tsx" must share the parent Fragment name: "button.<role>.tsx".',
          },
        ],
        filename: 'src/button/wrong.component.tsx',
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
              'Folder name "_myFolder" must be in kebab-case (e.g. "_my-folder" or "_[my-param]").',
          },
          {
            message:
              'Layers cannot contain files directly. File "x.type.ts" is placed directly inside Layer "_myFolder".',
          },
        ],
        filename: 'src/_myFolder/x.type.ts',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Folder name "myFolder" must be in kebab-case (e.g. "_my-folder" or "_[my-param]").',
          },
        ],
        filename: 'src/myFolder/myFolder.component.tsx',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Layer/Category directory "components" must be prefixed with an underscore (e.g. "_components").',
          },
        ],
        filename: 'src/components/button/button.component.tsx',
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
        code: 'export const getLead = () => null;',
        errors: [
          {
            message:
              'Folder name "_[lead_id]" must be in kebab-case (e.g. "_my-folder" or "_[my-param]").',
          },
        ],
        filename: 'src/_apis/_[lead_id]/get-lead/get-lead.api.ts',
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
        code: 'export const add = (a: number, b: number) => a + b;',
        errors: [
          {
            message:
              'Layer/Category directory "utils" must be prefixed with an underscore (e.g. "_utils").',
          },
        ],
        filename: 'src/utils/helper.util.ts',
        settings,
      },
      {
        code: 'export const Button = () => null;',
        errors: [
          {
            message:
              'Directory "_button" has an Access Node (index.ts) but its name starts with "_". Fragments must not be prefixed with underscore.',
          },
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
              'File extension ".ts" is not allowed in Category "_styles". Allowed extensions: .css.',
          },
        ],
        filename: 'src/_styles/theme-bad.ts',
        settings,
      },
      {
        code: 'export const X = 1;',
        errors: [
          {
            message:
              'Role "util" for file "user-bad.util.ts" does not match the expected Category role "type".',
          },
        ],
        filename: 'src/_types/user-bad.util.ts',
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
              'Folder name "_src@shared@shared" must be in kebab-case (e.g. "_my-folder" or "_[my-param]").',
          },
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
      {
        code: 'export const Button = () => null;',
        filename: 'src/button/button.component.tsx',
        settings,
      },
      {
        code: 'export default {}',
        filename: 'src/button/index.ts',
        settings,
      },
      {
        code: 'export const main = 1;',
        filename: 'src/main.tsx',
        settings,
      },
      {
        code: 'export const getProfile = () => null;',
        filename: 'src/_apis/_me/get-profile/get-profile.api.ts',
        settings,
      },
      {
        code: 'export const getLead = () => null;',
        filename: 'src/_apis/_[lead-id]/get-lead/get-lead.api.ts',
        settings,
      },
      {
        code: 'export type Mutate = string;',
        filename: 'src/_apis/_apis@shared/_types/mutate.type.ts',
        settings,
      },
      {
        code: 'export type MyType = string;',
        filename: 'src/_components/button/button.type.ts',
        settings,
      },
      {
        code: 'export const Icon = () => null;',
        filename: 'src/_components/_atoms/icon/icon.component.tsx',
        settings,
      },
      {
        code: 'export default {}',
        filename: 'src/configs/vitest-setup.ts',
        settings,
      },
      {
        code: '/* styles block */',
        filename: 'src/_styles/theme.css',
        settings,
      },
      {
        code: 'export type User = { id: string };',
        filename: 'src/_types/user.type.ts',
        settings,
      },
    ],
  });
});
