import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventory } from '../../../../_conformity@shared/_types/verification-model.type.js';

import { includeExternalTargets } from './include-external-targets.util.js';

const emptyInventory: TInventory = {
  items: [],
  pathToId: new Map(),
  realPathToId: new Map(),
};

describe('includeExternalTargets', () => {
  it('adds an existing external dependency target that the tree scan omitted', async () => {
    const fixture = await createFixture({
      'package.json': '{}\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              externalDependencies: [
                { from: ['src/main.ts'], to: ['package.json'] },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path
      );
      expect(inventory.pathToId.get('package.json')).toBe(0);
      expect(inventory.items[0]?.kind).toBe('file');
      expect(inventory.items[0]?.treeOrigin).toBeNull();
      expect(inventory.items[0]?.realPath.endsWith('package.json')).toBe(true);
      expect(nodePath.isAbsolute(inventory.items[0]?.realPath ?? '')).toBe(
        true
      );
      const again = includeExternalTargets(inventory, config, fixture.path);
      expect(again.items).toHaveLength(1);
      const missing = includeExternalTargets(
        emptyInventory,
        {
          faf: {
            locals: [
              {
                externalDependencies: [
                  { from: ['src/main.ts'], to: ['missing.json'] },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        fixture.path
      );
      expect(missing.items).toHaveLength(0);

      const nonexistent = includeExternalTargets(
        emptyInventory,
        {
          faf: {
            locals: [{ rootLayers: ['src'] }],
          },
        },
        '/nonexistent/directory'
      );
      expect(nonexistent.items).toHaveLength(0);
    } finally {
      await fixture.rm();
    }
  });

  it('adds external dependency directory targets as directories in inventory', async () => {
    const fixture = await createFixture({
      'legacy/client.ts': 'export const client = 1;\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              externalDependencies: [{ from: ['src/main.ts'], to: ['legacy'] }],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path
      );
      expect(inventory.pathToId.get('legacy')).toBe(0);
      expect(inventory.items[0]?.kind).toBe('directory');
      expect(inventory.items[0]?.treeOrigin).toBeNull();
    } finally {
      await fixture.rm();
    }
  });

  it('adds common aliases pointing to existing directories or files', async () => {
    const fixture = await createFixture({
      'src/_shared/index.ts': 'export const shared = 1;\n',
      'src/file.ts': 'export const file = 1;\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          common: {
            aliases: {
              '#file': 'src/file.ts',
              '#missing': 'src/nonexistent',
              '#shared': 'src/_shared',
            },
          },
          locals: [{ rootLayers: ['src'] }],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path
      );
      expect(inventory.pathToId.get('src/_shared')).toBeDefined();
      expect(inventory.pathToId.get('src/file.ts')).toBeDefined();
      expect(inventory.pathToId.get('src/nonexistent')).toBeUndefined();

      const sharedItem =
        inventory.items[inventory.pathToId.get('src/_shared') ?? -1];
      expect(sharedItem?.kind).toBe('directory');
      expect(sharedItem?.treeOrigin).toBeNull();

      const fileItem =
        inventory.items[inventory.pathToId.get('src/file.ts') ?? -1];
      expect(fileItem?.kind).toBe('file');
      expect(fileItem?.treeOrigin).toBeNull();
    } finally {
      await fixture.rm();
    }
  });

  it('discovers lintable files in nested external subdirectories while skipping root faf.config.ts', async () => {
    const fixture = await createFixture({
      'faf.config.ts': 'export default {};\n',
      'root-tool.ts': 'export const rootTool = 1;\n',
      'scripts/tool.ts': 'export const tool = 1;\n',
      'tools/nested/deep/action.mjs': 'export const action = 1;\n',
      'tools/nested/faf.config.ts': 'export default {};\n',
      'tools/nested/helper.js': 'export const helper = 1;\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          locals: [{ rootLayers: ['src'] }],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path,
        ['src']
      );

      expect(inventory.pathToId.has('faf.config.ts')).toBe(false);
      expect(inventory.pathToId.get('root-tool.ts')).toBeDefined();
      expect(inventory.pathToId.get('scripts/tool.ts')).toBeDefined();
      expect(inventory.pathToId.get('tools/nested/helper.js')).toBeDefined();
      expect(
        inventory.pathToId.get('tools/nested/deep/action.mjs')
      ).toBeDefined();
      expect(
        inventory.pathToId.get('tools/nested/faf.config.ts')
      ).toBeDefined();

      expect(inventory.items.map((item) => item.path)).toEqual([
        'root-tool.ts',
        'scripts/tool.ts',
        'tools/nested/deep/action.mjs',
        'tools/nested/faf.config.ts',
        'tools/nested/helper.js',
      ]);

      const toolId = inventory.pathToId.get('scripts/tool.ts');
      const toolItem = inventory.items[toolId ?? -1];
      expect(toolItem?.kind).toBe('file');
      expect(toolItem?.treeOrigin).toBeNull();
      expect(toolItem?.depth).toBe(0);
      expect(toolItem?.parentId).toBeNull();
      expect(toolItem?.isSymlink).toBe(false);
      expect(toolItem?.preorderStart).toBe(toolId);
      expect(toolItem?.preorderEnd).toBe(toolId);
      expect(toolItem?.path).toBe('scripts/tool.ts');
      expect(toolItem?.realPath).toBe(
        nodeFs.realpathSync(nodePath.join(fixture.path, 'scripts/tool.ts'))
      );
      expect(inventory.realPathToId.get(toolItem?.realPath ?? '')).toBe(toolId);
    } finally {
      await fixture.rm();
    }
  });

  it('skips declared tree origins and returns empty candidates when dot is a tree origin', async () => {
    const fixture = await createFixture({
      'main.ts': 'export const main = 1;\n',
      'packages/core/index.ts': 'export const core = 1;\n',
      'packages/other/tool.ts': 'export const tool = 1;\n',
      'scripts/outside.ts': 'export const outside = 1;\n',
      'src/app.ts': 'export const app = 1;\n',
    });

    try {
      const configDotLayer: TFAFConfig = {
        faf: {
          locals: [{ rootLayers: ['.'] }],
        },
      };
      const dotInventoryExplicit = includeExternalTargets(
        emptyInventory,
        configDotLayer,
        fixture.path,
        ['.']
      );
      expect(dotInventoryExplicit.items).toHaveLength(0);

      const dotInventoryDerived = includeExternalTargets(
        emptyInventory,
        configDotLayer,
        fixture.path
      );
      expect(dotInventoryDerived.items).toHaveLength(0);

      const configDotFragment: TFAFConfig = {
        faf: {
          locals: [
            { rootFragments: [{ path: '.', rootNodes: [['main.ts']] }] },
          ],
        },
      };
      const dotFragmentInventory = includeExternalTargets(
        emptyInventory,
        configDotFragment,
        fixture.path
      );
      expect(dotFragmentInventory.items).toHaveLength(0);

      const configMulti: TFAFConfig = {
        faf: {
          locals: [
            {
              rootFragments: [
                { path: 'packages/core', rootNodes: [['index.ts']] },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const inventoryExplicit = includeExternalTargets(
        emptyInventory,
        configMulti,
        fixture.path,
        ['src', 'packages/core']
      );
      expect(inventoryExplicit.pathToId.has('src/app.ts')).toBe(false);
      expect(inventoryExplicit.pathToId.has('packages/core/index.ts')).toBe(
        false
      );
      expect(
        inventoryExplicit.pathToId.get('packages/other/tool.ts')
      ).toBeDefined();
      expect(
        inventoryExplicit.pathToId.get('scripts/outside.ts')
      ).toBeDefined();

      const inventoryDerived = includeExternalTargets(
        emptyInventory,
        configMulti,
        fixture.path
      );
      expect(inventoryDerived.pathToId.has('src/app.ts')).toBe(false);
      expect(inventoryDerived.pathToId.has('packages/core/index.ts')).toBe(
        false
      );
      expect(
        inventoryDerived.pathToId.get('packages/other/tool.ts')
      ).toBeDefined();
      expect(inventoryDerived.pathToId.get('scripts/outside.ts')).toBeDefined();
    } finally {
      await fixture.rm();
    }
  });

  it('skips hidden directories, symlinks, and artifact directories', async () => {
    const fixture = await createFixture({
      '.cache/cached.ts': 'export const c = 1;\n',
      '.git/hook.ts': 'export const g = 1;\n',
      '.stryker-tmp/mutant.ts': 'export const m = 1;\n',
      'build/output.js': 'export const b = 1;\n',
      'coverage/lcov.js': 'export const cov = 1;\n',
      'dist/bundle.js': 'export const d = 1;\n',
      'node_modules/pkg/index.ts': 'export const p = 1;\n',
      'out/app.js': 'export const o = 1;\n',
      'reports/report.js': 'export const rep = 1;\n',
      'tmp/scratch.ts': 'export const t = 1;\n',
      'tools/valid.ts': 'export const v = 1;\n',
    });

    try {
      nodeFs.symlinkSync(
        nodePath.join(fixture.path, 'tools'),
        nodePath.join(fixture.path, 'symlink-tools'),
        'dir'
      );
      nodeFs.symlinkSync(
        nodePath.join(fixture.path, 'tools/valid.ts'),
        nodePath.join(fixture.path, 'symlink-valid.ts'),
        'file'
      );

      const config: TFAFConfig = {
        faf: {
          locals: [{ rootLayers: ['src'] }],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path,
        ['src']
      );

      expect(inventory.pathToId.get('tools/valid.ts')).toBeDefined();
      expect(inventory.pathToId.has('.cache/cached.ts')).toBe(false);
      expect(inventory.pathToId.has('.git/hook.ts')).toBe(false);
      expect(inventory.pathToId.has('.stryker-tmp/mutant.ts')).toBe(false);
      expect(inventory.pathToId.has('build/output.js')).toBe(false);
      expect(inventory.pathToId.has('coverage/lcov.js')).toBe(false);
      expect(inventory.pathToId.has('dist/bundle.js')).toBe(false);
      expect(inventory.pathToId.has('node_modules/pkg/index.ts')).toBe(false);
      expect(inventory.pathToId.has('out/app.js')).toBe(false);
      expect(inventory.pathToId.has('reports/report.js')).toBe(false);
      expect(inventory.pathToId.has('tmp/scratch.ts')).toBe(false);
      expect(inventory.pathToId.has('symlink-tools')).toBe(false);
      expect(inventory.pathToId.has('symlink-valid.ts')).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('adds external dependencies declared in common configuration', async () => {
    const fixture = await createFixture({
      'common-target.json': '{}\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          common: {
            externalDependencies: [
              { from: ['src/main.ts'], to: ['common-target.json'] },
            ],
          },
          locals: [{ rootLayers: ['src'] }],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path,
        ['src']
      );
      expect(inventory.pathToId.get('common-target.json')).toBe(0);
      expect(inventory.items[0]?.kind).toBe('file');
      expect(inventory.items[0]?.treeOrigin).toBeNull();
    } finally {
      await fixture.rm();
    }
  });

  it('records isSymlink true when an external target is a symlink', async () => {
    const fixture = await createFixture({
      'real.ts': 'export const real = 1;\n',
    });

    try {
      nodeFs.symlinkSync(
        nodePath.join(fixture.path, 'real.ts'),
        nodePath.join(fixture.path, 'symlink.ts')
      );
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              externalDependencies: [
                { from: ['src/main.ts'], to: ['symlink.ts'] },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path,
        ['src']
      );
      expect(inventory.pathToId.get('symlink.ts')).toBe(0);
      expect(inventory.items[0]?.isSymlink).toBe(true);
      expect(inventory.items[0]?.kind).toBe('file');
    } finally {
      await fixture.rm();
    }
  });

  it('skips non-lintable files unless explicitly listed in externalDependencies', async () => {
    const fixture = await createFixture({
      'docs/guide.txt': 'Guide\n',
      'scripts/config.json': '{}\n',
      'scripts/README.md': '# Readme\n',
      'scripts/tool.ts': 'export const tool = 1;\n',
    });

    try {
      const configWithoutExternal: TFAFConfig = {
        faf: {
          locals: [{ rootLayers: ['src'] }],
        },
      };
      const inventoryWithout = includeExternalTargets(
        emptyInventory,
        configWithoutExternal,
        fixture.path,
        ['src']
      );
      expect(inventoryWithout.pathToId.get('scripts/tool.ts')).toBeDefined();
      expect(inventoryWithout.pathToId.has('scripts/README.md')).toBe(false);
      expect(inventoryWithout.pathToId.has('scripts/config.json')).toBe(false);
      expect(inventoryWithout.pathToId.has('docs/guide.txt')).toBe(false);

      const configWithExternal: TFAFConfig = {
        faf: {
          locals: [
            {
              externalDependencies: [
                { from: ['src/main.ts'], to: ['scripts/README.md'] },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const inventoryWith = includeExternalTargets(
        emptyInventory,
        configWithExternal,
        fixture.path,
        ['src']
      );
      expect(inventoryWith.pathToId.get('scripts/tool.ts')).toBeDefined();
      expect(inventoryWith.pathToId.get('scripts/README.md')).toBeDefined();
      const readmeId = inventoryWith.pathToId.get('scripts/README.md');
      expect(inventoryWith.items[readmeId ?? -1]?.kind).toBe('file');
      expect(inventoryWith.items[readmeId ?? -1]?.treeOrigin).toBeNull();
      expect(inventoryWith.pathToId.has('scripts/config.json')).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('ignores unreadable external directories without throwing', async () => {
    const fixture = await createFixture({
      'scripts/tool.ts': 'export const tool = 1;\n',
      'unreadable/secret.ts': 'export const secret = 1;\n',
    });

    const unreadablePath = nodePath.join(fixture.path, 'unreadable');
    nodeFs.chmodSync(unreadablePath, 0);

    try {
      const config: TFAFConfig = {
        faf: {
          locals: [{ rootLayers: ['src'] }],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path,
        ['src']
      );
      expect(inventory.pathToId.get('scripts/tool.ts')).toBeDefined();
    } finally {
      nodeFs.chmodSync(unreadablePath, 0o700);
      await fixture.rm();
    }
  });

  it('traverses source dot-directories like .storybook while skipping dot-files and known tooling dot-directories', async () => {
    const fixture = await createFixture({
      '.agents/skill.ts': 'export const skill = 1;\n',
      '.changeset/config.ts': 'export const cs = 1;\n',
      '.github/workflows/check.ts': 'export const wf = 1;\n',
      '.husky/pre-commit.ts': 'export const hc = 1;\n',
      '.idea/workspace.ts': 'export const idea = 1;\n',
      '.next/server.ts': 'export const next = 1;\n',
      '.nuxt/app.ts': 'export const nuxt = 1;\n',
      '.pnpm-store/v3/file.ts': 'export const pnpm = 1;\n',
      '.storybook/.hidden.ts': 'export const hidden = 1;\n',
      '.storybook/main.ts': 'export const main = 1;\n',
      '.storybook/preview.ts': 'export const preview = 1;\n',
      '.storybook/storybook.style.css': 'body {}\n',
      '.svelte-kit/generated.ts': 'export const sk = 1;\n',
      '.turbo/cache.ts': 'export const turbo = 1;\n',
      '.vercel/output.ts': 'export const vercel = 1;\n',
      '.vscode/settings.ts': 'export const vscode = 1;\n',
      '.yarn/releases/yarn.cjs': 'module.exports = {};\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          locals: [{ rootLayers: ['src'] }],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path,
        ['src']
      );

      expect(inventory.items.map((item) => item.path)).toEqual([
        '.storybook/main.ts',
        '.storybook/preview.ts',
      ]);
      expect(inventory.pathToId.has('.storybook/.hidden.ts')).toBe(false);
      expect(inventory.pathToId.has('.storybook/storybook.style.css')).toBe(
        false
      );
    } finally {
      await fixture.rm();
    }
  });

  it('skips artifact directories only at root and traverses nested artifact-named directories while skipping nested node_modules', async () => {
    const fixture = await createFixture({
      '__test__/build/package-exports.test.ts': 'export const test = 1;\n',
      '__test__/coverage/fixture.ts': 'export const cov = 1;\n',
      '__test__/dist/fixture.ts': 'export const dist = 1;\n',
      '__test__/out/fixture.ts': 'export const out = 1;\n',
      '__test__/reports/fixture.ts': 'export const rep = 1;\n',
      '__test__/tmp/fixture.ts': 'export const tmp = 1;\n',
      'build/output.js': 'export const rootBuild = 1;\n',
      'dist/bundle.js': 'export const rootDist = 1;\n',
      'tools/node_modules/pkg/index.ts': 'export const pkg = 1;\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          locals: [{ rootLayers: ['src'] }],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path,
        ['src']
      );

      expect(inventory.items.map((item) => item.path)).toEqual([
        '__test__/build/package-exports.test.ts',
        '__test__/coverage/fixture.ts',
        '__test__/dist/fixture.ts',
        '__test__/out/fixture.ts',
        '__test__/reports/fixture.ts',
        '__test__/tmp/fixture.ts',
      ]);
      expect(inventory.pathToId.has('build/output.js')).toBe(false);
      expect(inventory.pathToId.has('dist/bundle.js')).toBe(false);
      expect(inventory.pathToId.has('tools/node_modules/pkg/index.ts')).toBe(
        false
      );
    } finally {
      await fixture.rm();
    }
  });

  it('includes eligible overlayPaths inside ignored directories while skipping symlinks, non-files, tree files, and escaping paths', async () => {
    const fixture = await createFixture({
      'build/active.ts': 'export const active = 1;\n',
      'build/folder.ts/nested.ts': 'export const nested = 1;\n',
      'dist/ignored.ts': 'export const ignored = 1;\n',
      'faf.config.ts': 'export default {};\n',
      'src/inside.ts': 'export const inside = 1;\n',
    });

    try {
      nodeFs.symlinkSync(
        nodePath.join(fixture.path, 'build/active.ts'),
        nodePath.join(fixture.path, 'build/symlink.ts'),
        'file'
      );
      const config: TFAFConfig = {
        faf: {
          locals: [{ rootLayers: ['src'] }],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path,
        ['src'],
        [
          'build/active.ts',
          'build/folder.ts',
          'build/missing.ts',
          'build/symlink.ts',
          'faf.config.ts',
          'src/inside.ts',
          '../outside.ts',
        ]
      );

      expect(inventory.items.map((item) => item.path)).toEqual([
        'build/active.ts',
      ]);
      const activeId = inventory.pathToId.get('build/active.ts');
      expect(inventory.items[activeId ?? -1]?.kind).toBe('file');
      expect(inventory.items[activeId ?? -1]?.treeOrigin).toBeNull();
      expect(inventory.items[activeId ?? -1]?.isSymlink).toBe(false);
      expect(inventory.pathToId.has('dist/ignored.ts')).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('indexes config-referenced external files, directories, and dot when dot is not a tree origin', async () => {
    const fixture = await createFixture({
      'outside-apis/readme.txt': 'text\n',
      'outside-dir/note.txt': 'note\n',
      'README.md': '# Root Readme\n',
      'scripts/build.sh': 'echo hi\n',
      'src/app.ts': 'export const app = 1;\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          common: {
            foreignDomains: ['scripts'],
            foreignNodes: ['README.md', { paths: ['.'], patterns: ['*.md'] }],
          },
          locals: [
            {
              horizontalHierarchies: [
                { hierarchy: [['_a'], ['_b']], path: 'outside-dir' },
              ],
              mimeticPathStructures: [{ paths: ['outside-apis'] }],
              publicRootNodes: ['README.md'],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path,
        ['src']
      );

      const dotId = inventory.pathToId.get('.');
      expect(dotId).toBeDefined();
      expect(inventory.items[dotId ?? -1]?.kind).toBe('directory');
      expect(inventory.items[dotId ?? -1]?.treeOrigin).toBeNull();

      const scriptsId = inventory.pathToId.get('scripts');
      expect(scriptsId).toBeDefined();
      expect(inventory.items[scriptsId ?? -1]?.kind).toBe('directory');
      expect(inventory.items[scriptsId ?? -1]?.treeOrigin).toBeNull();

      const readmeId = inventory.pathToId.get('README.md');
      expect(readmeId).toBeDefined();
      expect(inventory.items[readmeId ?? -1]?.kind).toBe('file');
      expect(inventory.items[readmeId ?? -1]?.treeOrigin).toBeNull();

      const outsideDirectoryId = inventory.pathToId.get('outside-dir');
      expect(inventory.items[outsideDirectoryId ?? -1]?.kind).toBe('directory');

      const outsideApisId = inventory.pathToId.get('outside-apis');
      expect(inventory.items[outsideApisId ?? -1]?.kind).toBe('directory');
    } finally {
      await fixture.rm();
    }
  });

  it('normalizes dot-slash and trailing slashes in declared origins and ignores real files outside baseDirectory', async () => {
    const outerFixture = await createFixture({
      'outside.txt': 'outside\n',
      'project/build/active.ts': 'export const active = 1;\n',
      'project/src/app.ts': 'export const app = 1;\n',
    });

    const projectDirectory = nodePath.join(outerFixture.path, 'project');
    try {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              foreignDomains: ['..'],
              foreignNodes: ['../outside.txt'],
              rootLayers: ['./src/'],
            },
          ],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        projectDirectory,
        ['./src/'],
        ['./build/active.ts', './src/app.ts']
      );

      expect(inventory.items.map((item) => item.path)).toEqual([
        'build/active.ts',
      ]);
      expect(inventory.pathToId.has('..')).toBe(false);
      expect(inventory.pathToId.has('../outside.txt')).toBe(false);
      expect(inventory.pathToId.has('src/app.ts')).toBe(false);
    } finally {
      await outerFixture.rm();
    }
  });

  it('ignores empty or parent-escaping config targets safely', async () => {
    const fixture = await createFixture({
      'README.md': '# Readme\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              foreignDomains: ['', '../outside-parent'],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path,
        ['src']
      );
      expect(inventory.items).toHaveLength(0);
    } finally {
      await fixture.rm();
    }
  });
});
