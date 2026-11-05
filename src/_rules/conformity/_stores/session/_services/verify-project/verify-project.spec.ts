import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { verifyProject } from './index.js';

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

const unimplementedParts = [
  'access-node-contract',
  'acyclicity',
  'category-role',
  'containment-matrix',
  'derive-horizontal-hierarchies',
  'derive-public-surface',
  'exclusive-forms',
  'external-dependencies',
  'foreign-node-isolation',
  'fractal-branch-unidirectionality',
  'fractal-branch-visibility',
  'fragment-anatomy',
  'fragment-encapsulation',
  'horizontal-hierarchies',
  'nomenclature',
  'path-alias-anchoring',
  'peer-separation',
  'private-category-visibility',
  'public-surface',
  're-entry-prohibition',
  're-export-prohibition',
  'root-node-discipline',
  'sub-graph-node-isolation',
  'symbol-uniqueness',
  'tree-frontier',
];

const compareText = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
};

describe('verifyProject', () => {
  it('returns one not-implemented outcome for every unbuilt part of a conforming root layer', async () => {
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
      const elements = result.outcomes.map((item) => item.outcome.element);
      const ordered = [...elements];
      ordered.sort(compareText);
      expect(ordered).toEqual(unimplementedParts);
      expect(result.outcomes).toHaveLength(unimplementedParts.length);
      for (const item of result.outcomes) {
        expect(item.anchorPath).toBe(configPath);
        expect(item.outcome.constraint).toBe('unverified/not-implemented');
        expect(item.outcome.family).toBe('unverified');
        expect(item.position).toEqual({ column: 1, line: 1 });
      }
      expect(result.collectedModules).toBe(true);
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
});
