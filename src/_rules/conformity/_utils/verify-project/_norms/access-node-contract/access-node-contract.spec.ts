import { describe, expect, it } from 'vitest';

import type {
  TEdgeMetadata,
  TInventoryItem,
  TItemClassification,
  TLibraryImport,
  TModuleExport,
  TModuleRecord,
  TNodeKind,
  TRootSymbol,
  TVerificationModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';

import { verificationModel } from '../_norms@shared/_mocks/verification-model.mock.js';
import { verifyAccessNodeContract } from './access-node-contract.norm.js';
import {
  collectSourceOutcomes,
  collectSymbolOutcomes,
  compareAccessNodeOutcomes,
} from './access-node-contract.util.js';

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
): TLibraryImport => ({
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
        libraryImports: [noteA, noteB],
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
        libraryImports: [noteB, noteA],
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

  it('handles export-all re-exports, type-only value exports, multi-symbol or unexported masters, and sorts multiple library imports', () => {
    const base = verificationModel();
    const fragmentDirectory = makeDirectoryItem(0, 'src/_components/button');
    const accessItem = makeFileItem(1, 'src/_components/button/index.ts', 0);
    const masterItem = makeFileItem(
      2,
      'src/_components/button/button.component.ts',
      0
    );
    const fragmentDirectoryMulti = makeDirectoryItem(3, 'src/_utils/multi');
    const accessMulti = makeFileItem(4, 'src/_utils/multi/index.ts', 3);
    const masterMulti = makeFileItem(5, 'src/_utils/multi/multi.util.ts', 3);
    const fragmentDirectoryUnexported = makeDirectoryItem(
      6,
      'src/_utils/private'
    );
    const accessUnexported = makeFileItem(7, 'src/_utils/private/index.ts', 6);
    const masterUnexported = makeFileItem(
      8,
      'src/_utils/private/private.util.ts',
      6
    );

    const accessClass = makeClassification(1, accessItem.path, 'access-node');
    const masterClass = makeClassification(2, masterItem.path, 'master-node');
    const accessMultiClass = makeClassification(
      4,
      accessMulti.path,
      'access-node'
    );
    const masterMultiClass = makeClassification(
      5,
      masterMulti.path,
      'master-node'
    );
    const accessUnexportedClass = makeClassification(
      7,
      accessUnexported.path,
      'access-node'
    );
    const masterUnexportedClass = makeClassification(
      8,
      masterUnexported.path,
      'master-node'
    );

    const masterEdge = makeEdge(
      accessItem.path,
      masterItem.path,
      './button.component.js'
    );

    const accessExportAllTypeOnly = makeRecord(
      [],
      [
        {
          exportedName: '*',
          isTypeOnly: true,
          origin: { specifier: './button.component.js', type: 'export-all' },
          position: { column: 1, line: 1 },
        },
      ]
    );
    const masterValueRecord = makeRecord(
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

    const model = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [
            fragmentDirectory,
            accessItem,
            masterItem,
            fragmentDirectoryMulti,
            accessMulti,
            masterMulti,
            fragmentDirectoryUnexported,
            accessUnexported,
            masterUnexported,
          ],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [masterEdge],
        edgesBySourcePath: new Map([[accessItem.path, [0]]]),
        libraryImports: [
          {
            ...makeNote(accessItem.path, 'zod', 'zod'),
            position: { column: 1, line: 3 },
          },
          {
            ...makeNote(accessItem.path, 'react', 'react'),
            position: { column: 1, line: 2 },
          },
        ],
      },
      modules: {
        ...base.modules,
        records: new Map([
          [accessItem.path, accessExportAllTypeOnly],
          [accessMulti.path, makeRecord([], [])],
          [accessUnexported.path, makeRecord([], [])],
          [masterItem.path, masterValueRecord],
          [
            masterMulti.path,
            makeRecord(
              [
                { name: 'a', position: { column: 1, line: 1 }, space: 'value' },
                { name: 'b', position: { column: 1, line: 2 }, space: 'value' },
              ],
              []
            ),
          ],
          [
            masterUnexported.path,
            makeRecord(
              [
                {
                  name: 'priv',
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
        byItemId: new Map([
          [1, accessClass],
          [2, masterClass],
          [4, accessMultiClass],
          [5, masterMultiClass],
          [7, accessUnexportedClass],
          [8, masterUnexportedClass],
        ]),
        byPath: new Map([
          [accessItem.path, accessClass],
          [accessMulti.path, accessMultiClass],
          [accessUnexported.path, accessUnexportedClass],
          [masterItem.path, masterClass],
          [masterMulti.path, masterMultiClass],
          [masterUnexported.path, masterUnexportedClass],
        ]),
        classifications: [
          accessClass,
          masterClass,
          accessMultiClass,
          masterMultiClass,
          accessUnexportedClass,
          masterUnexportedClass,
        ],
      },
    };

    const outcomes = verifyAccessNodeContract(model);
    expect(outcomes.map((outcome) => outcome.constraint)).toEqual([
      'dependency/access-node-sources',
      'dependency/access-node-sources',
      'symbol/access-node-master-export',
    ]);
    expect(outcomes[0]?.position).toEqual({ column: 1, line: 2 });
    expect(outcomes[1]?.position).toEqual({ column: 1, line: 3 });

    const valueExportAllModel = {
      ...model,
      modules: {
        ...model.modules,
        records: new Map([
          [
            accessItem.path,
            makeRecord(
              [],
              [
                {
                  exportedName: '*',
                  isTypeOnly: false,
                  origin: {
                    specifier: './button.component.js',
                    type: 'export-all',
                  },
                  position: { column: 1, line: 1 },
                },
              ]
            ),
          ],
          [masterItem.path, masterValueRecord],
        ]),
      },
    };
    const valueExportAllOutcomes =
      verifyAccessNodeContract(valueExportAllModel);
    expect(valueExportAllOutcomes.map((outcome) => outcome.constraint)).toEqual(
      ['dependency/access-node-sources', 'dependency/access-node-sources']
    );
  });

  it('handles edge targets outside inventory, null parentIds, non-script masters, type masters, and default-only export-all', () => {
    const base = verificationModel();
    const fragmentDirectory = makeDirectoryItem(0, 'src/_types/box');
    const accessType = makeFileItem(1, 'src/_types/box/index.ts', 0);
    const masterType = makeFileItem(2, 'src/_types/box/box.type.ts', 0);
    const orphanAccess = makeFileItem(3, 'src/orphan/index.ts', null);
    const orphanMaster = makeFileItem(4, 'src/orphan/orphan.util.ts', null);
    const styleDirectory = makeDirectoryItem(5, 'src/_styles/box');
    const accessStyle = makeFileItem(6, 'src/_styles/box/index.ts', 5);
    const masterStyle = makeFileItem(7, 'src/_styles/box/box.css', 5);
    const defaultDirectory = makeDirectoryItem(8, 'src/_utils/def');
    const accessDefault = makeFileItem(9, 'src/_utils/def/index.ts', 8);
    const masterDefault = makeFileItem(10, 'src/_utils/def/def.util.ts', 8);

    const c1 = makeClassification(1, accessType.path, 'access-node');
    const c2 = makeClassification(2, masterType.path, 'master-node');
    const c3 = makeClassification(3, orphanAccess.path, 'access-node');
    const c4 = makeClassification(4, orphanMaster.path, 'master-node');
    const c6 = makeClassification(6, accessStyle.path, 'access-node');
    const c7 = makeClassification(7, masterStyle.path, 'master-node');
    const c9 = makeClassification(9, accessDefault.path, 'access-node');
    const c10 = makeClassification(10, masterDefault.path, 'master-node');

    const model = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [
            fragmentDirectory,
            accessType,
            masterType,
            orphanAccess,
            orphanMaster,
            styleDirectory,
            accessStyle,
            masterStyle,
            defaultDirectory,
            accessDefault,
            masterDefault,
          ],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [
          makeEdge(accessType.path, 'src/missing.ts', './missing.js'),
          makeEdge(orphanAccess.path, orphanMaster.path, './orphan.util.js'),
          makeEdge(accessType.path, masterType.path, './box.type.js'),
          makeEdge(accessDefault.path, masterDefault.path, './def.util.js'),
        ],
        edgesBySourcePath: new Map([
          [accessDefault.path, [3]],
          [accessType.path, [0, 2]],
        ]),
      },
      modules: {
        ...base.modules,
        records: new Map([
          [
            accessDefault.path,
            makeRecord(
              [],
              [
                {
                  exportedName: '*',
                  isTypeOnly: false,
                  origin: { specifier: './def.util.js', type: 'export-all' },
                  position: { column: 1, line: 1 },
                },
              ]
            ),
          ],
          [accessStyle.path, makeRecord([], [])],
          [
            accessType.path,
            makeRecord(
              [],
              [
                {
                  exportedName: 'TBox',
                  isTypeOnly: true,
                  origin: {
                    importedName: 'TBox',
                    specifier: './box.type.js',
                    type: 'imported-binding',
                  },
                  position: { column: 1, line: 1 },
                },
              ]
            ),
          ],
          [
            masterDefault.path,
            makeRecord(
              [
                {
                  name: 'def',
                  position: { column: 1, line: 1 },
                  space: 'value',
                },
              ],
              [
                {
                  exportedName: 'default',
                  isTypeOnly: false,
                  origin: { symbolName: 'def', type: 'local-symbol' },
                  position: { column: 1, line: 1 },
                },
              ]
            ),
          ],
          [
            masterStyle.path,
            {
              exports: [],
              imports: [],
              language: 'style' as const,
              symbols: [],
              unsupportedSyntaxes: [],
            },
          ],
          [
            masterType.path,
            makeRecord(
              [
                {
                  name: 'TBox',
                  position: { column: 1, line: 1 },
                  space: 'type',
                },
              ],
              [
                {
                  exportedName: 'TBox',
                  isTypeOnly: true,
                  origin: { symbolName: 'TBox', type: 'local-symbol' },
                  position: { column: 1, line: 1 },
                },
              ]
            ),
          ],
          [orphanAccess.path, makeRecord([], [])],
        ]),
      },
      taxonomy: {
        byItemId: new Map([
          [1, c1],
          [2, c2],
          [3, c3],
          [4, c4],
          [6, c6],
          [7, c7],
          [9, c9],
          [10, c10],
        ]),
        byPath: new Map([
          [accessDefault.path, c9],
          [accessStyle.path, c6],
          [accessType.path, c1],
          [masterDefault.path, c10],
          [masterStyle.path, c7],
          [masterType.path, c2],
          [orphanAccess.path, c3],
          [orphanMaster.path, c4],
        ]),
        classifications: [c1, c2, c3, c4, c6, c7, c9, c10],
      },
    };

    const outcomes = verifyAccessNodeContract(model);
    expect(
      outcomes.map((outcome) => [outcome.element, outcome.constraint])
    ).toEqual([
      ['src/_types/box/index.ts', 'dependency/access-node-sources'],
      ['src/_utils/def/index.ts', 'symbol/access-node-master-export'],
      ['src/orphan/index.ts', 'dependency/access-node-sources'],
    ]);
  });

  it('enforces isPermittedEdge, isMasterReExported, and compareAccessNodeOutcomes edge cases directly', () => {
    const base = verificationModel();
    const directory = makeDirectoryItem(0, 'src/_utils/w');
    const access = makeFileItem(1, 'src/_utils/w/index.ts', 0);
    const master = makeFileItem(2, 'src/_utils/w/w.util.ts', 0);
    const styleDirectory = makeDirectoryItem(3, 'src/_styles/s');
    const styleAccess = makeFileItem(4, 'src/_styles/s/index.ts', 3);
    const styleMaster = makeFileItem(5, 'src/_styles/s/s.css', 3);
    const multiDirectory = makeDirectoryItem(6, 'src/_utils/m');
    const multiAccess = makeFileItem(7, 'src/_utils/m/index.ts', 6);
    const multiMaster = makeFileItem(8, 'src/_utils/m/m.util.ts', 6);
    const reexportDirectory = makeDirectoryItem(9, 'src/_utils/r');
    const reexportAccess = makeFileItem(10, 'src/_utils/r/index.ts', 9);
    const reexportMaster = makeFileItem(11, 'src/_utils/r/r.util.ts', 9);
    const orphanMaster = makeFileItem(12, 'src/orphan-master.ts', null);

    const cAccess = makeClassification(1, access.path, 'access-node');
    const cMaster = makeClassification(2, master.path, 'master-node');
    const cStyleAccess = makeClassification(4, styleAccess.path, 'access-node');
    const cStyleMaster = makeClassification(5, styleMaster.path, 'master-node');
    const cMultiAccess = makeClassification(7, multiAccess.path, 'access-node');
    const cMultiMaster = makeClassification(8, multiMaster.path, 'master-node');
    const cReexportAccess = makeClassification(
      10,
      reexportAccess.path,
      'access-node'
    );
    const cReexportMaster = makeClassification(
      11,
      reexportMaster.path,
      'master-node'
    );
    const cOrphanMaster = makeClassification(
      12,
      orphanMaster.path,
      'master-node'
    );
    const cPhantomAccess = makeClassification(
      99,
      'src/phantom/index.ts',
      'access-node'
    );

    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        inventory: {
          items: [
            directory,
            access,
            master,
            styleDirectory,
            styleAccess,
            styleMaster,
            multiDirectory,
            multiAccess,
            multiMaster,
            reexportDirectory,
            reexportAccess,
            reexportMaster,
            orphanMaster,
          ],
          pathToId: new Map(),
          realPathToId: new Map(),
        },
      },
      graph: {
        ...base.graph,
        edgeMetadata: [
          makeEdge(access.path, master.path, './w.util.js'),
          makeEdge('src/phantom/index.ts', master.path, './w.util.js'),
          makeEdge(access.path, orphanMaster.path, '../../orphan-master.js'),
        ],
        edgesBySourcePath: new Map([[access.path, [0]]]),
      },
      modules: {
        ...base.modules,
        records: new Map([
          [
            access.path,
            makeRecord(
              [],
              [
                {
                  exportedName: 'w',
                  isTypeOnly: true,
                  origin: {
                    importedName: 'w',
                    specifier: './w.util.js',
                    type: 'imported-binding',
                  },
                  position: { column: 1, line: 1 },
                },
              ]
            ),
          ],
          [
            master.path,
            makeRecord(
              [{ name: 'w', position: { column: 1, line: 1 }, space: 'value' }],
              [
                {
                  exportedName: 'w',
                  isTypeOnly: false,
                  origin: { symbolName: 'w', type: 'local-symbol' },
                  position: { column: 1, line: 1 },
                },
              ]
            ),
          ],
          [multiAccess.path, makeRecord([], [])],
          [
            multiMaster.path,
            makeRecord(
              [
                {
                  name: 'm1',
                  position: { column: 1, line: 1 },
                  space: 'value',
                },
                {
                  name: 'm2',
                  position: { column: 1, line: 2 },
                  space: 'value',
                },
              ],
              [
                {
                  exportedName: 'm1',
                  isTypeOnly: false,
                  origin: { symbolName: 'm1', type: 'local-symbol' },
                  position: { column: 1, line: 1 },
                },
              ]
            ),
          ],
          [reexportAccess.path, makeRecord([], [])],
          [
            reexportMaster.path,
            makeRecord(
              [{ name: 'r', position: { column: 1, line: 1 }, space: 'value' }],
              [
                {
                  exportedName: 'r',
                  isTypeOnly: false,
                  origin: {
                    importedName: 'r',
                    specifier: './other.js',
                    type: 'imported-binding',
                  },
                  position: { column: 1, line: 1 },
                },
              ]
            ),
          ],
          [styleAccess.path, makeRecord([], [])],
          [
            styleMaster.path,
            {
              exports: [
                {
                  exportedName: 's',
                  isTypeOnly: false,
                  origin: { symbolName: 's', type: 'local-symbol' },
                  position: { column: 1, line: 1 },
                },
              ],
              imports: [],
              language: 'style',
              symbols: [
                { name: 's', position: { column: 1, line: 1 }, space: 'value' },
              ],
              unsupportedSyntaxes: [],
            },
          ],
        ]),
      },
      taxonomy: {
        byItemId: new Map([
          [1, cAccess],
          [2, cMaster],
          [4, cStyleAccess],
          [5, cStyleMaster],
          [7, cMultiAccess],
          [8, cMultiMaster],
          [10, cReexportAccess],
          [11, cReexportMaster],
          [12, cOrphanMaster],
          [99, cPhantomAccess],
        ]),
        byPath: new Map([
          [access.path, cAccess],
          [cPhantomAccess.path, cPhantomAccess],
          [master.path, cMaster],
          [multiAccess.path, cMultiAccess],
          [multiMaster.path, cMultiMaster],
          [orphanMaster.path, cOrphanMaster],
          [reexportAccess.path, cReexportAccess],
          [reexportMaster.path, cReexportMaster],
          [styleAccess.path, cStyleAccess],
          [styleMaster.path, cStyleMaster],
        ]),
        classifications: [
          cAccess,
          cMaster,
          cStyleAccess,
          cStyleMaster,
          cMultiAccess,
          cMultiMaster,
          cReexportAccess,
          cReexportMaster,
          cOrphanMaster,
          cPhantomAccess,
        ],
      },
    };

    expect(
      collectSourceOutcomes(model).map((outcome) => [outcome.from, outcome.to])
    ).toEqual([
      ['src/phantom/index.ts', 'src/_utils/w/w.util.ts'],
      ['src/_utils/w/index.ts', 'src/orphan-master.ts'],
    ]);
    expect(
      collectSymbolOutcomes(model).map((outcome) => outcome.element)
    ).toEqual(['src/_utils/w/index.ts']);

    const outcomeA = {
      constraint: 'symbol/access-node-master-export' as const,
      element: 'a/index.ts',
      family: 'symbol' as const,
      message: 'msg-a',
      normativeReference: 'FAF §6.1.1',
    };
    expect(
      compareAccessNodeOutcomes(outcomeA, {
        ...outcomeA,
        element: 'b/index.ts',
      })
    ).toBeLessThan(0);
    expect(
      compareAccessNodeOutcomes(outcomeA, {
        ...outcomeA,
        constraint: 'symbol/access-node-own-symbols',
      })
    ).toBeLessThan(0);
    expect(
      compareAccessNodeOutcomes(outcomeA, {
        ...outcomeA,
        position: { column: 1, line: 1 },
      })
    ).toBeLessThan(0);
    expect(
      compareAccessNodeOutcomes(
        { ...outcomeA, position: { column: 1, line: 1 } },
        outcomeA
      )
    ).toBeGreaterThan(0);
    expect(
      compareAccessNodeOutcomes(outcomeA, { ...outcomeA, message: 'msg-b' })
    ).toBeLessThan(0);
    expect(compareAccessNodeOutcomes(outcomeA, { ...outcomeA })).toBe(0);
  });
});
