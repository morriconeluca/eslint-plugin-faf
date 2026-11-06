import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TModuleRecord,
  TRootSymbol,
} from '../../../../../../_session@shared/_types/module-record.type.js';
import type {
  TItemClassification,
  TNodeKind,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventoryItem } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { collectSymbolOutcomes } from './collect-symbol-outcomes.util.js';

const makeFileItem = (
  id: number,
  path: string,
  parentId: null | number
): TInventoryItem => ({
  depth: 2,
  id,
  isSymlink: false,
  kind: 'file',
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const makeDirectoryItem = (id: number, path: string): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind: 'directory',
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const makeClassification = (
  itemId: number,
  path: string,
  nodeKind: null | TNodeKind
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId,
  nodeKind,
  path,
  relationalQualifications: {
    isParentCategory: false,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    parentFragmentPath: null,
  },
  role: { kind: 'absent', roleName: null },
});

const makeRecord = (
  symbols: readonly TRootSymbol[],
  exports: readonly TModuleExport[],
  language: 'binary' | 'script' | 'style' = 'script'
): TModuleRecord => ({
  exports,
  imports: [],
  language,
  symbols,
  unsupportedSyntaxes: [],
});

const makeEdge = (
  sourcePath: string,
  destinationPath: string,
  specifier: string
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath,
  specifier,
  syntaxKind: 'named-import',
});

