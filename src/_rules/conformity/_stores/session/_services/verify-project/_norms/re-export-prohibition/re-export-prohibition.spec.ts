import { describe, expect, it } from 'vitest';

import type {
  TLanguageKind,
  TModuleExport,
  TModuleImport,
  TModuleRecord,
} from '../../../../_session@shared/_types/module-record.type.js';
import type { TItemClassification } from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyReExportProhibition } from './index.js';

const createItem = (
  overrides: Partial<TItemClassification> &
    Pick<TItemClassification, 'entryKind' | 'itemId' | 'path'>
): TItemClassification => ({
  domainKind: null,
  fragmentInternalRank: null,
  imposedRoleName: null,
  nodeKind: null,
  relationalQualifications: {
    isParentCategory: false,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    parentFragmentPath: null,
  },
  role: { kind: 'explicit', roleName: 'util' },
  ...overrides,
});

const createRecord = (
  exports: readonly TModuleExport[] = [],
  imports: readonly TModuleImport[] = [],
  language: TLanguageKind = 'script'
): TModuleRecord => ({
  exports,
  imports,
  language,
  symbols: [],
  unsupportedSyntaxes: [],
});

const buildModel = (
  items: readonly {
    readonly classification: TItemClassification;
    readonly record?: TModuleRecord;
  }[]
): TVerificationModel => {
  const base = verificationModel();
  const classifications = items.map((item) => item.classification);
  const byPath = new Map(classifications.map((item) => [item.path, item]));
  const byItemId = new Map(classifications.map((item) => [item.itemId, item]));
  const records = new Map<string, TModuleRecord>();

  for (const item of items) {
    if (item.record !== undefined) {
      records.set(item.classification.path, item.record);
    }
  }

  return {
    ...base,
    modules: {
      ...base.modules,
      records,
    },
    taxonomy: {
      byItemId,
      byPath,
      classifications,
    },
  };
};

