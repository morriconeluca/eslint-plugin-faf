import { Linter } from 'eslint';
import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { parser as tsParser } from 'typescript-eslint';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  TInventory,
  TModuleCollection,
} from './_conformity@shared/_types/verification-model.type.js';

import { session } from './_stores/session/index.js';
import { createConformity } from './conformity.rule.js';
import {
  collectWatchedExternalFiles,
  readConfigFileSetting,
  verifyProject,
} from './conformity.util.js';

const packageJson = JSON.stringify({ type: 'module' });

const configSource = `export default {
  faf: {
    locals: [
      {
        roles: [{ name: 'util', category: '_utils' }],
        rootLayers: ['src'],
      },
    ],
  },
};
`;

const verifyConfigSource = (extra: string): string => `export default {
  faf: {
    locals: [
      {
        roles: [{ name: 'util', category: '_utils' }],
        subGraphRoles: [{ name: 'spec' }],
        rootLayers: ['src'],
      },
    ],
  },
  ${extra}
};
`;

const conformingFiles = {
  'package.json': packageJson,
  'src/_utils/widget/index.ts': "export { widget } from './widget.util.js';\n",
  'src/_utils/widget/widget.util.ts':
    "export function widget() {\n  return 'ok';\n}\n",
};

const runLint = (
  cwd: string,
  filePath: string,
  code: string,
  configFile?: string
): Linter.LintMessage[] => {
  const linter = new Linter({ cwd });
  const rule = createConformity('0.5.0');
  return linter.verify(
    code,
    {
      files: ['**/*.ts'],
      languageOptions: { parser: tsParser },
      plugins: { faf: { rules: { conformity: rule } } },
      rules: { 'faf/conformity': 'error' },
      ...(configFile !== undefined && { settings: { faf: { configFile } } }),
    },
    filePath
  );
};

const countCacheWrites = (directory: string, action: () => void): number => {
  const cachePath = nodePath.join(
    nodeFs.realpathSync(directory),
    'node_modules/.cache/eslint-plugin-faf/records.cache'
  );
  const originalRename = nodeFs.renameSync;
  let writes = 0;
  nodeFs.renameSync = (from, to) => {
    if (to === cachePath) {
      writes += 1;
    }
    originalRename(from, to);
  };
  try {
    action();
  } finally {
    nodeFs.renameSync = originalRename;
  }
  return writes;
};

