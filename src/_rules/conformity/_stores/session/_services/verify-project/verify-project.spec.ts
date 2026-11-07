import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { verifyProject } from './verify-project.service.js';

const packageJson = JSON.stringify({ type: 'module' });

const configSource = (extra: string): string => `export default {
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

describe('verifyProject', () => {
  it('returns zero outcomes for a conforming root layer', async () => {
    const fixture = await createFixture({
      ...conformingFiles,
      'fafconfig.ts': configSource(''),
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = verifyProject({
        configPath,
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

  it('anchors an unknown configuration property to fafconfig.ts and stops', async () => {
    const fixture = await createFixture({
      ...conformingFiles,
      'fafconfig.ts': configSource('extra: true,'),
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = verifyProject({
        configPath,
        workingDirectory: fixture.path,
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
      await fixture.rm();
    }
  });

  it('anchors an unclassifiable directory to the first lintable child', async () => {
    const fixture = await createFixture({
      ...conformingFiles,
      'fafconfig.ts': configSource(''),
      'src/mystery/a.ts': 'export const earlier = 1;\n',
      'src/mystery/b.ts': 'export const later = 2;\n',
    });

    try {
      const result = verifyProject({
        configPath: nodePath.join(fixture.path, 'fafconfig.ts'),
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
    } finally {
      await fixture.rm();
    }
  });

  it('applies a relative source overlay when verifying imports', async () => {
    const fixture = await createFixture({
      ...conformingFiles,
      'fafconfig.ts': configSource(''),
    });

    try {
      const result = verifyProject({
        configPath: 'fafconfig.ts',
        fileOverlays: new Map([
          [
            'src/_utils/widget/index.ts',
            "import { missing } from './missing.js';\nexport { widget } from './widget.util.js';\n",
          ],
        ]),
        workingDirectory: fixture.path,
      });
      expect(
        result.outcomes.some(
          (item) => item.outcome.constraint === 'unverified/unresolved-import'
        )
      ).toBe(true);
    } finally {
      await fixture.rm();
    }
  });

  it('anchors an unresolved import to the file and the import line', async () => {
    const fixture = await createFixture({
      ...conformingFiles,
      'fafconfig.ts': configSource(''),
      'src/_utils/widget/index.ts':
        "import { widget } from './widget.util.js';\nimport { missing } from './missing.js';\nexport { widget };\n",
    });

    try {
      const result = verifyProject({
        configPath: nodePath.join(fixture.path, 'fafconfig.ts'),
        workingDirectory: fixture.path,
      });
      const unresolved = result.outcomes.find(
        (item) => item.outcome.constraint === 'unverified/unresolved-import'
      );
      expect(unresolved?.anchorPath).toBe(
        nodePath.join(fixture.path, 'src/_utils/widget/index.ts')
      );
      expect(unresolved?.position.line).toBe(2);
    } finally {
      await fixture.rm();
    }
  });

  it('populates verification model crossings from a real project with external files', async () => {
    const fixture = await createFixture({
      'external/bridge.ts':
        "import { target } from '../src/_utils/target/index.js';\nexport function bridge() { return target(); }\n",
      'fafconfig.ts': configSource(''),
      'package.json': packageJson,
      'src/_utils/source/index.ts':
        "import { bridge } from '../../../external/bridge.js';\nexport function source() { return bridge(); }\n",
      'src/_utils/target/index.ts':
        "export { target } from './target.util.js';\n",
      'src/_utils/target/target.util.ts':
        "export function target() {\n  return 'ok';\n}\n",
    });

    const treeFrontierModule = await import('./_norms/tree-frontier/index.js');
    const spy = vi.spyOn(treeFrontierModule, 'verifyTreeFrontier');
    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      verifyProject({
        configPath,
        workingDirectory: fixture.path,
      });

      expect(spy).toHaveBeenCalled();
      const model = spy.mock.calls[0]?.[0];
      expect(model).toBeDefined();
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
    } finally {
      spy.mockRestore();
      await fixture.rm();
    }
  });
});