describe('verifyReExportProhibition', () => {
  it('returns empty array when codebase has no re-exports', () => {
    const model = buildModel([
      {
        classification: createItem({
          entryKind: 'file',
          itemId: 1,
          path: 'src/_utils/first.util.ts',
        }),
        record: createRecord([
          {
            exportedName: 'first',
            isTypeOnly: false,
            origin: { symbolName: 'first', type: 'local-symbol' },
            position: { column: 1, line: 1 },
          },
        ]),
      },
    ]);

    expect(verifyReExportProhibition(model)).toEqual([]);
  });

  describe('syntax table scenarios', () => {
    it('detects export { value } from specifier', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'value',
                isTypeOnly: false,
                origin: {
                  importedName: 'value',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'export-named-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([
        {
          constraint: 'symbol/re-export-prohibition',
          element: 'src/_utils/first.util.ts',
          family: 'symbol',
          message: "'src/_utils/first.util.ts' re-exports an imported Symbol",
          normativeReference: 'FAF §5',
          position: { column: 1, line: 1 },
        },
      ]);
    });

    it('detects export { value as renamed } from specifier', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'renamed',
                isTypeOnly: false,
                origin: {
                  importedName: 'value',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'export-named-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });

    it('detects export { default } from specifier', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'default',
                isTypeOnly: false,
                origin: {
                  importedName: 'default',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'export-named-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });

    it('detects export * from specifier', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: '*',
                isTypeOnly: false,
                origin: { specifier: './dep.js', type: 'export-all' },
                position: { column: 1, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'export-all-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });

    it('detects export * as source from specifier', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'source',
                isTypeOnly: false,
                origin: { specifier: './dep.js', type: 'namespace' },
                position: { column: 1, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'export-all-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });

    it('detects export type { Value } from specifier', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'Value',
                isTypeOnly: true,
                origin: {
                  importedName: 'Value',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 15, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: true,
                kind: 'export-type-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });

    it('detects export type * from specifier', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: '*',
                isTypeOnly: true,
                origin: { specifier: './dep.js', type: 'export-all' },
                position: { column: 1, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: true,
                kind: 'export-type-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });

    it('detects import { value } and export { value }', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'value',
                isTypeOnly: false,
                origin: {
                  importedName: 'value',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 2 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'named-import',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([
        {
          constraint: 'symbol/re-export-prohibition',
          element: 'src/_utils/first.util.ts',
          family: 'symbol',
          message: "'src/_utils/first.util.ts' re-exports an imported Symbol",
          normativeReference: 'FAF §5',
          position: { column: 1, line: 2 },
        },
      ]);
    });

    it('detects import { value as local } and export { local as value }', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'value',
                isTypeOnly: false,
                origin: {
                  importedName: 'value',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 2 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'named-import',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });

    it('detects import value and export default value', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'default',
                isTypeOnly: false,
                origin: {
                  importedName: 'default',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 1, line: 2 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'default-import',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });

    it('detects import * as source and export { source }', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'source',
                isTypeOnly: false,
                origin: { specifier: './dep.js', type: 'namespace' },
                position: { column: 10, line: 2 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'namespace-import',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });

    it('detects import type { Value } and export type { Value }', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/first.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'Value',
                isTypeOnly: true,
                origin: {
                  importedName: 'Value',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 15, line: 2 },
              },
            ],
            [
              {
                isTypeOnly: true,
                kind: 'type-only-import',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });
  });

  describe('local export provenance that is not a re-export', () => {
    it('allows a local function that consumes an imported dependency', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/execute.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'execute',
                isTypeOnly: false,
                origin: { symbolName: 'execute', type: 'local-symbol' },
                position: { column: 8, line: 2 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'named-import',
                position: { column: 1, line: 1 },
                specifier: './source.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([]);
    });

    it('allows a separate local export declaration', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/local.util.ts',
          }),
          record: createRecord([
            {
              exportedName: 'value',
              isTypeOnly: false,
              origin: { symbolName: 'value', type: 'local-symbol' },
              position: { column: 27, line: 1 },
            },
          ]),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([]);
    });

    it('allows a declaration initialized with an imported binding', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/derived.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'y',
                isTypeOnly: false,
                origin: { symbolName: 'y', type: 'local-symbol' },
                position: { column: 14, line: 2 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'named-import',
                position: { column: 1, line: 1 },
                specifier: './source.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([]);
    });
  });

  describe('single outcome per export instruction with multiple names', () => {
    it('produces one outcome for direct export with multiple names', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/multi.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'a',
                isTypeOnly: false,
                origin: {
                  importedName: 'a',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 1 },
              },
              {
                exportedName: 'b',
                isTypeOnly: false,
                origin: {
                  importedName: 'b',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 13, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'export-named-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      const outcomes = verifyReExportProhibition(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.position).toEqual({ column: 1, line: 1 });
    });

    it('produces one outcome for local export statement with multiple names', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/multi.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'a',
                isTypeOnly: false,
                origin: {
                  importedName: 'a',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 2 },
              },
              {
                exportedName: 'b',
                isTypeOnly: false,
                origin: {
                  importedName: 'b',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 13, line: 2 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'named-import',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      const outcomes = verifyReExportProhibition(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.position).toEqual({ column: 1, line: 2 });
    });
  });

  describe('scope of application across node types', () => {
    it('applies to Sub-Graph Nodes', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            nodeKind: 'sub-graph-node',
            path: 'src/_utils/button.spec.ts',
            role: { kind: 'explicit', roleName: 'spec' },
          }),
          record: createRecord(
            [
              {
                exportedName: 'a',
                isTypeOnly: false,
                origin: {
                  importedName: 'a',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'export-named-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toHaveLength(1);
    });

    it('does not apply to Root Nodes with absent role', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            nodeKind: 'root-node',
            path: 'src/main.ts',
            role: { kind: 'absent', roleName: null },
          }),
          record: createRecord(
            [
              {
                exportedName: 'a',
                isTypeOnly: false,
                origin: {
                  importedName: 'a',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'export-named-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([]);
    });

    it('does not apply to Access Nodes with absent role', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            nodeKind: 'access-node',
            path: 'src/_utils/widget/index.ts',
            role: { kind: 'absent', roleName: null },
          }),
          record: createRecord(
            [
              {
                exportedName: 'widget',
                isTypeOnly: false,
                origin: {
                  importedName: 'widget',
                  specifier: './widget.util.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'export-named-from',
                position: { column: 1, line: 1 },
                specifier: './widget.util.js',
              },
            ]
          ),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([]);
    });

    it('does not apply to Foreign Nodes with absent role', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            nodeKind: 'foreign-node',
            path: 'src/README.md',
            role: { kind: 'absent', roleName: null },
          }),
          record: createRecord([], [], 'binary'),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([]);
    });

    it('does not apply to Assets even with explicit or implicit roles', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_styles/theme.css',
            role: { kind: 'implicit', roleName: 'style' },
          }),
          record: createRecord([], [], 'style'),
        },
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 2,
            path: 'src/_components/button/button.module.css',
            role: { kind: 'explicit', roleName: 'module' },
          }),
          record: createRecord([], [], 'style'),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([]);
    });

    it('skips items when module record is missing from collection', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/unrecorded.util.ts',
          }),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([]);
    });

    it('skips directory items in classification', () => {
      const model = buildModel([
        {
          classification: createItem({
            domainKind: 'category',
            entryKind: 'directory',
            itemId: 1,
            path: 'src/_utils',
            role: { kind: 'absent', roleName: null },
          }),
        },
      ]);

      expect(verifyReExportProhibition(model)).toEqual([]);
    });
  });

  describe('determinism and immutability', () => {
    it('produces identical deterministic order under classification permutation', () => {
      const firstItem = {
        classification: createItem({
          entryKind: 'file',
          itemId: 1,
          path: 'src/_utils/a.util.ts',
        }),
        record: createRecord(
          [
            {
              exportedName: 'first',
              isTypeOnly: false,
              origin: {
                importedName: 'first',
                specifier: './dep.js',
                type: 'imported-binding',
              },
              position: { column: 10, line: 1 },
            },
          ],
          [
            {
              isTypeOnly: false,
              kind: 'export-named-from',
              position: { column: 1, line: 1 },
              specifier: './dep.js',
            },
          ]
        ),
      };

      const secondItem = {
        classification: createItem({
          entryKind: 'file',
          itemId: 2,
          path: 'src/_utils/b.util.ts',
        }),
        record: createRecord(
          [
            {
              exportedName: 'second',
              isTypeOnly: false,
              origin: {
                importedName: 'second',
                specifier: './dep.js',
                type: 'imported-binding',
              },
              position: { column: 10, line: 2 },
            },
          ],
          [
            {
              isTypeOnly: false,
              kind: 'export-named-from',
              position: { column: 1, line: 2 },
              specifier: './dep.js',
            },
          ]
        ),
      };

      const forwardModel = buildModel([firstItem, secondItem]);
      const backwardModel = buildModel([secondItem, firstItem]);

      const forwardOutcomes = verifyReExportProhibition(forwardModel);
      const backwardOutcomes = verifyReExportProhibition(backwardModel);

      expect(forwardOutcomes).toEqual(backwardOutcomes);
      expect(forwardOutcomes).toHaveLength(2);
      expect(forwardOutcomes[0]?.element).toBe('src/_utils/a.util.ts');
      expect(forwardOutcomes[1]?.element).toBe('src/_utils/b.util.ts');
    });

    it('does not mutate input model', () => {
      const model = buildModel([
        {
          classification: createItem({
            entryKind: 'file',
            itemId: 1,
            path: 'src/_utils/a.util.ts',
          }),
          record: createRecord(
            [
              {
                exportedName: 'val',
                isTypeOnly: false,
                origin: {
                  importedName: 'val',
                  specifier: './dep.js',
                  type: 'imported-binding',
                },
                position: { column: 10, line: 1 },
              },
            ],
            [
              {
                isTypeOnly: false,
                kind: 'export-named-from',
                position: { column: 1, line: 1 },
                specifier: './dep.js',
              },
            ]
          ),
        },
      ]);

      const snapshot = JSON.stringify(model, (_key, value: unknown) =>
        value instanceof Map ? [...value] : value
      );

      verifyReExportProhibition(model);

      const afterSnapshot = JSON.stringify(model, (_key, value: unknown) =>
        value instanceof Map ? [...value] : value
      );

      expect(afterSnapshot).toBe(snapshot);
    });
  });
});
