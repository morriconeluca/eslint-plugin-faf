import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it, vi } from 'vitest';

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

const absent: TScenarioMessage = {
  ...outcome,
  constraint: 'unverified/not-implemented',
  element: 'acyclicity',
  filePath: 'fafconfig.ts',
  message:
    "unverified/not-implemented: 'acyclicity' is not implemented (D-03).",
  messageId: 'unverified',
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
      expect(result.unimplementedParts.get('acyclicity')).toEqual([absent]);
      expectScenario(result, 'acyclicity', [outcome]);
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
      expect(
        forward.messages.some(
          (message) => message.constraint === 'unverified/not-implemented'
        )
      ).toBe(false);
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

  it('only separates exact not-implemented outcomes and keeps duplicate outcomes', async () => {
    const fixture = await createProject(tree, config);
    const messages = [
      {
        column: 1,
        line: 10,
        message: absent.message,
        messageId: 'unverified',
        ruleId: 'faf/conformity',
        severity: 2,
      },
      {
        column: 2,
        line: 2,
        message: absent.message,
        messageId: 'unverified',
        ruleId: 'faf/conformity',
        severity: 2,
      },
      {
        column: 1,
        line: 2,
        message: 'unverified/not-implemented: Unexpected wording',
        messageId: 'unverified',
        ruleId: 'faf/conformity',
        severity: 2,
      },
      {
        column: 1,
        line: 1,
        message: absent.message,
        messageId: 'unverified',
        ruleId: 'another/rule',
        severity: 2,
      },
    ] satisfies ESLint.LintResult['messages'];
    const lint = vi.spyOn(ESLint.prototype, 'lintFiles').mockResolvedValue([
      {
        errorCount: 4,
        fatalErrorCount: 0,
        filePath: fixture.getPath('fafconfig.ts'),
        fixableErrorCount: 0,
        fixableWarningCount: 0,
        messages,
        suppressedMessages: [],
        usedDeprecatedRules: [],
        warningCount: 0,
      },
    ]);
    try {
      const result = await lintScenario(fixture.path);
      expect(
        result.messages.map((message) => [
          message.line,
          message.column,
          message.constraint,
        ])
      ).toEqual([
        [1, 1, null],
        [2, 1, 'unverified/not-implemented'],
      ]);
      expect(
        result.unimplementedParts
          .get('acyclicity')
          ?.map((message) => [message.line, message.column])
      ).toEqual([
        [2, 2],
        [10, 1],
      ]);
      expect(() => {
        expectScenario(result, 'acyclicity', []);
      }).toThrow();
    } finally {
      lint.mockRestore();
      await fixture.rm();
    }
  });

  it('checks the expected outcomes immediately when the responsible part is implemented', () => {
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

  it('rejects absent-part markers with extra, duplicate, or mismatched evidence', () => {
    const unimplementedParts = new Map([['acyclicity', [absent]]]);
    expect(() => {
      expectScenario(
        { messages: [outcome], unimplementedParts },
        'acyclicity',
        [outcome]
      );
    }).toThrow();
    expect(() => {
      expectScenario(
        {
          messages: [],
          unimplementedParts: new Map([['acyclicity', [absent, absent]]]),
        },
        'acyclicity',
        []
      );
    }).toThrow();
    expect(() => {
      expectScenario(
        {
          messages: [],
          unimplementedParts: new Map([
            ['acyclicity', [{ ...absent, element: 'tree-frontier' }]],
          ]),
        },
        'acyclicity',
        []
      );
    }).toThrow();
  });
});
