import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { ResolverFactory } from 'oxc-resolver';
import { describe, expect, it, vi } from 'vitest';

import type { TModuleImport } from '../../../../../../_session@shared/_types/module-record.type.js';
import type { TEffectivePathAlias } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { assertInvariant } from '../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { resolveSpecifiers } from './resolve-specifiers.adapter.js';

const isContinuing = (): boolean => false;

const failWhen = (isAllowed: boolean, message: string): void => {
  assertInvariant(isAllowed, message);
};

const createImport = (
  specifier: null | string,
  kind: TModuleImport['kind'] = 'named-import'
): TModuleImport => ({
  isTypeOnly: false,
  kind,
  position: {
    column: 1,
    line: 1,
  },
  specifier,
});

describe('resolveSpecifiers', () => {
  it('recognizes equivalent paths reaching the exact same destination', async () => {
    const fixture = await createFixture({
      'package.json': JSON.stringify({
        imports: {
          '#alias-domain/*': './src/domain/*.ts',
          '#redirect-target': './src/domain/target.ts',
        },
        name: 'test-project',
        type: 'module',
      }),
      'src/app/main.ts': 'export const main = 1;',
      'src/app/sub/nested.ts': 'export const nested = 1;',
      'src/domain/target.ts': 'export const target = 42;',
      'src/fragment/index.ts': 'export const index = 1;',
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '#domain/*': ['./src/domain/*'],
          },
        },
      }),
    });

    try {
      const aliases: readonly TEffectivePathAlias[] = [
        {
          prefix: '#domain',
          source: 'common.aliases',
          targets: ['src/domain'],
        },
      ];

      const resolver = resolveSpecifiers(fixture.path, aliases);

      const relativeExtensionResult = resolver('src/app/main.ts', [
        createImport('../domain/target.ts'),
      ]);
      expect(relativeExtensionResult[0]?.target).toEqual({
        path: 'src/domain/target.ts',
        type: 'local-file',
      });

      const extensionAliasResult = resolver('src/app/main.ts', [
        createImport('../domain/target.js'),
      ]);
      expect(extensionAliasResult[0]?.target).toEqual({
        path: 'src/domain/target.ts',
        type: 'local-file',
      });

      const relativeNoExtensionResult = resolver('src/app/main.ts', [
        createImport('../domain/target'),
      ]);
      expect(relativeNoExtensionResult[0]?.target).toEqual({
        path: 'src/domain/target.ts',
        type: 'local-file',
      });

      const directoryIndexResult = resolver('src/app/main.ts', [
        createImport('../fragment'),
      ]);
      expect(directoryIndexResult[0]?.target).toEqual({
        path: 'src/fragment/index.ts',
        type: 'local-file',
      });

      const pathAliasResult = resolver('src/app/main.ts', [
        createImport('#domain/target'),
      ]);
      expect(pathAliasResult[0]?.target).toEqual({
        path: 'src/domain/target.ts',
        type: 'local-file',
      });
      expect(pathAliasResult[0]?.aliasUsed).toBe('#domain');

      const dotDotResult = resolver('src/app/main.ts', [
        createImport('./sub/../../domain/target.ts'),
      ]);
      expect(dotDotResult[0]?.target).toEqual({
        path: 'src/domain/target.ts',
        type: 'local-file',
      });

      const redirectResult = resolver('src/app/main.ts', [
        createImport('#redirect-target'),
      ]);
      expect(redirectResult[0]?.target).toEqual({
        path: 'src/domain/target.ts',
        type: 'local-file',
      });

      const windowsSeparatorsResult = resolver('src\\app\\main.ts', [
        createImport('../domain/target.ts'),
      ]);
      expect(windowsSeparatorsResult[0]?.sourcePath).toBe('src/app/main.ts');
      expect(windowsSeparatorsResult[0]?.target).toEqual({
        path: 'src/domain/target.ts',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('reports actual resolved destination whether Access Node or Master Node', async () => {
    const fixture = await createFixture({
      'src/components/card/card.component.tsx': 'export const Card = 1;',
      'src/components/card/package.json': JSON.stringify({
        main: './card.component.tsx',
      }),
      'src/components/modal/index.ts': 'export const Modal = 1;',
      'src/components/modal/modal.component.tsx': 'export const ModalComp = 1;',
      'src/consumer.ts': 'export const c = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const modalResult = resolver('src/consumer.ts', [
        createImport('./components/modal'),
      ]);
      expect(modalResult[0]?.target).toEqual({
        path: 'src/components/modal/index.ts',
        type: 'local-file',
      });

      const cardResult = resolver('src/consumer.ts', [
        createImport('./components/card'),
      ]);
      expect(cardResult[0]?.target).toEqual({
        path: 'src/components/card/card.component.tsx',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('returns unresolved outcome for unresolvable dependencies without inventing targets', async () => {
    const fixture = await createFixture({
      'src/main.ts': 'export const a = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const result = resolver('src/main.ts', [
        createImport('./non-existent.js'),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]?.target.type).toBe('unresolved');
      if (result[0]?.target.type === 'unresolved') {
        expect(result[0].target.reason).toContain('Cannot find module');
      }
    } finally {
      await fixture.rm();
    }
  });

  it('marks non-literal dynamic imports with explicit unresolvable reason', async () => {
    const fixture = await createFixture({
      'src/main.ts': 'export const a = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const result = resolver('src/main.ts', [
        createImport(null, 'non-literal-dynamic-import'),
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]?.aliasUsed).toBeNull();
      expect(result[0]?.aliasAlternatives).toEqual([]);
      expect(result[0]?.target).toEqual({
        reason: 'Non-literal dynamic import cannot be resolved statically',
        type: 'unresolved',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('distinguishes workspace packages from external libraries even when package names are used', async () => {
    const fixture = await createFixture({
      'node_modules/external-pkg/index.js': 'export const ext = 1;',
      'node_modules/external-pkg/package.json': JSON.stringify({
        main: './index.js',
        name: 'external-pkg',
      }),
      'packages/workspace-lib/index.ts': 'export const lib = 1;',
      'packages/workspace-lib/package.json': JSON.stringify({
        main: './index.ts',
        name: '@workspace/lib',
      }),
      'src/main.ts': 'export const main = 1;',
    });

    try {
      const workspaceTarget = nodePath.join(
        fixture.path,
        'packages/workspace-lib'
      );
      const linkScopeDirectory = nodePath.join(
        fixture.path,
        'node_modules/@workspace'
      );
      nodeFs.mkdirSync(linkScopeDirectory, { recursive: true });
      nodeFs.symlinkSync(
        workspaceTarget,
        nodePath.join(linkScopeDirectory, 'lib'),
        'dir'
      );

      const resolver = resolveSpecifiers(fixture.path, []);

      const localWorkspaceResult = resolver('src/main.ts', [
        createImport('@workspace/lib'),
      ]);
      expect(localWorkspaceResult[0]?.target).toEqual({
        path: 'packages/workspace-lib/index.ts',
        type: 'local-file',
      });

      const externalResult = resolver('src/main.ts', [
        createImport('external-pkg'),
      ]);
      expect(externalResult[0]?.target).toEqual({
        packageName: 'external-pkg',
        type: 'external-library',
      });

      const nodeBuiltinResult = resolver('src/main.ts', [
        createImport('node:fs'),
      ]);
      expect(nodeBuiltinResult[0]?.target).toEqual({
        packageName: 'node:fs',
        type: 'external-library',
      });

      const unprefixedNodeResult = resolver('src/main.ts', [
        createImport('fs'),
      ]);
      expect(unprefixedNodeResult[0]?.target).toEqual({
        packageName: 'node:fs',
        type: 'external-library',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('respects segment boundary and selects longest prefix match', async () => {
    const fixture = await createFixture({
      'src/_src@shared/_apis/client.ts': 'export const c = 1;',
      'src/_src@shared/unit.ts': 'export const u = 1;',
      'src/main.ts': 'export const m = 1;',
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '#shared': ['./src/_src@shared'],
            '#shared/*': ['./src/_src@shared/*'],
            '#shared/apis/*': ['./src/_src@shared/_apis/*'],
          },
        },
      }),
    });

    try {
      const aliases: readonly TEffectivePathAlias[] = [
        {
          prefix: '#shared',
          source: 'common.aliases',
          targets: ['src/_src@shared'],
        },
        {
          prefix: '#shared/apis',
          source: 'common.aliases',
          targets: ['src/_src@shared/_apis'],
        },
      ];

      const resolver = resolveSpecifiers(fixture.path, aliases);

      const unitResult = resolver('src/main.ts', [
        createImport('#shared/unit'),
      ]);
      expect(unitResult[0]?.aliasUsed).toBe('#shared');
      expect(unitResult[0]?.aliasAlternatives).toEqual([
        'src/_src@shared/unit',
      ]);
      expect(unitResult[0]?.target).toEqual({
        path: 'src/_src@shared/unit.ts',
        type: 'local-file',
      });

      const clientResult = resolver('src/main.ts', [
        createImport('#shared/apis/client'),
      ]);
      expect(clientResult[0]?.aliasUsed).toBe('#shared/apis');
      expect(clientResult[0]?.aliasAlternatives).toEqual([
        'src/_src@shared/_apis/client',
      ]);
      expect(clientResult[0]?.target).toEqual({
        path: 'src/_src@shared/_apis/client.ts',
        type: 'local-file',
      });

      const nonMatchingResult = resolver('src/main.ts', [
        createImport('#sharedness/unit'),
      ]);
      expect(nonMatchingResult[0]?.aliasUsed).toBeNull();
      expect(nonMatchingResult[0]?.aliasAlternatives).toEqual([]);
      expect(nonMatchingResult[0]?.target.type).toBe('unresolved');
    } finally {
      await fixture.rm();
    }
  });

  it('evaluates all alternative destinations declared in imports', async () => {
    const fixture = await createFixture({
      'alt/_src@shared/unit.ts': 'export const unit = 1;',
      'src/main.ts': 'export const m = 1;',
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '#shared/*': ['./src/_src@shared/*', './alt/_src@shared/*'],
          },
        },
      }),
    });

    try {
      const aliases: readonly TEffectivePathAlias[] = [
        {
          prefix: '#shared',
          source: 'package.json#imports',
          targets: ['src/_src@shared', 'alt/_src@shared'],
        },
      ];

      const resolver = resolveSpecifiers(fixture.path, aliases);

      const result = resolver('src/main.ts', [createImport('#shared/unit')]);
      expect(result[0]?.aliasUsed).toBe('#shared');
      expect(result[0]?.aliasAlternatives).toEqual([
        'src/_src@shared/unit',
        'alt/_src@shared/unit',
      ]);
      expect(result[0]?.target).toEqual({
        path: 'alt/_src@shared/unit.ts',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('reports discordance when resolved path falls outside declared alias alternatives', async () => {
    const fixture = await createFixture({
      'src/rogue/unit.ts': 'export const rogue = 1;',
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '#shared/*': ['./src/rogue/*'],
          },
        },
      }),
    });

    try {
      const aliases: readonly TEffectivePathAlias[] = [
        {
          prefix: '#shared',
          source: 'common.aliases',
          targets: ['src/_src@shared'],
        },
      ];

      const resolver = resolveSpecifiers(fixture.path, aliases);

      const result = resolver('src/rogue/main.ts', [
        createImport('#shared/unit'),
      ]);
      expect(result[0]?.aliasUsed).toBe('#shared');
      expect(result[0]?.aliasAlternatives).toEqual(['src/_src@shared/unit']);
      expect(result[0]?.target).toEqual({
        reason:
          'Path alias resolution falls outside the declared alias targets',
        type: 'unresolved',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('memoizes resolution outcomes for same directory and specifier', async () => {
    const fixture = await createFixture({
      'src/a.ts': 'export const a = 1;',
      'src/b.ts': 'export const b = 1;',
      'src/dep.ts': 'export const dep = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const first = resolver('src/a.ts', [createImport('./dep.js')]);
      const second = resolver('src/b.ts', [createImport('./dep.js')]);

      expect(first[0]?.target).toEqual({
        path: 'src/dep.ts',
        type: 'local-file',
      });
      expect(second[0]?.target).toEqual({
        path: 'src/dep.ts',
        type: 'local-file',
      });
      expect(first[0]?.target).toBe(second[0]?.target);
    } finally {
      await fixture.rm();
    }
  });

  it('resolves diverse file extensions including json and css', async () => {
    const fixture = await createFixture({
      'src/data.json': JSON.stringify({ version: '1.0' }),
      'src/main.ts': 'export const a = 1;',
      'src/style.css': '.app { color: red; }',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const jsonResult = resolver('src/main.ts', [createImport('./data.json')]);
      expect(jsonResult[0]?.target).toEqual({
        path: 'src/data.json',
        type: 'local-file',
      });

      const cssResult = resolver('src/main.ts', [createImport('./style.css')]);
      expect(cssResult[0]?.target).toEqual({
        path: 'src/style.css',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('resolves package exports governed by all supported conditions', async () => {
    const fixture = await createFixture({
      'node_modules/cond-pkg/default.js': 'export const d = 1;',
      'node_modules/cond-pkg/import.js': 'export const i = 1;',
      'node_modules/cond-pkg/node.js': 'export const n = 1;',
      'node_modules/cond-pkg/package.json': JSON.stringify({
        exports: {
          './cond-default': { default: './default.js' },
          './cond-import': { import: './import.js' },
          './cond-node': { node: './node.js' },
          './cond-require': { require: './require.js' },
          './cond-types': { types: './types.d.ts' },
        },
        name: 'cond-pkg',
      }),
      'node_modules/cond-pkg/require.js': 'module.exports = 1;',
      'node_modules/cond-pkg/types.d.ts': 'export const t: number;',
      'src/main.ts': 'export const a = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const importConditionResult = resolver('src/main.ts', [
        createImport('cond-pkg/cond-import'),
      ]);
      expect(importConditionResult[0]?.target.type).toBe('external-library');

      const requireConditionResult = resolver('src/main.ts', [
        createImport('cond-pkg/cond-require'),
      ]);
      expect(requireConditionResult[0]?.target.type).toBe('external-library');

      const nodeConditionResult = resolver('src/main.ts', [
        createImport('cond-pkg/cond-node'),
      ]);
      expect(nodeConditionResult[0]?.target.type).toBe('external-library');

      const typesConditionResult = resolver('src/main.ts', [
        createImport('cond-pkg/cond-types'),
      ]);
      expect(typesConditionResult[0]?.target.type).toBe('external-library');

      const defaultConditionResult = resolver('src/main.ts', [
        createImport('cond-pkg/cond-default'),
      ]);
      expect(defaultConditionResult[0]?.target.type).toBe('external-library');
    } finally {
      await fixture.rm();
    }
  });

  it('resolves extensions via extensionAlias mappings including exact target extensions', async () => {
    const fixture = await createFixture({
      'src/cjs-mod.cts': 'export const c = 1;',
      'src/jsx-comp.tsx': 'export const j = 1;',
      'src/main.ts': 'export const a = 1;',
      'src/mjs-mod.mts': 'export const m = 1;',
      'src/real.cjs': 'module.exports = 1;',
      'src/real.js': 'export const js = 1;',
      'src/real.jsx': 'export const jsx = 1;',
      'src/real.mjs': 'export const mjs = 1;',
      'src/tsx-comp.tsx': 'export const t = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const tsxViaJsResult = resolver('src/main.ts', [
        createImport('./tsx-comp.js'),
      ]);
      expect(tsxViaJsResult[0]?.target).toEqual({
        path: 'src/tsx-comp.tsx',
        type: 'local-file',
      });

      const mtsViaMjsResult = resolver('src/main.ts', [
        createImport('./mjs-mod.mjs'),
      ]);
      expect(mtsViaMjsResult[0]?.target).toEqual({
        path: 'src/mjs-mod.mts',
        type: 'local-file',
      });

      const ctsViaCjsResult = resolver('src/main.ts', [
        createImport('./cjs-mod.cjs'),
      ]);
      expect(ctsViaCjsResult[0]?.target).toEqual({
        path: 'src/cjs-mod.cts',
        type: 'local-file',
      });

      const tsxViaJsxResult = resolver('src/main.ts', [
        createImport('./jsx-comp.jsx'),
      ]);
      expect(tsxViaJsxResult[0]?.target).toEqual({
        path: 'src/jsx-comp.tsx',
        type: 'local-file',
      });

      const realJsResult = resolver('src/main.ts', [createImport('./real.js')]);
      expect(realJsResult[0]?.target).toEqual({
        path: 'src/real.js',
        type: 'local-file',
      });

      const realMjsResult = resolver('src/main.ts', [
        createImport('./real.mjs'),
      ]);
      expect(realMjsResult[0]?.target).toEqual({
        path: 'src/real.mjs',
        type: 'local-file',
      });

      const realCjsResult = resolver('src/main.ts', [
        createImport('./real.cjs'),
      ]);
      expect(realCjsResult[0]?.target).toEqual({
        path: 'src/real.cjs',
        type: 'local-file',
      });

      const realJsxResult = resolver('src/main.ts', [
        createImport('./real.jsx'),
      ]);
      expect(realJsxResult[0]?.target).toEqual({
        path: 'src/real.jsx',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('resolves extensionless specifiers across all supported extensions', async () => {
    const fixture = await createFixture({
      'src/cjs-file.cjs': 'module.exports = 1;',
      'src/css-file.css': '.rule {}',
      'src/cts-file.cts': 'export const cts = 1;',
      'src/js-file.js': 'export const js = 1;',
      'src/json-file.json': '{}',
      'src/jsx-file.jsx': 'export const jsx = 1;',
      'src/main.ts': 'export const a = 1;',
      'src/mjs-file.mjs': 'export const mjs = 1;',
      'src/mts-file.mts': 'export const mts = 1;',
      'src/tsx-file.tsx': 'export const tsx = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const tsxResult = resolver('src/main.ts', [createImport('./tsx-file')]);
      expect(tsxResult[0]?.target).toEqual({
        path: 'src/tsx-file.tsx',
        type: 'local-file',
      });

      const mtsResult = resolver('src/main.ts', [createImport('./mts-file')]);
      expect(mtsResult[0]?.target).toEqual({
        path: 'src/mts-file.mts',
        type: 'local-file',
      });

      const ctsResult = resolver('src/main.ts', [createImport('./cts-file')]);
      expect(ctsResult[0]?.target).toEqual({
        path: 'src/cts-file.cts',
        type: 'local-file',
      });

      const jsxResult = resolver('src/main.ts', [createImport('./jsx-file')]);
      expect(jsxResult[0]?.target).toEqual({
        path: 'src/jsx-file.jsx',
        type: 'local-file',
      });

      const mjsResult = resolver('src/main.ts', [createImport('./mjs-file')]);
      expect(mjsResult[0]?.target).toEqual({
        path: 'src/mjs-file.mjs',
        type: 'local-file',
      });

      const cjsResult = resolver('src/main.ts', [createImport('./cjs-file')]);
      expect(cjsResult[0]?.target).toEqual({
        path: 'src/cjs-file.cjs',
        type: 'local-file',
      });

      const jsResult = resolver('src/main.ts', [createImport('./js-file')]);
      expect(jsResult[0]?.target).toEqual({
        path: 'src/js-file.js',
        type: 'local-file',
      });

      const jsonResult = resolver('src/main.ts', [createImport('./json-file')]);
      expect(jsonResult[0]?.target).toEqual({
        path: 'src/json-file.json',
        type: 'local-file',
      });

      const cssResult = resolver('src/main.ts', [createImport('./css-file')]);
      expect(cssResult[0]?.target).toEqual({
        path: 'src/css-file.css',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('normalizes baseDirectory when it is a symlink to another directory', async () => {
    const fixture = await createFixture({
      'real-base/src/dep.ts': 'export const d = 1;',
      'real-base/src/main.ts': 'export const m = 1;',
    });

    try {
      const realBasePath = nodePath.join(fixture.path, 'real-base');
      const symlinkBasePath = nodePath.join(fixture.path, 'symlink-base');
      nodeFs.symlinkSync(realBasePath, symlinkBasePath, 'dir');

      const resolver = resolveSpecifiers(symlinkBasePath, []);
      const result = resolver('src/main.ts', [createImport('./dep.js')]);
      expect(result[0]?.target).toEqual({
        path: 'src/dep.ts',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('handles empty imports list returning an empty array', async () => {
    const fixture = await createFixture({
      'src/main.ts': 'export const a = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);
      const result = resolver('src/main.ts', []);
      expect(result).toEqual([]);
    } finally {
      await fixture.rm();
    }
  });

  it('handles non-existent base directory gracefully without throwing', () => {
    const nonExistentPath = '/non-existent-directory-never-created-9999';
    const resolver = resolveSpecifiers(nonExistentPath, []);
    const result = resolver('src/main.ts', [createImport('./dep.js')]);
    expect(result).toHaveLength(1);
    expect(result[0]?.target.type).toBe('unresolved');
  });

  it('catches oxc-resolver exceptions without letting them escape the adapter', async () => {
    const fixture = await createFixture({
      'src/main.ts': 'export const a = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const spy = vi
        .spyOn(ResolverFactory.prototype, 'sync')
        .mockImplementationOnce(() => {
          failWhen(isContinuing(), 'Simulated oxc-resolver crash');
          return { error: 'Simulated oxc-resolver crash' };
        });

      const errorResult = resolver('src/main.ts', [createImport('./first.js')]);
      expect(errorResult[0]?.target).toEqual({
        reason: 'Simulated oxc-resolver crash',
        type: 'unresolved',
      });

      spy.mockRestore();
    } finally {
      await fixture.rm();
    }
  });

  it('resolves symlinked source file to its canonical realpath target on disk', async () => {
    const fixture = await createFixture({
      'src/main.ts': 'export const main = 1;',
      'src/target.ts': 'export const target = 42;',
    });

    try {
      const realTarget = nodePath.join(fixture.path, 'src/target.ts');
      const symlinkSource = nodePath.join(fixture.path, 'src/symlink.ts');
      nodeFs.symlinkSync(realTarget, symlinkSource, 'file');

      const resolver = resolveSpecifiers(fixture.path, []);
      const result = resolver('src/main.ts', [createImport('./symlink.js')]);
      expect(result[0]?.target).toEqual({
        path: 'src/target.ts',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('falls back to non-canonical resolved path when realpath fails', async () => {
    const fixture = await createFixture({
      'src/dep.ts': 'export const dep = 1;',
      'src/main.ts': 'export const main = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const originalRealpathSync = nodeFs.realpathSync;
      const realpathSpy = vi
        .spyOn(nodeFs, 'realpathSync')
        .mockImplementation((targetPath, options) => {
          if (typeof targetPath === 'string' && targetPath.endsWith('dep.ts')) {
            failWhen(isContinuing(), 'Simulated realpath failure');
          }
          return originalRealpathSync(targetPath, options);
        });

      const result = resolver('src/main.ts', [createImport('./dep.js')]);
      expect(result[0]?.target).toEqual({
        path: 'src/dep.ts',
        type: 'local-file',
      });

      realpathSpy.mockRestore();
    } finally {
      await fixture.rm();
    }
  });

  it('canonicalizes resolved path using realpath when target is a symlink', async () => {
    const fixture = await createFixture({
      'src/canonical-target.ts': 'export const target = 42;',
      'src/main.ts': 'export const main = 1;',
      'src/symlink-source.ts': 'export const symlink = 1;',
    });

    try {
      const resolver = resolveSpecifiers(fixture.path, []);

      const originalRealpathSync = nodeFs.realpathSync;
      const canonicalTargetPath = nodePath.join(
        fixture.path,
        'src/canonical-target.ts'
      );
      const realpathSpy = vi
        .spyOn(nodeFs, 'realpathSync')
        .mockImplementation((targetPath, options) =>
          typeof targetPath === 'string' &&
          targetPath.endsWith('symlink-source.ts')
            ? canonicalTargetPath
            : originalRealpathSync(targetPath, options)
        );

      const result = resolver('src/main.ts', [
        createImport('./symlink-source.js'),
      ]);
      expect(result[0]?.target).toEqual({
        path: 'src/canonical-target.ts',
        type: 'local-file',
      });

      realpathSpy.mockRestore();
    } finally {
      await fixture.rm();
    }
  });
});
