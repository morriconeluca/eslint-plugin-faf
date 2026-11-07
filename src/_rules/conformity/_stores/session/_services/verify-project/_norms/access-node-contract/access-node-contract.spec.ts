import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TModuleRecord,
  TRootSymbol,
} from '../../../../_session@shared/_types/module-record.type.js';
import type {
  TItemClassification,
  TNodeKind,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEdgeMetadata,
  TLibraryNote,
} from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TInventoryItem } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyAccessNodeContract } from './access-node-contract.norm.js';

const makeFileItem = (
  id: number,
  path: string,
  parentId: null | number = 0
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

const makeDirectoryItem = (
  id: number,
  path: string,
  parentId: null | number = null
): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind: 'directory',
  parentId,
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
  exports: readonly TModuleExport[]
): TModuleRecord => ({
  exports,
  imports: [],
  language: 'script',
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

const makeNote = (
  sourcePath: string,
  packageName: string,
  specifier: string
): TLibraryNote => ({
  aliasAlternatives: [],
  aliasUsed: null,
  importIndex: 0,
  isTypeOnly: false,
  packageName,
  position: { column: 1, line: 1 },
  sourcePath,
  specifier,
  syntaxKind: 'named-import',
});

describe('verifyAccessNodeContract', () => {
  it('returns empty array on conforming fragment access node', () => {
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

    const accessClass = makeClassification(1, accessItem.path, 'access-node');
    const masterClass = makeClassification(2, masterItem.path, 'master-node');
    const typeClass = makeClassification(3, typeItem.path, 'fragment-node');

    const edgeMaster = makeEdge(
      accessItem.path,
      masterItem.path,
      './button.component.js'
    );
    const edgeType = makeEdge(
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
            importedName: 'Button',
            specifier: './button.component.js',
            type: 'imported-binding',
          },
          position: { column: 1, line: 1 },
        },
        {
          exportedName: 'ButtonProps',
          isTypeOnly: true,
          origin: {
            importedName: 'ButtonProps',
            specifier: './button.type.js',
            type: 'imported-binding',
          },
          position: { column: 1, line: 2 },
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
          items: [fragmentDirectory, accessItem, masterItem, typeItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edgeMaster, edgeType],
        edgesBySourcePath: new Map([[accessItem.path, [0, 1]]]),
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

    expect(verifyAccessNodeContract(model)).toEqual([]);
  });

  it('reports all three independent violations simultaneously on a single Access Node', () => {
    const base = verificationModel();
    const fragmentDirectory = makeDirectoryItem(0, 'src/_components/button');
    const accessItem = makeFileItem(1, 'src/_components/button/index.ts', 0);
    const masterItem = makeFileItem(
      2,
      'src/_components/button/button.component.ts',
      0
    );
    const foreignItem = makeFileItem(3, 'src/main.ts', null);

    const accessClass = makeClassification(1, accessItem.path, 'access-node');
    const masterClass = makeClassification(2, masterItem.path, 'master-node');
    const foreignClass = makeClassification(3, foreignItem.path, 'root-node');

    const edgeForeign = makeEdge(
      accessItem.path,
      foreignItem.path,
      '../../main.js'
    );

    const accessRecord = makeRecord(
      [{ name: 'ownSymbol', position: { column: 1, line: 1 }, space: 'value' }],
      []
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
          items: [fragmentDirectory, accessItem, masterItem, foreignItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edgeForeign],
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
          [3, foreignClass],
        ]),
        byPath: new Map([
          [accessItem.path, accessClass],
          [foreignItem.path, foreignClass],
          [masterItem.path, masterClass],
        ]),
        classifications: [accessClass, masterClass, foreignClass],
      },
    };

    const outcomes = verifyAccessNodeContract(model);
    expect(outcomes.map((item) => item.constraint)).toEqual([
      'dependency/access-node-sources',
      'symbol/access-node-master-export',
      'symbol/access-node-own-symbols',
    ]);
  });

  it('rejects foreign sources from Compound Component re-exporting Sub-Fragments', () => {
    const base = verificationModel();
    const tableDirectory = makeDirectoryItem(0, 'src/_components/table');
    const accessItem = makeFileItem(1, 'src/_components/table/index.ts', 0);
    const masterItem = makeFileItem(
      2,
      'src/_components/table/table.component.ts',
      0
    );
    const subFragmentDirectory = makeDirectoryItem(
      3,
      'src/_components/table/_components/cell',
      0
    );
    const subAccessItem = makeFileItem(
      4,
      'src/_components/table/_components/cell/index.ts',
      3
    );

    const accessClass = makeClassification(1, accessItem.path, 'access-node');
    const masterClass = makeClassification(2, masterItem.path, 'master-node');
    const subAccessClass = makeClassification(
      4,
      subAccessItem.path,
      'access-node'
    );

    const edgeToSubFragment = makeEdge(
      accessItem.path,
      subAccessItem.path,
      './_components/cell/index.js'
    );

    const accessRecord = makeRecord(
      [],
      [
        {
          exportedName: 'Cell',
          isTypeOnly: false,
          origin: {
            importedName: 'Cell',
            specifier: './_components/cell/index.js',
            type: 'imported-binding',
          },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const masterRecord = makeRecord(
      [{ name: 'Table', position: { column: 1, line: 1 }, space: 'value' }],
      [
        {
          exportedName: 'Table',
          isTypeOnly: false,
          origin: { symbolName: 'Table', type: 'local-symbol' },
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
            tableDirectory,
            accessItem,
            masterItem,
            subFragmentDirectory,
            subAccessItem,
          ],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edgeToSubFragment],
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
          [4, subAccessClass],
        ]),
        byPath: new Map([
          [accessItem.path, accessClass],
          [masterItem.path, masterClass],
          [subAccessItem.path, subAccessClass],
        ]),
        classifications: [accessClass, masterClass, subAccessClass],
      },
    };

    const outcomes = verifyAccessNodeContract(model);
    expect(outcomes.map((item) => item.constraint)).toEqual([
      'dependency/access-node-sources',
      'symbol/access-node-master-export',
    ]);
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
          items: [fragmentDirectory, accessItem, masterItem, typeItem],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edgeToType],
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

    const outcomes = verifyAccessNodeContract(model);
    expect(outcomes.map((item) => item.constraint)).toEqual([
      'symbol/access-node-master-export',
    ]);
  });

  it('guarantees deterministic output under input permutation', () => {
    const base = verificationModel();
    const fragmentDirectoryA = makeDirectoryItem(0, 'src/_components/a');
    const accessItemA = makeFileItem(1, 'src/_components/a/index.ts', 0);
    const fragmentDirectoryB = makeDirectoryItem(2, 'src/_components/b');
    const accessItemB = makeFileItem(3, 'src/_components/b/index.ts', 2);

    const accessClassA = makeClassification(1, accessItemA.path, 'access-node');
    const accessClassB = makeClassification(3, accessItemB.path, 'access-node');

    const noteA = makeNote(accessItemA.path, 'react', 'react');
    const noteB = makeNote(accessItemB.path, 'vue', 'vue');

    const modelNormal: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [
            fragmentDirectoryA,
            accessItemA,
            fragmentDirectoryB,
            accessItemB,
          ],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        libraryNotes: [noteA, noteB],
      },
      taxonomy: {
        byItemId: new Map([
          [1, accessClassA],
          [3, accessClassB],
        ]),
        byPath: new Map([
          [accessItemA.path, accessClassA],
          [accessItemB.path, accessClassB],
        ]),
        classifications: [accessClassA, accessClassB],
      },
    };

    const modelPermuted: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [
            fragmentDirectoryB,
            accessItemB,
            fragmentDirectoryA,
            accessItemA,
          ],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        libraryNotes: [noteB, noteA],
      },
      taxonomy: {
        byItemId: new Map([
          [1, accessClassA],
          [3, accessClassB],
        ]),
        byPath: new Map([
          [accessItemA.path, accessClassA],
          [accessItemB.path, accessClassB],
        ]),
        classifications: [accessClassB, accessClassA],
      },
    };

    const outcomesNormal = verifyAccessNodeContract(modelNormal);
    const outcomesPermuted = verifyAccessNodeContract(modelPermuted);
    expect(outcomesNormal).toEqual(outcomesPermuted);
  });

  it('does not mutate the verification model', () => {
    const model = verificationModel();
    const snapshot = JSON.stringify(model);
    verifyAccessNodeContract(model);
    expect(JSON.stringify(model)).toBe(snapshot);
  });
});
