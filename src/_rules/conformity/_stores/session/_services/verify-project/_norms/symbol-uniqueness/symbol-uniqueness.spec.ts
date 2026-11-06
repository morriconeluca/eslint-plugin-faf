import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TModuleRecord,
  TRootSymbol,
} from '../../../../_session@shared/_types/module-record.type.js';
import type { TItemClassification } from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEffectiveRole,
  TEffectiveTree,
} from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventoryItem } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifySymbolUniqueness } from './index.js';

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const createRole = (
  name: string,
  hasMultipleSymbolsAllowed = false
): TEffectiveRole => ({
  allowMultipleSymbols: hasMultipleSymbolsAllowed,
  category: `_${name}s`,
  form: 'category-nodes',
  implicitExtensions: [],
  name,
  rank: 1,
});

const createTree = (
  roles: readonly TEffectiveRole[] = [
    createRole('type'),
    createRole('util'),
    createRole('component'),
    createRole('constant'),
  ]
): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(roles.map((r) => [r.category, r])),
    extensionToRole: new Map(),
    roles,
    subGraphRoles: ['spec', 'story'],
    topRank: 10,
  },
  externalDependencyPairs: [],
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-layer',
  originPath: 'src',
  publicRootNodes: ['src/main.ts'],
  rootFragments: [],
  treeDependencyPairs: [],
});

const createInventoryItem = (
  id: number,
  path: string,
  treeOrigin: null | string = 'src'
): TInventoryItem => ({
  depth: path.split('/').length - 1,
  id,
  isSymlink: false,
  kind: 'file',
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: `/repo/${path}`,
  treeOrigin,
});

const createClassification = (
  id: number,
  path: string,
  nodeKind: TItemClassification['nodeKind'],
  roleName: null | string
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: roleName,
  itemId: id,
  nodeKind,
  path,
  relationalQualifications: qualifications,
  role: { kind: 'explicit', roleName },
});

const createRecord = (
  symbolNames: readonly string[],
  exportTuples: readonly (readonly string[])[] = [],
  language: TModuleRecord['language'] = 'script'
): TModuleRecord => {
  const symbols: readonly TRootSymbol[] = symbolNames.map((name) => ({
    name,
    position: { column: 1, line: 1 },
    space: 'value',
  }));

  const exports: readonly TModuleExport[] = exportTuples.map((tuple) => {
    const exportedName = tuple[0] ?? '';
    const symbolName = tuple[1] ?? exportedName;
    return {
      exportedName,
      isTypeOnly: false,
      origin: { symbolName, type: 'local-symbol' },
      position: { column: 1, line: 1 },
    };
  });

  return {
    exports,
    imports: [],
    language,
    symbols,
    unsupportedSyntaxes: [],
  };
};

