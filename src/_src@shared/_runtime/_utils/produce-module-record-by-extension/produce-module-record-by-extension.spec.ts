import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TInventory } from '../../../_inventory/_types/inventory.type.js';

import { assertInvariant } from '../../../_domain/_utils/assert-invariant/index.js';
import { buildInventory } from '../../../_inventory/_utils/build-inventory/index.js';
import { collectModules } from '../../_adapters/collect-modules/index.js';
import { listEntries } from '../../_adapters/list-entries/index.js';
import { resolveSpecifiers } from '../../_adapters/resolve-specifiers/index.js';
import { produceModuleRecordByExtension } from './index.js';

const SCRIPT_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
] as const;

const STYLE_EXTENSIONS = ['.css', '.scss', '.sass', '.less'] as const;

describe('produceModuleRecordByExtension', () => {
  it.each(SCRIPT_EXTENSIONS)(
    'selects the script producer for %s including declaration files',
    (extension) => {
      const path =
        extension === '.ts' ? `types.d${extension}` : `file${extension}`;
      const record = produceModuleRecordByExtension(
        path,
        'const marker = 1;\n'
      );
      expect(record.language).toBe('script');
      expect(record.symbols.some((symbol) => symbol.name === 'marker')).toBe(
        true
      );
    }
  );

  it('parses a .d.ts path through the script producer', () => {
    const record = produceModuleRecordByExtension(
      'src/types.d.ts',
      'export const marker = 1;\n'
    );
    expect(record.language).toBe('script');
    expect(record.symbols.some((symbol) => symbol.name === 'marker')).toBe(
      true
    );
  });

  it.each(STYLE_EXTENSIONS)(
    'selects the style producer for %s',
    (extension) => {
      const record = produceModuleRecordByExtension(
        `theme${extension}`,
        '@import "./other.css";\n'
      );
      expect(record.language).toBe('style');
      expect(record.imports[0]?.specifier).toBe('./other.css');
    }
  );

  it.each(['.png', '.json', '.woff2', '.md', ''])(
    'selects the binary producer for extension %s',
    (extension) => {
      const path = extension === '' ? 'src/Makefile' : `asset${extension}`;
      const record = produceModuleRecordByExtension(path, 'not used');
      expect(record.language).toBe('binary');
      expect(record.imports).toEqual([]);
      expect(record.symbols).toEqual([]);
      expect(record.exports).toEqual([]);
    }
  );

  it('ignores a dot in a parent segment and a leading dotfile name', () => {
    expect(produceModuleRecordByExtension('dir.old/name', '').language).toBe(
      'binary'
    );
    expect(produceModuleRecordByExtension('.gitignore', '').language).toBe(
      'binary'
    );
    expect(
      produceModuleRecordByExtension('dir.old/name.ts', 'const marker = 1;\n')
        .language
    ).toBe('script');
  });
});

const importFrom = 'from';

const sourceImport = (binding: string, specifier: string, rest = ''): string =>
  `import { ${binding} } ${importFrom} '${specifier}';\n${rest}`;

const inventoryFor = (
  baseDirectory: string,
  origins: readonly string[]
): TInventory => {
  const listed = listEntries(baseDirectory, origins);
  assertInvariant(listed.ok, 'Expected readable tree origins');
  return buildInventory(listed.value, origins).inventory;
};

const collect = (
  baseDirectory: string,
  origins: readonly string[],
  textOverrides: ReadonlyMap<string, string> = new Map()
) =>
  collectModules({
    baseDirectory,
    inventory: inventoryFor(baseDirectory, origins),
    producer: produceModuleRecordByExtension,
    resolver: resolveSpecifiers(baseDirectory, []),
    textOverrides,
  });

