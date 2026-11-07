import { beforeAll, describe, expect, it } from 'vitest';

import type { TScenarioMessage } from '../support/acceptance-project.js';

import {
  createProject,
  expectScenario,
  lintProject,
  lintScenario,
  warmupESLint,
} from '../support/acceptance-project.js';

const config = {
  faf: {
    locals: [
      { roles: [{ category: '_utils', name: 'util' }], rootLayers: ['src'] },
    ],
  },
};

const tree = {
  'src/_utils/widget/index.ts': "export { widget } from './widget.util.js';\n",
  'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
};

const outcome: TScenarioMessage = {
  column: 1,
  constraint: 'classification/unclassifiable-directory',
  element: 'src/mystery',
  filePath: 'src/mystery/a.ts',
  line: 1,
  message:
    "classification/unclassifiable-directory: 'src/mystery' has no unique Logical Domain classification (FAF §6.9).",
  messageId: 'classification',
  ruleId: 'faf/conformity',
  severity: 2,
};

describe('acceptance project support', () => {
  beforeAll(warmupESLint, 120_000);

  it('creates a real project from a tree and a configuration object', async () => {
    const fixture = await createProject(tree, config);
    try {
      expect(await fixture.readFile('fafconfig.ts', 'utf8')).toBe(
        "export default { faf: { locals: [ { roles: [ { category: '_utils', name: 'util' } ], rootLayers: [ 'src' ] } ] } };\n"
      );
      expect(await fixture.readJson('package.json')).toEqual({
        type: 'module',
      });
      expect(
        await fixture.readFile('src/_utils/widget/widget.util.ts', 'utf8')
      ).toBe('export const widget = 1;\n');
      const result = await lintScenario(fixture.path);
      expect(result.messages).toEqual([]);
      expect(result.unimplementedParts.size).toBe(0);
      expectScenario(result, 'acyclicity', []);
      expect(await lintProject(fixture.path)).toHaveLength(3);
    } finally {
      await fixture.rm();
    }
  });

  it('preserves classification and unresolved-import outcomes in both visit orders', async () => {
    const fixture = await createProject(
      {
        ...tree,
        'src/mystery/a.ts': "import './missing.js';\n",
        'src/mystery/b.ts': 'export const later = 1;\n',
      },
      config
    );
    try {
      const files = ['fafconfig.ts', 'src/mystery/a.ts', 'src/mystery/b.ts'];
      const forward = await lintScenario(fixture.path, files);
      const reverse = await lintScenario(fixture.path, [
        'src/mystery/b.ts',
        'src/mystery/a.ts',
        'fafconfig.ts',
      ]);
      expect(reverse).toEqual(forward);
      expect(forward.messages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            column: 1,
            constraint: 'classification/unclassifiable-directory',
            element: 'src/mystery',
            filePath: 'src/mystery/a.ts',
            line: 1,
            messageId: 'classification',
          }),
          expect.objectContaining({
            constraint: 'unverified/unresolved-import',
            element: 'src/mystery/a.ts',
            filePath: 'src/mystery/a.ts',
            messageId: 'unverified',
          }),
        ])
      );
    } finally {
      await fixture.rm();
    }
  });

  it('preserves unknown properties and parser errors instead of approving them', async () => {
    const fixture = await createProject(
      { 'src/a.ts': 'export const = ;' },
      {
        ...config,
        extra: true,
      }
    );
    try {
      const result = await lintScenario(fixture.path);
      expect(result.messages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            constraint: 'configuration/unknown-property',
            messageId: 'configuration',
          }),
          expect.objectContaining({
            constraint: null,
            element: 'src/a.ts',
            filePath: 'src/a.ts',
            messageId: null,
            ruleId: null,
            severity: 2,
          }),
        ])
      );
      expect(result.unimplementedParts.size).toBe(0);
    } finally {
      await fixture.rm();
    }
  });

  it('preserves explicitly undefined configuration properties for runtime validation', async () => {
    const explicitUndefined = Object.defineProperty({ ...config }, 'extra', {
      enumerable: true,
    });
    const fixture = await createProject(tree, explicitUndefined);
    try {
      const result = await lintScenario(fixture.path);
      expect(result.messages).toEqual([
        expect.objectContaining({
          constraint: 'configuration/unknown-property',
          messageId: 'configuration',
        }),
      ]);
    } finally {
      await fixture.rm();
    }
  });

  it('checks the expected outcomes', () => {
    const result = { messages: [outcome], unimplementedParts: new Map() };
    expect(() => {
      expectScenario(result, 'classification-completeness', [outcome]);
    }).not.toThrow();
    expect(() => {
      expectScenario(result, 'classification-completeness', []);
    }).toThrow();
    expect(() => {
      expectScenario(
        { ...result, messages: [] },
        'classification-completeness',
        [outcome]
      );
    }).toThrow();
  });
});