describe('conformity', () => {
  beforeEach(() => {
    session.clear();
  });

  it('exposes one message per outcome family and no autofix or options', () => {
    const rule = createConformity('0.5.0');
    expect(rule.meta?.type).toBe('problem');
    expect(rule.meta?.schema).toEqual([]);
    expect(rule.meta?.docs?.description).toBe(
      'Verify that the project conforms to the Fractal Architecture Framework.'
    );
    expect(Object.hasOwn(rule.meta ?? {}, 'fix')).toBe(false);
    expect(rule.meta?.messages).toEqual({
      acyclicity: '{{constraint}}: {{message}} ({{reference}}).',
      classification: '{{constraint}}: {{message}} ({{reference}}).',
      configuration: '{{constraint}}: {{message}} ({{reference}}).',
      dependency: '{{constraint}}: {{message}} ({{reference}}).',
      symbol: '{{constraint}}: {{message}} ({{reference}}).',
      unverified: '{{constraint}}: {{message}} ({{reference}}).',
    });
  });

  it('reports configuration discovery failure when faf.config.ts is missing', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const app = 1;\n',
    });
    try {
      const messages = runLint(
        fixture.path,
        nodePath.join(fixture.path, 'src/app.ts'),
        'export const app = 1;\n'
      );
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain(
        'configuration/missing-config-file'
      );
      expect(messages[0]?.line).toBe(1);
      expect(messages[0]?.column).toBe(1);
    } finally {
      await fixture.rm();
    }
  });

  it('verifies once across multiple conforming files via session memo and invalidates on unsaved edit', async () => {
    const fixture = await createFixture({
      'custom/faf.config.ts': configSource,
      'custom/package.json': packageJson,
      'custom/src/_utils/widget/index.ts':
        "export { widget } from './widget.util.js';\n",
      'custom/src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
    });

    try {
      const indexFile = nodePath.join(
        fixture.path,
        'custom/src/_utils/widget/index.ts'
      );
      const utilFile = nodePath.join(
        fixture.path,
        'custom/src/_utils/widget/widget.util.ts'
      );

      const configDirectory = nodePath.join(fixture.path, 'custom');
      const firstRunWrites = countCacheWrites(configDirectory, () => {
        expect(
          runLint(
            fixture.path,
            indexFile,
            nodeFs.readFileSync(indexFile, 'utf8'),
            'custom/faf.config.ts'
          )
        ).toEqual([]);
        expect(
          runLint(
            fixture.path,
            utilFile,
            nodeFs.readFileSync(utilFile, 'utf8'),
            'custom/faf.config.ts'
          )
        ).toEqual([]);
      });
      expect(firstRunWrites).toBe(1);

      let editedMessages: Linter.LintMessage[] = [];
      const secondRunWrites = countCacheWrites(configDirectory, () => {
        editedMessages = runLint(
          fixture.path,
          indexFile,
          "import { missing } from './missing.js';\nexport { widget } from './widget.util.js';\n",
          'custom/faf.config.ts'
        );
      });
      expect(secondRunWrites).toBe(1);
      expect(editedMessages).toHaveLength(1);
      expect(editedMessages[0]?.message).toContain(
        'unverified/unresolved-import'
      );
      expect(editedMessages[0]?.line).toBe(1);
      expect(editedMessages[0]?.column).toBe(1);
    } finally {
      await fixture.rm();
    }
  });

  it('reads string settings.faf.configFile and ignores invalid shapes', () => {
    expect(
      readConfigFileSetting({ faf: { configFile: 'nested/faf.config.ts' } })
    ).toBe('nested/faf.config.ts');
    expect(readConfigFileSetting(undefined)).toBeUndefined();
    expect(readConfigFileSetting({ faf: { configFile: 1 } })).toBeUndefined();
    expect(readConfigFileSetting({ faf: null })).toBeUndefined();
    expect(readConfigFileSetting({ faf: [] })).toBeUndefined();
    expect(readConfigFileSetting({})).toBeUndefined();
  });

  it('collects package.json and external files while excluding tree files', () => {
    const baseDirectory = '/workspace';
    const emptyModules: TModuleCollection = {
      records: new Map(),
      resolutions: new Map(),
      unverifiedOutcomes: [],
    };
    const emptyInventory: TInventory = {
      items: [],
      pathToId: new Map(),
      realPathToId: new Map(),
    };
    expect(
      collectWatchedExternalFiles({
        baseDirectory,
        inventory: emptyInventory,
        modules: emptyModules,
        treeOrigins: ['/workspace/src'],
      })
    ).toEqual([nodePath.resolve('/workspace/package.json')]);

    const treeOrigin = nodePath.resolve('/workspace/src');
    const inventory: TInventory = {
      items: [
        {
          depth: 1,
          id: 0,
          isSymlink: false,
          kind: 'file',
          parentId: null,
          path: 'external-target.ts',
          preorderEnd: 0,
          preorderStart: 0,
          realPath: '/workspace/external-target.ts',
          treeOrigin: null,
        },
        {
          depth: 1,
          id: 1,
          isSymlink: false,
          kind: 'directory',
          parentId: null,
          path: 'external-dir',
          preorderEnd: 1,
          preorderStart: 1,
          realPath: '/workspace/external-dir',
          treeOrigin: null,
        },
        {
          depth: 2,
          id: 2,
          isSymlink: false,
          kind: 'file',
          parentId: null,
          path: 'src/main.ts',
          preorderEnd: 2,
          preorderStart: 2,
          realPath: '/workspace/src/main.ts',
          treeOrigin: 'src',
        },
      ],
      pathToId: new Map(),
      realPathToId: new Map(),
    };
    const modules: TModuleCollection = {
      records: new Map([
        [
          'external-bridge.ts',
          {
            exports: [],
            imports: [],
            language: 'binary',
            symbols: [],
            unsupportedSyntaxes: [],
          },
        ],
        [
          'src/main.ts',
          {
            exports: [],
            imports: [],
            language: 'binary',
            symbols: [],
            unsupportedSyntaxes: [],
          },
        ],
      ]),
      resolutions: new Map(),
      unverifiedOutcomes: [],
    };

    expect(
      collectWatchedExternalFiles({
        baseDirectory,
        inventory,
        modules,
        treeOrigins: [treeOrigin],
      })
    ).toEqual([
      nodePath.resolve('/workspace/external-bridge.ts'),
      nodePath.resolve('/workspace/external-target.ts'),
      nodePath.resolve('/workspace/package.json'),
    ]);
  });

  it('verifies a conforming root layer and returns expected tree origins and external files', async () => {
    const fixture = await createFixture({
      ...conformingFiles,
      'faf.config.ts': verifyConfigSource(''),
    });

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const result = verifyProject({
        configPath,
        packageVersion: '0.5.0',
        workingDirectory: fixture.path,
      });
      expect(result.outcomes).toEqual([]);
      expect(result.collectedModules).toBe(true);
      expect(result.treeOrigins).toEqual([nodePath.join(fixture.path, 'src')]);
      expect(result.externalFiles).toEqual([
        nodePath.join(fixture.path, 'package.json'),
      ]);
    } finally {
      await fixture.rm();
    }
  });

  it('halts on resolveDeclarations, buildInventory, and validateDeclarationReferences failures while preserving inventoryOutcomes', async () => {
    const formatBlocked = await createFixture({
      ...conformingFiles,
      'faf.config.ts': verifyConfigSource('extra: true,'),
    });
    try {
      const configPath = nodePath.join(formatBlocked.path, 'faf.config.ts');
      const result = verifyProject({
        configPath,
        packageVersion: '0.5.0',
        workingDirectory: formatBlocked.path,
      });
      expect(result.collectedModules).toBe(false);
      expect(result.externalFiles).toEqual([]);
      expect(result.treeOrigins).toEqual([]);
      expect(result.outcomes).toHaveLength(1);
      expect(result.outcomes[0]?.anchorPath).toBe(configPath);
      expect(result.outcomes[0]?.outcome.constraint).toBe(
        'configuration/unknown-property'
      );
      expect(result.outcomes[0]?.position).toEqual({ column: 1, line: 1 });
    } finally {
      await formatBlocked.rm();
    }

    const inventoryBlocked = await createFixture({
      'faf.config.ts': `export default { faf: { locals: [{ roles: [{ name: 'util', category: '_utils' }], rootLayers: ['missing'] }] } };`,
      'package.json': packageJson,
    });
    try {
      const result = verifyProject({
        configPath: nodePath.join(inventoryBlocked.path, 'faf.config.ts'),
        packageVersion: '0.5.0',
        workingDirectory: inventoryBlocked.path,
      });
      expect(result.collectedModules).toBe(false);
      expect(result.outcomes.length).toBeGreaterThan(0);
    } finally {
      await inventoryBlocked.rm();
    }

    const referenceBlocked = await createFixture({
      'faf.config.ts': `export default { faf: { locals: [{ roles: [{ name: 'util', category: '_utils' }], rootLayers: ['src'], externalDependencies: [{ from: ['src/main.ts'], to: ['missing.json'] }] }] } };`,
      'package.json': packageJson,
      'src/main.ts': 'export const main = 1;\n',
    });
    await nodeFs.promises.symlink(
      nodePath.join(referenceBlocked.path, 'src/main.ts'),
      nodePath.join(referenceBlocked.path, 'src/link.ts')
    );
    try {
      const configPath = nodePath.join(referenceBlocked.path, 'faf.config.ts');
      const result = verifyProject({
        configPath,
        packageVersion: '0.5.0',
        workingDirectory: referenceBlocked.path,
      });
      expect(result.collectedModules).toBe(false);
      expect(result.loadedFiles).toContain(configPath);
      expect(result.outcomes.map((item) => item.outcome.constraint)).toContain(
        'unverified/symbolic-link'
      );
      expect(result.outcomes.map((item) => item.outcome.constraint)).toContain(
        'configuration/non-existent-path'
      );
    } finally {
      await referenceBlocked.rm();
    }
  });

  it('supports horizontalHierarchyModels and horizontalHierarchies when members exist and halts when missing', async () => {
    const roles = `roles: [{ name: 'util', category: '_utils' }], subGraphRoles: [{ name: 'spec' }],`;
    const validFixture = await createFixture({
      'faf.config.ts': `export default { faf: { common: { horizontalHierarchyModels: [[['_atoms'], ['_molecules']]] }, locals: [{ ${roles} horizontalHierarchies: [{ hierarchy: [['_domain'], ['_ui']], path: 'src' }], rootLayers: ['src'] }] } };`,
      'package.json': packageJson,
      'src/_domain/.keep': '',
      'src/_ui/.keep': '',
    });
    try {
      const result = verifyProject({
        configPath: nodePath.join(validFixture.path, 'faf.config.ts'),
        packageVersion: '0.5.0',
        workingDirectory: validFixture.path,
      });
      expect(result.collectedModules).toBe(true);
    } finally {
      await validFixture.rm();
    }

    const missingChildFixture = await createFixture({
      'faf.config.ts': `export default { faf: { locals: [{ ${roles} horizontalHierarchies: [{ hierarchy: [['_domain'], ['_missing']], path: 'src' }], rootLayers: ['src'] }] } };`,
      'package.json': packageJson,
      'src/_domain/.keep': '',
    });
    try {
      const result = verifyProject({
        configPath: nodePath.join(missingChildFixture.path, 'faf.config.ts'),
        packageVersion: '0.5.0',
        workingDirectory: missingChildFixture.path,
      });
      expect(result.collectedModules).toBe(false);
      expect(result.outcomes[0]?.outcome.constraint).toBe(
        'configuration/non-existent-path'
      );
    } finally {
      await missingChildFixture.rm();
    }
  });

  it('anchors unclassifiable directory, applies relative overlay, anchors unresolved import, and populates crossings', async () => {
    const fixture = await createFixture({
      'external/bridge.ts':
        "import { target } from '../src/_utils/target/index.js';\nexport function bridge() { return target(); }\n",
      'faf.config.ts': verifyConfigSource(''),
      'package.json': packageJson,
      'src/_utils/source/index.ts':
        "import { bridge } from '../../../external/bridge.js';\nexport function source() { return bridge(); }\n",
      'src/_utils/target/index.ts':
        "export { target } from './target.util.js';\n",
      'src/_utils/target/target.util.ts':
        "export function target() {\n  return 'ok';\n}\n",
      'src/_utils/widget/index.ts':
        "import { widget } from './widget.util.js';\nimport { missing } from './missing.js';\nexport { widget };\n",
      'src/_utils/widget/widget.util.ts':
        "export function widget() {\n  return 'ok';\n}\n",
      'src/mystery/a.ts': 'export const earlier = 1;\n',
      'src/mystery/b.ts': 'export const later = 2;\n',
    });

    const treeFrontierModule = await import('./_norms/tree-frontier/index.js');
    const spy = vi.spyOn(treeFrontierModule, 'verifyTreeFrontier');
    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const result = verifyProject({
        configPath,
        packageVersion: '0.5.0',
        workingDirectory: fixture.path,
      });

      const directoryOutcome = result.outcomes.find(
        (item) =>
          item.outcome.constraint === 'classification/unclassifiable-directory'
      );
      expect(directoryOutcome?.anchorPath).toBe(
        nodePath.join(fixture.path, 'src/mystery/a.ts')
      );
      expect(directoryOutcome?.outcome.element).toBe('src/mystery');

      const unresolved = result.outcomes.find(
        (item) => item.outcome.constraint === 'unverified/unresolved-import'
      );
      expect(unresolved?.anchorPath).toBe(
        nodePath.join(fixture.path, 'src/_utils/widget/index.ts')
      );
      expect(unresolved?.position.line).toBe(2);

      expect(spy).toHaveBeenCalled();
      const model = spy.mock.calls[0]?.[0];
      expect(model?.crossings).toEqual([
        {
          chain: [
            'src/_utils/source/index.ts',
            'external/bridge.ts',
            'src/_utils/target/index.ts',
          ],
          destinationPath: 'src/_utils/target/index.ts',
          importIndex: 0,
          position: { column: 1, line: 1 },
          sourcePath: 'src/_utils/source/index.ts',
          specifier: '../../../external/bridge.js',
        },
      ]);

      const overlayResult = verifyProject({
        configPath: 'faf.config.ts',
        fileOverlays: new Map([
          [
            'src/_utils/target/index.ts',
            "import { missingOverlay } from './missing-overlay.js';\nexport { target } from './target.util.js';\n",
          ],
        ]),
        packageVersion: '0.5.0',
        workingDirectory: fixture.path,
      });
      expect(
        overlayResult.outcomes.some(
          (item) =>
            item.outcome.constraint === 'unverified/unresolved-import' &&
            item.anchorPath ===
              nodePath.join(fixture.path, 'src/_utils/target/index.ts')
        )
      ).toBe(true);
    } finally {
      spy.mockRestore();
      await fixture.rm();
    }
  });

  it('analyzes an active file overlay located inside an ignored root artifact directory while ignoring non-base overlays', async () => {
    const fixture = await createFixture({
      'build/active.ts': 'export const active = 1;\n',
      'faf.config.ts': verifyConfigSource(''),
      'package.json': packageJson,
      'src/_utils/widget/index.ts':
        "export { widget } from './widget.util.js';\n",
      'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const result = verifyProject({
        configPath,
        fileOverlays: new Map([
          [fixture.path, ''],
          [
            nodePath.join(fixture.path, '../outside.ts'),
            'export const x = 1;\n',
          ],
          [
            nodePath.join(fixture.path, 'build/active.ts'),
            "import '../src/_utils/widget/widget.util.js';\nexport const active = 1;\n",
          ],
          [
            nodePath.join(fixture.path, 'faf.config.ts'),
            nodeFs.readFileSync(configPath, 'utf8'),
          ],
        ]),
        packageVersion: '0.5.0',
        workingDirectory: fixture.path,
      });

      expect(
        result.outcomes.some(
          (item) =>
            item.outcome.constraint === 'dependency/tree-opacity' &&
            item.anchorPath === nodePath.join(fixture.path, 'build/active.ts')
        )
      ).toBe(true);
    } finally {
      await fixture.rm();
    }
  });
});