describe('collectSymbolOutcomes', () => {
  it('returns empty array when model has no access nodes', () => {
    expect(collectSymbolOutcomes(verificationModel())).toEqual([]);
  });

  it('skips non-script access records or missing records', () => {
    const base = verificationModel();
    const fragmentDirectory = makeDirectoryItem(0, 'src/_components/button');
    const accessItem = makeFileItem(1, 'src/_components/button/index.ts', 0);
    const accessClass = makeClassification(1, accessItem.path, 'access-node');

    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [fragmentDirectory, accessItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      modules: {
        ...base.modules,
        records: new Map([[accessItem.path, makeRecord([], [], 'binary')]]),
      },
      taxonomy: {
        byItemId: new Map([[1, accessClass]]),
        byPath: new Map([[accessItem.path, accessClass]]),
        classifications: [accessClass],
      },
    };

    expect(collectSymbolOutcomes(model)).toEqual([]);
  });

  it('reports own symbols when access node defines root-scope symbols', () => {
    const base = verificationModel();
    const fragmentDirectory = makeDirectoryItem(0, 'src/_components/button');
    const accessItem = makeFileItem(1, 'src/_components/button/index.ts', 0);
    const accessClass = makeClassification(1, accessItem.path, 'access-node');

    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [fragmentDirectory, accessItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      modules: {
        ...base.modules,
        records: new Map([
          [
            accessItem.path,
            makeRecord(
              [
                {
                  name: 'ownConstant',
                  position: { column: 1, line: 1 },
                  space: 'value',
                },
              ],
              []
            ),
          ],
        ]),
      },
      taxonomy: {
        byItemId: new Map([[1, accessClass]]),
        byPath: new Map([[accessItem.path, accessClass]]),
        classifications: [accessClass],
      },
    };

    const outcomes = collectSymbolOutcomes(model);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('symbol/access-node-own-symbols');
    expect(outcomes[0]?.element).toBe(accessItem.path);
  });

  it('omits master-export violation when Master is missing, non-script, or has invalid symbol count', () => {
    const base = verificationModel();
    const fragmentDirectory = makeDirectoryItem(0, 'src/_components/button');
    const accessItem = makeFileItem(1, 'src/_components/button/index.ts', 0);
    const accessClass = makeClassification(1, accessItem.path, 'access-node');

    const modelMissingMaster: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [fragmentDirectory, accessItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      modules: {
        ...base.modules,
        records: new Map([[accessItem.path, makeRecord([], [])]]),
      },
      taxonomy: {
        byItemId: new Map([[1, accessClass]]),
        byPath: new Map([[accessItem.path, accessClass]]),
        classifications: [accessClass],
      },
    };
    expect(collectSymbolOutcomes(modelMissingMaster)).toEqual([]);

    const masterItem = makeFileItem(
      2,
      'src/_components/button/button.component.ts',
      0
    );
    const masterClass = makeClassification(2, masterItem.path, 'master-node');

    const modelTwoSymbols: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [fragmentDirectory, accessItem, masterItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      modules: {
        ...base.modules,
        records: new Map([
          [accessItem.path, makeRecord([], [])],
          [
            masterItem.path,
            makeRecord(
              [
                {
                  name: 'sym1',
                  position: { column: 1, line: 1 },
                  space: 'value',
                },
                {
                  name: 'sym2',
                  position: { column: 1, line: 2 },
                  space: 'value',
                },
              ],
              []
            ),
          ],
        ]),
      },
      taxonomy: {
        byItemId: new Map([
          [1, accessClass],
          [2, masterClass],
        ]),
        byPath: new Map([
          [accessItem.path, accessClass],
          [masterItem.path, masterClass],
        ]),
        classifications: [accessClass, masterClass],
      },
    };
    expect(collectSymbolOutcomes(modelTwoSymbols)).toEqual([]);
  });

  it('admits named export * from Master and rejects export * when Master only exports default', () => {
    const base = verificationModel();
    const fragmentDirectory = makeDirectoryItem(0, 'src/_components/button');
    const accessItem = makeFileItem(1, 'src/_components/button/index.ts', 0);
    const masterItem = makeFileItem(
      2,
      'src/_components/button/button.component.ts',
      0
    );

    const accessClass = makeClassification(1, accessItem.path, 'access-node');
    const masterClass = makeClassification(2, masterItem.path, 'master-node');
    const edge = makeEdge(
      accessItem.path,
      masterItem.path,
      './button.component.js'
    );

    const accessRecordExportAll = makeRecord(
      [],
      [
        {
          exportedName: '*',
          isTypeOnly: false,
          origin: { specifier: './button.component.js', type: 'export-all' },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const masterNamedRecord = makeRecord(
      [{ name: 'Button', position: { column: 1, line: 1 }, space: 'value' }],
      [
        {
          exportedName: 'Button',
          isTypeOnly: false,
          origin: { symbolName: 'Button', type: 'local-symbol' },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const masterDefaultRecord = makeRecord(
      [{ name: 'Button', position: { column: 1, line: 1 }, space: 'value' }],
      [
        {
          exportedName: 'default',
          isTypeOnly: false,
          origin: { symbolName: 'Button', type: 'local-symbol' },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const admittedModel: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [fragmentDirectory, accessItem, masterItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edge],
        edgesBySourcePath: new Map([[accessItem.path, [0]]]),
      },
      modules: {
        ...base.modules,
        records: new Map([
          [accessItem.path, accessRecordExportAll],
          [masterItem.path, masterNamedRecord],
        ]),
      },
      taxonomy: {
        byItemId: new Map([
          [1, accessClass],
          [2, masterClass],
        ]),
        byPath: new Map([
          [accessItem.path, accessClass],
          [masterItem.path, masterClass],
        ]),
        classifications: [accessClass, masterClass],
      },
    };
    expect(collectSymbolOutcomes(admittedModel)).toEqual([]);

    const defaultOmittedModel: TVerificationModel = {
      ...admittedModel,
      modules: {
        ...admittedModel.modules,
        records: new Map([
          [accessItem.path, accessRecordExportAll],
          [masterItem.path, masterDefaultRecord],
        ]),
      },
    };
    const outcomes = collectSymbolOutcomes(defaultOmittedModel);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('symbol/access-node-master-export');
  });

  it('rejects public alias from another Fragment Node as Master provenance', () => {
    const base = verificationModel();
    const fragmentDirectory = makeDirectoryItem(0, 'src/_components/button');
    const accessItem = makeFileItem(1, 'src/_components/button/index.ts', 0);
    const masterItem = makeFileItem(
      2,
      'src/_components/button/button.component.ts',
      0
    );
    const typeItem = makeFileItem(
      3,
      'src/_components/button/button.type.ts',
      0
    );
    const otherDirectory = makeDirectoryItem(4, 'src/_components/other');

    const accessClass = makeClassification(1, accessItem.path, 'access-node');
    const masterClass = makeClassification(2, masterItem.path, 'master-node');
    const typeClass = makeClassification(3, typeItem.path, 'fragment-node');

    const edgeToType = makeEdge(
      accessItem.path,
      typeItem.path,
      './button.type.js'
    );

    const accessRecord = makeRecord(
      [],
      [
        {
          exportedName: 'Button',
          isTypeOnly: false,
          origin: {
            importedName: 'ButtonProps',
            specifier: './button.type.js',
            type: 'imported-binding',
          },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const masterRecord = makeRecord(
      [{ name: 'Button', position: { column: 1, line: 1 }, space: 'value' }],
      [
        {
          exportedName: 'Button',
          isTypeOnly: false,
          origin: { symbolName: 'Button', type: 'local-symbol' },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [
            fragmentDirectory,
            accessItem,
            masterItem,
            typeItem,
            otherDirectory,
          ],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edgeToType],
        edgesBySourcePath: new Map([[accessItem.path, [0]]]),
      },
      modules: {
        ...base.modules,
        records: new Map([
          [accessItem.path, accessRecord],
          [masterItem.path, masterRecord],
        ]),
      },
      taxonomy: {
        byItemId: new Map([
          [1, accessClass],
          [2, masterClass],
          [3, typeClass],
        ]),
        byPath: new Map([
          [accessItem.path, accessClass],
          [masterItem.path, masterClass],
          [typeItem.path, typeClass],
        ]),
        classifications: [accessClass, masterClass, typeClass],
      },
    };

    const outcomes = collectSymbolOutcomes(model);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('symbol/access-node-master-export');
  });

  it('skips access item when parentId is null', () => {
    const base = verificationModel();
    const accessItem = makeFileItem(1, 'src/_components/button/index.ts', null);
    const accessClass = makeClassification(1, accessItem.path, 'access-node');

    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [accessItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      modules: {
        ...base.modules,
        records: new Map([[accessItem.path, makeRecord([], [])]]),
      },
      taxonomy: {
        byItemId: new Map([[1, accessClass]]),
        byPath: new Map([[accessItem.path, accessClass]]),
        classifications: [accessClass],
      },
    };

    expect(collectSymbolOutcomes(model)).toEqual([]);
  });

  it('skips access item when item is missing from inventory', () => {
    const base = verificationModel();
    const accessClass = makeClassification(
      99,
      'src/_components/button/index.ts',
      'access-node'
    );
    const model: TVerificationModel = {
      ...base,
      modules: {
        ...base.modules,
        records: new Map([
          ['src/_components/button/index.ts', makeRecord([], [])],
        ]),
      },
      taxonomy: {
        byItemId: new Map([[99, accessClass]]),
        byPath: new Map([['src/_components/button/index.ts', accessClass]]),
        classifications: [accessClass],
      },
    };
    expect(collectSymbolOutcomes(model)).toEqual([]);
  });
});