describe('verifySymbolUniqueness', () => {
  it('returns empty outcomes for an empty model', () => {
    expect(verifySymbolUniqueness(verificationModel())).toEqual([]);
  });

  describe('normative counting rows and ordinary cardinality', () => {
    it.each([
      ['empty node', [], [], 0],
      ['const value = 1;', ['value'], [], 0],
      ['export const value = 1;', ['value'], [['value', 'value']], 0],
      ['const first = 1, second = 2;', ['first', 'second'], [], 1],
      ['const { first, second } = source;', ['first', 'second'], [], 1],
      ['const [first, second] = source;', ['first', 'second'], [], 1],
      ['const { value: renamed } = source;', ['renamed'], [], 0],
      ['const Value = 1; type Value = number;', ['Value', 'Value'], [], 1],
      ['function f overloads and implementation', ['f'], [['f', 'f']], 0],
      ['class C with members', ['C'], [['C', 'C']], 0],
      [
        'const value = 1; export { value, value as renamed };',
        ['value'],
        [
          ['value', 'value'],
          ['renamed', 'value'],
        ],
        0,
      ],
      ['interface A declaration merging', ['A', 'A'], [], 1],
      ['function f and namespace f merging', ['f', 'f'], [], 1],
      ['class C', ['C'], [], 0],
      ['enum E', ['E'], [], 0],
      ['import x; export const y = x;', ['y'], [['y', 'y']], 0],
      ['import x;', [], [], 0],
      [
        'hidden and visible symbols',
        ['hidden', 'visible'],
        [['visible', 'visible']],
        1,
      ],
      [
        'export const schema = makeSchema(); export type T = Infer<typeof schema>;',
        ['schema', 'T'],
        [
          ['schema', 'schema'],
          ['T', 'T'],
        ],
        1,
      ],
    ])(
      'evaluates ordinary cardinality: %s',
      (_name, symbols, exportTuples, expectedCount) => {
        const path = 'src/_types/sample.type.ts';
        const model = verificationModel();
        const tree = createTree();
        const item = createInventoryItem(0, path, 'src');
        const classification = createClassification(
          0,
          path,
          'category-node',
          'type'
        );
        const record = createRecord(symbols, exportTuples);

        const testModel: TVerificationModel = {
          ...model,
          basis: {
            ...model.basis,
            declarations: { ...model.basis.declarations, trees: [tree] },
            inventory: {
              ...model.basis.inventory,
              items: [item],
              pathToId: new Map([[path, 0]]),
            },
          },
          modules: {
            ...model.modules,
            records: new Map([[path, record]]),
          },
          taxonomy: {
            ...model.taxonomy,
            byItemId: new Map([[0, classification]]),
            byPath: new Map([[path, classification]]),
            classifications: [classification],
          },
        };

        const outcomes = verifySymbolUniqueness(testModel);
        if (expectedCount === 0) {
          expect(outcomes).toEqual([]);
        } else {
          expect(outcomes).toEqual([
            {
              constraint: 'symbol/symbol-uniqueness',
              element: path,
              family: 'symbol',
              message: `'${path}' defines more than one Symbol in its root scope`,
              normativeReference: 'FAF §5',
            },
          ]);
        }
      }
    );
  });

  describe('Master Node cardinality and export requirement', () => {
    it.each([
      ['0 defs, 0 exported', [], [], 1],
      ['1 def, 0 exported', ['Example'], [], 1],
      ['1 def, 1 exported', ['Example'], [['Example', 'Example']], 0],
      [
        '2 defs, 1 exported',
        ['hidden', 'Example'],
        [['Example', 'Example']],
        1,
      ],
      [
        '2 defs, 2 exported',
        ['Example', 'other'],
        [
          ['Example', 'Example'],
          ['other', 'other'],
        ],
        1,
      ],
      [
        '1 def with multiple aliases',
        ['Example'],
        [
          ['Example', 'Example'],
          ['Renamed', 'Example'],
        ],
        0,
      ],
    ])(
      'evaluates Master Node cardinality: %s',
      (_name, symbols, exportTuples, expectedCount) => {
        const path = 'src/example/example.component.ts';
        const model = verificationModel();
        const tree = createTree();
        const item = createInventoryItem(0, path, 'src');
        const classification = createClassification(
          0,
          path,
          'master-node',
          'component'
        );
        const record = createRecord(symbols, exportTuples);

        const testModel: TVerificationModel = {
          ...model,
          basis: {
            ...model.basis,
            declarations: { ...model.basis.declarations, trees: [tree] },
            inventory: {
              ...model.basis.inventory,
              items: [item],
              pathToId: new Map([[path, 0]]),
            },
          },
          modules: {
            ...model.modules,
            records: new Map([[path, record]]),
          },
          taxonomy: {
            ...model.taxonomy,
            byItemId: new Map([[0, classification]]),
            byPath: new Map([[path, classification]]),
            classifications: [classification],
          },
        };

        const outcomes = verifySymbolUniqueness(testModel);
        if (expectedCount === 0) {
          expect(outcomes).toEqual([]);
        } else {
          expect(outcomes).toEqual([
            {
              constraint: 'symbol/master-symbol',
              element: path,
              family: 'symbol',
              message: `'${path}' does not define and export exactly one Symbol as Master Node`,
              normativeReference: 'FAF §6.1.1',
            },
          ]);
        }
      }
    );

    it('never applies a Role exemption to the Master Node', () => {
      const path = 'src/example/example.util.ts';
      const model = verificationModel();
      const tree = createTree([createRole('util', true)]);
      const item = createInventoryItem(0, path, 'src');
      const classification = createClassification(
        0,
        path,
        'master-node',
        'util'
      );
      const record = createRecord(
        ['hidden', 'Example'],
        [['Example', 'Example']]
      );

      const testModel: TVerificationModel = {
        ...model,
        basis: {
          ...model.basis,
          declarations: { ...model.basis.declarations, trees: [tree] },
          inventory: {
            ...model.basis.inventory,
            items: [item],
            pathToId: new Map([[path, 0]]),
          },
        },
        modules: {
          ...model.modules,
          records: new Map([[path, record]]),
        },
        taxonomy: {
          ...model.taxonomy,
          byItemId: new Map([[0, classification]]),
          byPath: new Map([[path, classification]]),
          classifications: [classification],
        },
      };

      expect(verifySymbolUniqueness(testModel)).toEqual([
        {
          constraint: 'symbol/master-symbol',
          element: path,
          family: 'symbol',
          message: `'${path}' does not define and export exactly one Symbol as Master Node`,
          normativeReference: 'FAF §6.1.1',
        },
      ]);
    });
  });

  describe('exemptions and exclusions', () => {
    it('applies explicit ordinary Role exemption', () => {
      const path = 'src/_types/sample.type.ts';
      const model = verificationModel();
      const tree = createTree([createRole('type', true)]);
      const item = createInventoryItem(0, path, 'src');
      const classification = createClassification(
        0,
        path,
        'category-node',
        'type'
      );
      const record = createRecord(['first', 'second']);

      const testModel: TVerificationModel = {
        ...model,
        basis: {
          ...model.basis,
          declarations: { ...model.basis.declarations, trees: [tree] },
          inventory: {
            ...model.basis.inventory,
            items: [item],
            pathToId: new Map([[path, 0]]),
          },
        },
        modules: {
          ...model.modules,
          records: new Map([[path, record]]),
        },
        taxonomy: {
          ...model.taxonomy,
          byItemId: new Map([[0, classification]]),
          byPath: new Map([[path, classification]]),
          classifications: [classification],
        },
      };

      expect(verifySymbolUniqueness(testModel)).toEqual([]);
    });

    it('exempts Sub-Graph Nodes without a flag', () => {
      const path = 'src/example/example.spec.ts';
      const model = verificationModel();
      const tree = createTree();
      const item = createInventoryItem(0, path, 'src');
      const classification = createClassification(
        0,
        path,
        'sub-graph-node',
        'spec'
      );
      const record = createRecord(['first', 'second']);

      const testModel: TVerificationModel = {
        ...model,
        basis: {
          ...model.basis,
          declarations: { ...model.basis.declarations, trees: [tree] },
          inventory: {
            ...model.basis.inventory,
            items: [item],
            pathToId: new Map([[path, 0]]),
          },
        },
        modules: {
          ...model.modules,
          records: new Map([[path, record]]),
        },
        taxonomy: {
          ...model.taxonomy,
          byItemId: new Map([[0, classification]]),
          byPath: new Map([[path, classification]]),
          classifications: [classification],
        },
      };

      expect(verifySymbolUniqueness(testModel)).toEqual([]);
    });

    it('does not apply Symbol laws to Assets with multiple CSS rules or imports', () => {
      const stylePath = 'src/example/example.module.css';
      const model = verificationModel();
      const tree = createTree();
      const item = createInventoryItem(0, stylePath, 'src');
      const classification = createClassification(
        0,
        stylePath,
        'fragment-node',
        'module'
      );
      const record = createRecord(['first', 'second'], [], 'style');

      const testModel: TVerificationModel = {
        ...model,
        basis: {
          ...model.basis,
          declarations: { ...model.basis.declarations, trees: [tree] },
          inventory: {
            ...model.basis.inventory,
            items: [item],
            pathToId: new Map([[stylePath, 0]]),
          },
        },
        modules: {
          ...model.modules,
          records: new Map([[stylePath, record]]),
        },
        taxonomy: {
          ...model.taxonomy,
          byItemId: new Map([[0, classification]]),
          byPath: new Map([[stylePath, classification]]),
          classifications: [classification],
        },
      };

      expect(verifySymbolUniqueness(testModel)).toEqual([]);
    });

    it('skips external files whose treeOrigin is null', () => {
      const externalPath = 'scripts/build.ts';
      const model = verificationModel();
      const item = createInventoryItem(0, externalPath, null);
      const classification = createClassification(
        0,
        externalPath,
        'category-node',
        'util'
      );
      const record = createRecord(['first', 'second']);

      const testModel: TVerificationModel = {
        ...model,
        basis: {
          ...model.basis,
          inventory: {
            ...model.basis.inventory,
            items: [item],
            pathToId: new Map([[externalPath, 0]]),
          },
        },
        modules: {
          ...model.modules,
          records: new Map([[externalPath, record]]),
        },
        taxonomy: {
          ...model.taxonomy,
          byItemId: new Map([[0, classification]]),
          byPath: new Map([[externalPath, classification]]),
          classifications: [classification],
        },
      };

      expect(verifySymbolUniqueness(testModel)).toEqual([]);
    });

    it('skips items not found in inventory', () => {
      const missingPath = 'src/missing.ts';
      const model = verificationModel();
      const classification = createClassification(
        99,
        missingPath,
        'category-node',
        'util'
      );
      const testModel: TVerificationModel = {
        ...model,
        taxonomy: {
          ...model.taxonomy,
          classifications: [classification],
        },
      };

      expect(verifySymbolUniqueness(testModel)).toEqual([]);
    });
  });

  describe('determinism and absence of mutation', () => {
    it('sorts outcomes deterministically by element path regardless of input permutation', () => {
      const pathA = 'src/_types/a.type.ts';
      const pathB = 'src/_types/b.type.ts';
      const pathC = 'src/master/master.component.ts';

      const tree = createTree();
      const itemA = createInventoryItem(0, pathA);
      const itemB = createInventoryItem(1, pathB);
      const itemC = createInventoryItem(2, pathC);

      const classA = createClassification(0, pathA, 'category-node', 'type');
      const classB = createClassification(1, pathB, 'category-node', 'type');
      const classC = createClassification(2, pathC, 'master-node', 'component');

      const recA = createRecord(['first', 'second']);
      const recB = createRecord(['x', 'y']);
      const recC = createRecord([]);

      const buildModelWithOrder = (
        classifications: readonly TItemClassification[]
      ): TVerificationModel => {
        const base = verificationModel();
        return {
          ...base,
          basis: {
            ...base.basis,
            declarations: { ...base.basis.declarations, trees: [tree] },
            inventory: {
              ...base.basis.inventory,
              items: [itemA, itemB, itemC],
              pathToId: new Map([
                [pathA, 0],
                [pathB, 1],
                [pathC, 2],
              ]),
            },
          },
          modules: {
            ...base.modules,
            records: new Map([
              [pathA, recA],
              [pathB, recB],
              [pathC, recC],
            ]),
          },
          taxonomy: {
            ...base.taxonomy,
            classifications,
          },
        };
      };

      const modelForward = buildModelWithOrder([classA, classB, classC]);
      const modelReversed = buildModelWithOrder([classC, classB, classA]);
      const modelShuffled = buildModelWithOrder([classB, classA, classC]);

      const expected = [
        {
          constraint: 'symbol/symbol-uniqueness',
          element: pathA,
          family: 'symbol',
          message: `'${pathA}' defines more than one Symbol in its root scope`,
          normativeReference: 'FAF §5',
        },
        {
          constraint: 'symbol/symbol-uniqueness',
          element: pathB,
          family: 'symbol',
          message: `'${pathB}' defines more than one Symbol in its root scope`,
          normativeReference: 'FAF §5',
        },
        {
          constraint: 'symbol/master-symbol',
          element: pathC,
          family: 'symbol',
          message: `'${pathC}' does not define and export exactly one Symbol as Master Node`,
          normativeReference: 'FAF §6.1.1',
        },
      ];

      expect(verifySymbolUniqueness(modelForward)).toEqual(expected);
      expect(verifySymbolUniqueness(modelReversed)).toEqual(expected);
      expect(verifySymbolUniqueness(modelShuffled)).toEqual(expected);
    });

    it('does not mutate the verification model', () => {
      const path = 'src/_types/sample.type.ts';
      const tree = createTree();
      const item = createInventoryItem(0, path);
      const classification = createClassification(
        0,
        path,
        'category-node',
        'type'
      );
      const record = createRecord(['first', 'second']);

      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          declarations: { ...base.basis.declarations, trees: [tree] },
          inventory: {
            ...base.basis.inventory,
            items: [item],
            pathToId: new Map([[path, 0]]),
          },
        },
        modules: {
          ...base.modules,
          records: new Map([[path, record]]),
        },
        taxonomy: {
          ...base.taxonomy,
          classifications: [classification],
        },
      };

      const snapshotBefore = structuredClone(model);

      verifySymbolUniqueness(model);

      expect(model).toEqual(snapshotBefore);
    });
  });
});