describe('module collection acceptance', () => {
  it('does not ignore a file only because ESLint would not visit it as a source', async () => {
    const fixture = await createFixture({
      'outside/helper.ts': 'export const helper = 1;\n',
      'src/app.ts': sourceImport(
        'helper',
        '../outside/helper.ts',
        'export const app = helper;\n'
      ),
      'src/orphan.ts': 'export const orphan = 1;\n',
    });
    try {
      const collection = collect(fixture.path, ['src']);
      expect(collection.records.has('src/orphan.ts')).toBe(true);
      expect(collection.records.has('outside/helper.ts')).toBe(true);
      expect(collection.resolutions.get('src/app.ts')?.[0]?.target).toEqual({
        path: 'outside/helper.ts',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('marks an unreadable imported file unverified instead of a conforming leaf', async () => {
    const fixture = await createFixture({
      'outside/helper.ts': 'export const helper = 1;\n',
      'src/app.ts': sourceImport(
        'helper',
        '../outside/helper.ts',
        'export const app = helper;\n'
      ),
    });
    const helperPath = nodePath.join(fixture.path, 'outside/helper.ts');
    nodeFs.chmodSync(helperPath, 0);
    try {
      const collection = collect(fixture.path, ['src']);
      expect(collection.records.has('outside/helper.ts')).toBe(false);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'outside/helper.ts' &&
            outcome.constraint === 'unverified/unreadable-external-file'
        )
      ).toBe(true);
    } finally {
      nodeFs.chmodSync(helperPath, 0o700);
      await fixture.rm();
    }
  });

  it('explores a reached external file and does not treat unavailable dependencies as leaves', async () => {
    const fixture = await createFixture({
      'outside/locked.ts': 'export const locked = 1;\n',
      'outside/x.ts': sourceImport(
        'locked',
        './locked.ts',
        sourceImport(
          'missing',
          './missing.ts',
          'export const external = locked;\n'
        )
      ),
      'src/app.ts': sourceImport(
        'external',
        '../outside/x.ts',
        'export const app = external;\n'
      ),
    });
    const lockedPath = nodePath.join(fixture.path, 'outside/locked.ts');
    nodeFs.chmodSync(lockedPath, 0);
    try {
      const collection = collect(fixture.path, ['src']);
      expect(collection.records.has('outside/x.ts')).toBe(true);
      expect(collection.records.has('outside/locked.ts')).toBe(false);
      expect(collection.records.has('outside/missing.ts')).toBe(false);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'outside/locked.ts' &&
            outcome.constraint === 'unverified/unreadable-external-file'
        )
      ).toBe(true);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'outside/x.ts' &&
            outcome.constraint === 'unverified/unresolved-import'
        )
      ).toBe(true);
    } finally {
      nodeFs.chmodSync(lockedPath, 0o700);
      await fixture.rm();
    }
  });

  it('terminates an entirely external cycle and keeps one record per file', async () => {
    const fixture = await createFixture({
      'outside/a.ts': sourceImport('b', './b.ts', 'export const a = b;\n'),
      'outside/b.ts': sourceImport('a', './a.ts', 'export const b = a;\n'),
      'src/app.ts': sourceImport(
        'a',
        '../outside/a.ts',
        'export const app = a;\n'
      ),
    });
    try {
      const collection = collect(fixture.path, ['src']);
      expect(collection.records.has('outside/a.ts')).toBe(true);
      expect(collection.records.has('outside/b.ts')).toBe(true);
      expect(collection.records.has('outside/b.ts')).toBe(true);
      expect(collection.resolutions.get('outside/a.ts')?.[0]?.target).toEqual({
        path: 'outside/b.ts',
        type: 'local-file',
      });
      expect(collection.resolutions.get('outside/b.ts')?.[0]?.target).toEqual({
        path: 'outside/a.ts',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('uses the lint text override instead of disk content', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const fromDisk = 1;\n',
    });
    try {
      const collection = collect(
        fixture.path,
        ['src'],
        new Map([['src/app.ts', 'export const fromOverride = 1;\n']])
      );
      const symbols = collection.records.get('src/app.ts')?.symbols ?? [];
      expect(symbols.some((symbol) => symbol.name === 'fromOverride')).toBe(
        true
      );
      expect(symbols.some((symbol) => symbol.name === 'fromDisk')).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('explores a workspace package through a node_modules symlink and ignores a real library', async () => {
    const fixture = await createFixture({
      'node_modules/left-pad/index.js': sourceImport(
        'secret',
        './secret.js',
        'export const pad = secret;\n'
      ),
      'node_modules/left-pad/package.json': JSON.stringify({
        main: './index.js',
        name: 'left-pad',
        type: 'module',
      }),
      'node_modules/left-pad/secret.js': 'export const secret = 1;\n',
      'package.json': JSON.stringify({ name: 'root', type: 'module' }),
      'packages/ws/dep.ts': 'export const dep = 1;\n',
      'packages/ws/index.ts': sourceImport(
        'dep',
        './dep.ts',
        'export const entry = dep;\n'
      ),
      'packages/ws/package.json': JSON.stringify({
        exports: { '.': './index.ts' },
        name: 'ws-pkg',
        type: 'module',
      }),
      'src/app.ts': `${sourceImport('entry', 'ws-pkg')}${sourceImport('pad', 'left-pad', 'export const app = entry + pad;\n')}`,
    });
    await nodeFs.promises.symlink(
      nodePath.join(fixture.path, 'packages/ws'),
      nodePath.join(fixture.path, 'node_modules/ws-pkg')
    );
    try {
      const collection = collect(fixture.path, ['src']);
      expect(collection.records.has('packages/ws/index.ts')).toBe(true);
      expect(collection.records.has('packages/ws/dep.ts')).toBe(true);
      expect(collection.records.has('node_modules/left-pad/index.js')).toBe(
        false
      );
      expect(collection.records.has('node_modules/left-pad/secret.js')).toBe(
        false
      );
      const library = collection.resolutions
        .get('src/app.ts')
        ?.find((resolution) => resolution.target.type === 'external-library');
      expect(library?.target).toEqual({
        packageName: 'left-pad',
        type: 'external-library',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('produces and resolves a record for a JavaScript file classification may mark Foreign', async () => {
    const fixture = await createFixture({
      'src/legacy/helper.js': 'export const helper = 1;\n',
      'src/legacy/widget.js': sourceImport(
        'helper',
        './helper.js',
        'export const widget = helper;\n'
      ),
    });
    try {
      const collection = collect(fixture.path, ['src']);
      expect(collection.records.get('src/legacy/widget.js')?.language).toBe(
        'script'
      );
      expect(
        collection.resolutions.get('src/legacy/widget.js')?.[0]?.target
      ).toEqual({
        path: 'src/legacy/helper.js',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('reports a deleted Tree file, a directory standing in for a file, and undecodable text', async () => {
    const fixture = await createFixture({
      'src/broken.ts': Buffer.from([255, 254]),
      'src/folder.ts/nested.ts': 'export const nested = 1;\n',
      'src/kept.ts': 'export const kept = 1;\n',
    });
    try {
      const inventory = inventoryFor(fixture.path, ['src']);
      const deletedId = inventory.items.length;
      const directoryId = deletedId + 1;
      const withGaps: TInventory = {
        items: [
          ...inventory.items,
          {
            depth: 1,
            id: deletedId,
            isSymlink: false,
            kind: 'file',
            parentId: null,
            path: 'src/deleted.ts',
            preorderEnd: deletedId,
            preorderStart: deletedId,
            realPath: 'src/deleted.ts',
            treeOrigin: 'src',
          },
          {
            depth: 1,
            id: directoryId,
            isSymlink: false,
            kind: 'file',
            parentId: null,
            path: 'src/folder.ts',
            preorderEnd: directoryId,
            preorderStart: directoryId,
            realPath: 'src/folder.ts',
            treeOrigin: 'src',
          },
        ],
        pathToId: new Map([
          ...inventory.pathToId,
          ['src/deleted.ts', deletedId],
          ['src/folder.ts', directoryId],
        ]),
        realPathToId: inventory.realPathToId,
      };
      const collection = collectModules({
        baseDirectory: fixture.path,
        inventory: withGaps,
        producer: produceModuleRecordByExtension,
        resolver: resolveSpecifiers(fixture.path, []),
        textOverrides: new Map(),
      });
      expect(collection.records.has('src/deleted.ts')).toBe(false);
      expect(collection.records.has('src/folder.ts')).toBe(false);
      expect(collection.records.has('src/broken.ts')).toBe(false);
      expect(collection.records.has('src/kept.ts')).toBe(true);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'src/deleted.ts' &&
            outcome.reason === 'File is missing' &&
            outcome.constraint === 'unverified/unreadable-entry'
        )
      ).toBe(true);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'src/folder.ts' &&
            outcome.reason === 'Path is a directory' &&
            outcome.constraint === 'unverified/unreadable-entry'
        )
      ).toBe(true);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'src/broken.ts' &&
            outcome.constraint === 'unverified/unreadable-entry' &&
            outcome.reason.includes('Text is not valid UTF-8')
        )
      ).toBe(true);
    } finally {
      await fixture.rm();
    }
  });

  it('emits non-literal dynamic import and unsupported syntax outcomes', async () => {
    const fixture = await createFixture({
      'src/dynamic.ts':
        'export const load = (name: string): Promise<unknown> => import(name);\n',
      'src/legacy.ts': 'export = 1;\n',
    });
    try {
      const collection = collect(fixture.path, ['src']);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'src/dynamic.ts' &&
            outcome.constraint === 'unverified/non-literal-dynamic-import'
        )
      ).toBe(true);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'src/legacy.ts' &&
            outcome.constraint === 'unverified/unsupported-syntax'
        )
      ).toBe(true);
    } finally {
      await fixture.rm();
    }
  });
});
