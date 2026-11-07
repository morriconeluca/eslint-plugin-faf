import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventoryItem } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';
import type {
  TDirectChildType,
  TParentDomainType,
} from './_containment-matrix@shared/_types/containment-matrix.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { CONTAINMENT_MATRIX } from './_configs/containment-matrix.config.js';
import { verifyContainmentMatrix } from './containment-matrix.norm.js';

const absentRole = { kind: 'absent' as const, roleName: null };

const defaultQualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const FILE_CHILD_KINDS = new Set<TDirectChildType>([
  'access-node',
  'category-node',
  'foreign-node',
  'fragment-node',
  'root-node',
  'sub-graph-node',
]);

const isFileChild = (childType: TDirectChildType): boolean =>
  FILE_CHILD_KINDS.has(childType);

const CHILD_NODE_KINDS: Readonly<Record<string, TNodeKind>> = {
  'access-node': 'access-node',
  'category-node': 'category-node',
  'foreign-node': 'foreign-node',
  'fragment-node': 'fragment-node',
  'root-node': 'root-node',
  'sub-graph-node': 'sub-graph-node',
};

const CHILD_DOMAIN_KINDS: Readonly<Record<string, TLogicalDomainKind>> = {
  category: 'category',
  'foreign-domain': 'foreign-domain',
  'fractal-branch': 'fractal-branch',
  fragment: 'fragment',
  layer: 'layer',
  'path-sub-category': 'path-sub-category',
  'private-category': 'category',
  'root-fragment': 'root-fragment',
  'root-layer': 'root-layer',
  'sub-category': 'sub-category',
};

const PARENT_PATHS: Readonly<Record<TParentDomainType, string>> = {
  category: 'src/_types',
  'foreign-domain': 'src/_tooling',
  'fractal-branch': 'src/_src@shared',
  fragment: 'src/_components/button',
  layer: 'src/_domain',
  'mimetic-parent-category': 'src/_apis',
  'root-fragment': 'src',
  'root-layer': 'src',
};

const PARENT_DOMAIN_KINDS: Readonly<
  Record<TParentDomainType, TLogicalDomainKind>
> = {
  category: 'category',
  'foreign-domain': 'foreign-domain',
  'fractal-branch': 'fractal-branch',
  fragment: 'fragment',
  layer: 'layer',
  'mimetic-parent-category': 'category',
  'root-fragment': 'root-fragment',
  'root-layer': 'root-layer',
};

const makeInventoryItem = (
  id: number,
  path: string,
  kind: 'directory' | 'file',
  parentId: null | number
): TInventoryItem => ({
  depth: parentId === null ? 0 : 1,
  id,
  isSymlink: false,
  kind,
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: `/project/${path}`,
  treeOrigin: 'src',
});

const makeClassification = (
  id: number,
  path: string,
  entryKind: 'directory' | 'file',
  domainKind: null | TLogicalDomainKind,
  nodeKind: null | TNodeKind,
  isPrivateCategory = false,
  isParentCategory = false
): TItemClassification => ({
  domainKind,
  entryKind,
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: id,
  nodeKind,
  path,
  relationalQualifications: {
    ...defaultQualifications,
    isParentCategory,
    isPrivateCategory,
  },
  role: absentRole,
});

const buildSinglePairModel = (
  parentType: TParentDomainType,
  childType: TDirectChildType
): TVerificationModel => {
  const parentPath = PARENT_PATHS[parentType];
  const childPath = `${parentPath}/child`;
  const parentDomainKind = PARENT_DOMAIN_KINDS[parentType];
  const isMimeticParent = parentType === 'mimetic-parent-category';
  const isChildFile = isFileChild(childType);
  const isPrivateCategory = childType === 'private-category';

  const parentItem = makeInventoryItem(0, parentPath, 'directory', null);
  const parentClassification = makeClassification(
    0,
    parentPath,
    'directory',
    parentDomainKind,
    null,
    false,
    isMimeticParent
  );

  const childEntryKind = isChildFile ? 'file' : 'directory';
  const childNodeKind = CHILD_NODE_KINDS[childType] ?? null;
  const childDomainKind = CHILD_DOMAIN_KINDS[childType] ?? null;

  const childItem = makeInventoryItem(1, childPath, childEntryKind, 0);
  const childClassification = makeClassification(
    1,
    childPath,
    childEntryKind,
    childDomainKind,
    childNodeKind,
    isPrivateCategory
  );

  const base = verificationModel();
  const mimeticStructures = isMimeticParent
    ? [{ actions: null, paths: [parentPath] }]
    : [];

  const categoryName = parentPath.split('/').at(-1) ?? '';
  const catalogRoles = isMimeticParent
    ? new Map([
        [
          categoryName,
          {
            allowMultipleSymbols: false,
            category: categoryName,
            form: 'fragments' as const,
            implicitExtensions: [],
            name: 'api',
            rank: 1,
          },
        ],
      ])
    : new Map();

  const sortedPathToId = new Map([
    [childPath, 1],
    [parentPath, 0],
  ]);

  const sortedByPath = new Map([
    [childPath, childClassification],
    [parentPath, parentClassification],
  ]);

  return {
    ...base,
    basis: {
      ...base.basis,
      declarations: {
        ...base.basis.declarations,
        trees: [
          {
            catalog: {
              categoryToRole: catalogRoles,
              extensionToRole: new Map(),
              roles: [],
              subGraphRoles: [],
              topRank: 0,
            },
            externalDependencyPairs: [],
            foreignDomains: [],
            foreignNodes: { families: [], individualPaths: [] },
            horizontalHierarchies: [],
            localHorizontalHierarchies: [],
            mimeticPathStructures: mimeticStructures,
            originKind: 'root-layer',
            originPath: 'src',
            publicRootNodes: [],
            rootFragments: [],
            treeDependencyPairs: [],
          },
        ],
      },
      inventory: {
        items: [parentItem, childItem],
        pathToId: sortedPathToId,
        realPathToId: new Map(),
      },
    },
    taxonomy: {
      byItemId: new Map([
        [0, parentClassification],
        [1, childClassification],
      ]),
      byPath: sortedByPath,
      classifications: [parentClassification, childClassification],
    },
  };
};

const deepFreeze = <T>(target: T): T => {
  if (
    target === null ||
    typeof target !== 'object' ||
    ArrayBuffer.isView(target)
  ) {
    return target;
  }
  Object.freeze(target);
  for (const property of Object.values(target)) {
    if (
      property !== null &&
      typeof property === 'object' &&
      !Object.isFrozen(property)
    ) {
      deepFreeze(property);
    }
  }
  return target;
};

const allParentTypes: readonly TParentDomainType[] = [
  'category',
  'foreign-domain',
  'fractal-branch',
  'fragment',
  'layer',
  'mimetic-parent-category',
  'root-fragment',
  'root-layer',
];

const allChildTypes: readonly TDirectChildType[] = [
  'access-node',
  'category',
  'category-node',
  'foreign-domain',
  'foreign-node',
  'fractal-branch',
  'fragment',
  'fragment-node',
  'layer',
  'path-sub-category',
  'private-category',
  'root-fragment',
  'root-layer',
  'root-node',
  'sub-category',
  'sub-graph-node',
];

describe('verifyContainmentMatrix', () => {
  describe('matrix cells completeness (positive and negative)', () => {
    for (const parentType of allParentTypes) {
      for (const childType of allChildTypes) {
        const isAdmitted = CONTAINMENT_MATRIX[parentType].includes(childType);
        const expectation = isAdmitted ? 'admits' : 'rejects';

        it(`${expectation} ${childType} under ${parentType}`, () => {
          const model = buildSinglePairModel(parentType, childType);
          const outcomes = verifyContainmentMatrix(model);

          if (isAdmitted) {
            expect(outcomes).toEqual([]);
          } else {
            expect(outcomes).toEqual([
              {
                constraint: 'classification/containment-matrix',
                element: model.basis.inventory.items[1]?.path,
                family: 'classification',
                message: `'${model.basis.inventory.items[1]?.path}' is a child type that its parent Logical Domain does not admit`,
                normativeReference: 'FAF §6.8',
              },
            ]);
          }
        });
      }
    }
  });

  describe('adversarial cases', () => {
    it('rejects unauthorized-logical-node in containers that forbid logical files', () => {
      const parentItem = makeInventoryItem(0, 'src', 'directory', null);
      const childItem = makeInventoryItem(1, 'src/main.ts', 'file', 0);
      const parentClassification = makeClassification(
        0,
        'src',
        'directory',
        'root-layer',
        null
      );
      const childClassification = makeClassification(
        1,
        'src/main.ts',
        'file',
        null,
        'unauthorized-logical-node'
      );

      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [parentItem, childItem],
            pathToId: new Map([
              [childItem.path, 1],
              [parentItem.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, parentClassification],
            [1, childClassification],
          ]),
          byPath: new Map([
            [childItem.path, childClassification],
            [parentItem.path, parentClassification],
          ]),
          classifications: [parentClassification, childClassification],
        },
      };

      expect(verifyContainmentMatrix(model)).toEqual([
        {
          constraint: 'classification/containment-matrix',
          element: 'src/main.ts',
          family: 'classification',
          message:
            "'src/main.ts' is a child type that its parent Logical Domain does not admit",
          normativeReference: 'FAF §6.8',
        },
      ]);
    });

    it('leaves unauthorized files in Fragment or Category to fragment-anatomy and category-role', () => {
      const fragmentParent = makeInventoryItem(
        0,
        'src/_components/button',
        'directory',
        null
      );
      const fragmentChild = makeInventoryItem(
        1,
        'src/_components/button/utility.ts',
        'file',
        0
      );
      const fragmentParentClass = makeClassification(
        0,
        'src/_components/button',
        'directory',
        'fragment',
        null
      );
      const fragmentChildClass = makeClassification(
        1,
        'src/_components/button/utility.ts',
        'file',
        null,
        'unauthorized-logical-node'
      );

      const base = verificationModel();
      const fragmentModel: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [fragmentParent, fragmentChild],
            pathToId: new Map([
              [fragmentChild.path, 1],
              [fragmentParent.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, fragmentParentClass],
            [1, fragmentChildClass],
          ]),
          byPath: new Map([
            [fragmentChild.path, fragmentChildClass],
            [fragmentParent.path, fragmentParentClass],
          ]),
          classifications: [fragmentParentClass, fragmentChildClass],
        },
      };

      expect(verifyContainmentMatrix(fragmentModel)).toEqual([]);
    });

    it('rejects a direct Branch child of another Branch', () => {
      const parentItem = makeInventoryItem(
        0,
        'src/_src@shared',
        'directory',
        null
      );
      const childItem = makeInventoryItem(
        1,
        'src/_src@shared/_src@shared@shared',
        'directory',
        0
      );
      const parentClassification = makeClassification(
        0,
        'src/_src@shared',
        'directory',
        'fractal-branch',
        null
      );
      const childClassification = makeClassification(
        1,
        'src/_src@shared/_src@shared@shared',
        'directory',
        'fractal-branch',
        null
      );

      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [parentItem, childItem],
            pathToId: new Map([
              [childItem.path, 1],
              [parentItem.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, parentClassification],
            [1, childClassification],
          ]),
          byPath: new Map([
            [childItem.path, childClassification],
            [parentItem.path, parentClassification],
          ]),
          classifications: [parentClassification, childClassification],
        },
      };

      expect(verifyContainmentMatrix(model)).toEqual([
        {
          constraint: 'classification/containment-matrix',
          element: 'src/_src@shared/_src@shared@shared',
          family: 'classification',
          message:
            "'src/_src@shared/_src@shared@shared' is a child type that its parent Logical Domain does not admit",
          normativeReference: 'FAF §6.8',
        },
      ]);
    });

    it('rejects a direct Fragment child of another Fragment', () => {
      const parentItem = makeInventoryItem(
        0,
        'src/_components/button',
        'directory',
        null
      );
      const childItem = makeInventoryItem(
        1,
        'src/_components/button/icon',
        'directory',
        0
      );
      const parentClassification = makeClassification(
        0,
        'src/_components/button',
        'directory',
        'fragment',
        null
      );
      const childClassification = makeClassification(
        1,
        'src/_components/button/icon',
        'directory',
        'fragment',
        null
      );

      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [parentItem, childItem],
            pathToId: new Map([
              [childItem.path, 1],
              [parentItem.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, parentClassification],
            [1, childClassification],
          ]),
          byPath: new Map([
            [childItem.path, childClassification],
            [parentItem.path, parentClassification],
          ]),
          classifications: [parentClassification, childClassification],
        },
      };

      expect(verifyContainmentMatrix(model)).toEqual([
        {
          constraint: 'classification/containment-matrix',
          element: 'src/_components/button/icon',
          family: 'classification',
          message:
            "'src/_components/button/icon' is a child type that its parent Logical Domain does not admit",
          normativeReference: 'FAF §6.8',
        },
      ]);
    });

    it('rejects a direct Fragment child of a Layer', () => {
      const parentItem = makeInventoryItem(0, 'src/_domain', 'directory', null);
      const childItem = makeInventoryItem(
        1,
        'src/_domain/widget',
        'directory',
        0
      );
      const parentClassification = makeClassification(
        0,
        'src/_domain',
        'directory',
        'layer',
        null
      );
      const childClassification = makeClassification(
        1,
        'src/_domain/widget',
        'directory',
        'fragment',
        null
      );

      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [parentItem, childItem],
            pathToId: new Map([
              [childItem.path, 1],
              [parentItem.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, parentClassification],
            [1, childClassification],
          ]),
          byPath: new Map([
            [childItem.path, childClassification],
            [parentItem.path, parentClassification],
          ]),
          classifications: [parentClassification, childClassification],
        },
      };

      expect(verifyContainmentMatrix(model)).toEqual([
        {
          constraint: 'classification/containment-matrix',
          element: 'src/_domain/widget',
          family: 'classification',
          message:
            "'src/_domain/widget' is a child type that its parent Logical Domain does not admit",
          normativeReference: 'FAF §6.8',
        },
      ]);
    });

    it('rejects a direct Fragment child of a Root Layer', () => {
      const parentItem = makeInventoryItem(0, 'src', 'directory', null);
      const childItem = makeInventoryItem(1, 'src/widget', 'directory', 0);
      const parentClassification = makeClassification(
        0,
        'src',
        'directory',
        'root-layer',
        null
      );
      const childClassification = makeClassification(
        1,
        'src/widget',
        'directory',
        'fragment',
        null
      );

      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [parentItem, childItem],
            pathToId: new Map([
              [childItem.path, 1],
              [parentItem.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, parentClassification],
            [1, childClassification],
          ]),
          byPath: new Map([
            [childItem.path, childClassification],
            [parentItem.path, parentClassification],
          ]),
          classifications: [parentClassification, childClassification],
        },
      };

      expect(verifyContainmentMatrix(model)).toEqual([
        {
          constraint: 'classification/containment-matrix',
          element: 'src/widget',
          family: 'classification',
          message:
            "'src/widget' is a child type that its parent Logical Domain does not admit",
          normativeReference: 'FAF §6.8',
        },
      ]);
    });

    it('admits a Sub-Fragment mediated by a Private Category', () => {
      const fragmentItem = makeInventoryItem(
        0,
        'src/_components/button',
        'directory',
        null
      );
      const privateCategoryItem = makeInventoryItem(
        1,
        'src/_components/button/_components',
        'directory',
        0
      );
      const subFragmentItem = makeInventoryItem(
        2,
        'src/_components/button/_components/icon',
        'directory',
        1
      );

      const fragmentClassification = makeClassification(
        0,
        'src/_components/button',
        'directory',
        'fragment',
        null
      );
      const privateCategoryClassification = makeClassification(
        1,
        'src/_components/button/_components',
        'directory',
        'category',
        null,
        true
      );
      const subFragmentClassification = makeClassification(
        2,
        'src/_components/button/_components/icon',
        'directory',
        'fragment',
        null
      );

      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [fragmentItem, privateCategoryItem, subFragmentItem],
            pathToId: new Map([
              [fragmentItem.path, 0],
              [privateCategoryItem.path, 1],
              [subFragmentItem.path, 2],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, fragmentClassification],
            [1, privateCategoryClassification],
            [2, subFragmentClassification],
          ]),
          byPath: new Map([
            [fragmentItem.path, fragmentClassification],
            [privateCategoryItem.path, privateCategoryClassification],
            [subFragmentItem.path, subFragmentClassification],
          ]),
          classifications: [
            fragmentClassification,
            privateCategoryClassification,
            subFragmentClassification,
          ],
        },
      };

      expect(verifyContainmentMatrix(model)).toEqual([]);
    });

    it('ignores elements whose classification is null or unclassified', () => {
      const parentItem = makeInventoryItem(
        0,
        'src/unclassified-parent',
        'directory',
        null
      );
      const childDirectoryItem = makeInventoryItem(
        1,
        'src/unclassified-parent/unclassified-child',
        'directory',
        0
      );
      const childFileItem = makeInventoryItem(
        2,
        'src/unclassified-parent/file.ts',
        'file',
        0
      );

      const parentClassification = makeClassification(
        0,
        'src/unclassified-parent',
        'directory',
        null,
        null
      );
      const childDirectoryClassification = makeClassification(
        1,
        'src/unclassified-parent/unclassified-child',
        'directory',
        null,
        null
      );
      const childFileClassification = makeClassification(
        2,
        'src/unclassified-parent/file.ts',
        'file',
        null,
        null
      );

      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [parentItem, childDirectoryItem, childFileItem],
            pathToId: new Map([
              [childDirectoryItem.path, 1],
              [childFileItem.path, 2],
              [parentItem.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, parentClassification],
            [1, childDirectoryClassification],
            [2, childFileClassification],
          ]),
          byPath: new Map([
            [childDirectoryItem.path, childDirectoryClassification],
            [childFileItem.path, childFileClassification],
            [parentItem.path, parentClassification],
          ]),
          classifications: [
            parentClassification,
            childDirectoryClassification,
            childFileClassification,
          ],
        },
      };

      expect(verifyContainmentMatrix(model)).toEqual([]);
    });

    it('admits master-node under fragment by mapping it to fragment-node', () => {
      const parentItem = makeInventoryItem(
        0,
        'src/_components/button',
        'directory',
        null
      );
      const childItem = makeInventoryItem(
        1,
        'src/_components/button/button.component.ts',
        'file',
        0
      );

      const parentClassification = makeClassification(
        0,
        'src/_components/button',
        'directory',
        'fragment',
        null
      );
      const childClassification = makeClassification(
        1,
        'src/_components/button/button.component.ts',
        'file',
        null,
        'master-node'
      );

      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [parentItem, childItem],
            pathToId: new Map([
              [childItem.path, 1],
              [parentItem.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, parentClassification],
            [1, childClassification],
          ]),
          byPath: new Map([
            [childItem.path, childClassification],
            [parentItem.path, parentClassification],
          ]),
          classifications: [parentClassification, childClassification],
        },
      };

      expect(verifyContainmentMatrix(model)).toEqual([]);
    });

    it('handles mimetic paths with missing catalog roles gracefully', () => {
      const parentItem = makeInventoryItem(
        0,
        'src/_unknown',
        'directory',
        null
      );
      const childItem = makeInventoryItem(
        1,
        'src/_unknown/child',
        'directory',
        0
      );
      const parentClass = makeClassification(
        0,
        'src/_unknown',
        'directory',
        'category',
        null
      );
      const childClass = makeClassification(
        1,
        'src/_unknown/child',
        'directory',
        'fragment',
        null
      );
      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          declarations: {
            ...base.basis.declarations,
            trees: [
              {
                catalog: {
                  categoryToRole: new Map(),
                  extensionToRole: new Map(),
                  roles: [],
                  subGraphRoles: [],
                  topRank: 0,
                },
                externalDependencyPairs: [],
                foreignDomains: [],
                foreignNodes: { families: [], individualPaths: [] },
                horizontalHierarchies: [],
                localHorizontalHierarchies: [],
                mimeticPathStructures: [
                  { actions: null, paths: ['src/_unknown'] },
                ],
                originKind: 'root-layer',
                originPath: 'src',
                publicRootNodes: [],
                rootFragments: [],
                treeDependencyPairs: [],
              },
            ],
          },
          inventory: {
            items: [parentItem, childItem],
            pathToId: new Map([
              [childItem.path, 1],
              [parentItem.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, parentClass],
            [1, childClass],
          ]),
          byPath: new Map([
            [childItem.path, childClass],
            [parentItem.path, parentClass],
          ]),
          classifications: [parentClass, childClass],
        },
      };
      expect(verifyContainmentMatrix(model)).toEqual([]);
    });

    it('handles items missing from taxonomy lookup gracefully', () => {
      const parentItem = makeInventoryItem(0, 'src', 'directory', null);
      const childWithoutParentInTaxonomy = makeInventoryItem(
        1,
        'src/child-orphan',
        'directory',
        99
      );
      const childWithoutSelfInTaxonomy = makeInventoryItem(
        2,
        'src/self-orphan',
        'directory',
        0
      );
      const parentClass = makeClassification(
        0,
        'src',
        'directory',
        'root-layer',
        null
      );
      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [
              parentItem,
              childWithoutParentInTaxonomy,
              childWithoutSelfInTaxonomy,
            ],
            pathToId: new Map([
              [childWithoutParentInTaxonomy.path, 1],
              [childWithoutSelfInTaxonomy.path, 2],
              [parentItem.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([[0, parentClass]]),
          byPath: new Map([[parentItem.path, parentClass]]),
          classifications: [parentClass],
        },
      };
      expect(verifyContainmentMatrix(model)).toEqual([]);
    });

    it('treats Sub-Category and Path Sub-Category parents according to their respective rows', () => {
      const subCategoryParentItem = makeInventoryItem(
        0,
        'src/_types/_primitives',
        'directory',
        null
      );
      const subCategoryChildItem = makeInventoryItem(
        1,
        'src/_types/_primitives/value.type.ts',
        'file',
        0
      );
      const subCategoryParentClassification = makeClassification(
        0,
        'src/_types/_primitives',
        'directory',
        'sub-category',
        null
      );
      const subCategoryChildClassification = makeClassification(
        1,
        'src/_types/_primitives/value.type.ts',
        'file',
        null,
        'category-node'
      );

      const pathSubCategoryParentItem = makeInventoryItem(
        2,
        'src/_apis/_todos',
        'directory',
        null
      );
      const pathSubCategoryChildItem = makeInventoryItem(
        3,
        'src/_apis/_todos/_[todo-id]',
        'directory',
        2
      );
      const pathSubCategoryParentClassification = makeClassification(
        2,
        'src/_apis/_todos',
        'directory',
        'path-sub-category',
        null
      );
      const pathSubCategoryChildClassification = makeClassification(
        3,
        'src/_apis/_todos/_[todo-id]',
        'directory',
        'path-sub-category',
        null
      );

      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [
              subCategoryParentItem,
              subCategoryChildItem,
              pathSubCategoryParentItem,
              pathSubCategoryChildItem,
            ],
            pathToId: new Map([
              [pathSubCategoryChildItem.path, 3],
              [pathSubCategoryParentItem.path, 2],
              [subCategoryChildItem.path, 1],
              [subCategoryParentItem.path, 0],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, subCategoryParentClassification],
            [1, subCategoryChildClassification],
            [2, pathSubCategoryParentClassification],
            [3, pathSubCategoryChildClassification],
          ]),
          byPath: new Map([
            [pathSubCategoryChildItem.path, pathSubCategoryChildClassification],
            [
              pathSubCategoryParentItem.path,
              pathSubCategoryParentClassification,
            ],
            [subCategoryChildItem.path, subCategoryChildClassification],
            [subCategoryParentItem.path, subCategoryParentClassification],
          ]),
          classifications: [
            subCategoryParentClassification,
            subCategoryChildClassification,
            pathSubCategoryParentClassification,
            pathSubCategoryChildClassification,
          ],
        },
      };

      expect(verifyContainmentMatrix(model)).toEqual([]);
    });
  });

  describe('invariants: determinism and immutability', () => {
    it('is pure and does not mutate the verification model', () => {
      const model = buildSinglePairModel('root-layer', 'fragment');
      deepFreeze(model);

      expect(() => verifyContainmentMatrix(model)).not.toThrow();
    });

    it('returns deterministically ordered outcomes regardless of input item permutation', () => {
      const parent = makeInventoryItem(0, 'src', 'directory', null);
      const childA = makeInventoryItem(1, 'src/z-file.ts', 'file', 0);
      const childB = makeInventoryItem(2, 'src/a-file.ts', 'file', 0);
      const childC = makeInventoryItem(3, 'src/m-file.ts', 'file', 0);

      const parentClass = makeClassification(
        0,
        'src',
        'directory',
        'root-layer',
        null
      );
      const classA = makeClassification(
        1,
        'src/z-file.ts',
        'file',
        null,
        'unauthorized-logical-node'
      );
      const classB = makeClassification(
        2,
        'src/a-file.ts',
        'file',
        null,
        'unauthorized-logical-node'
      );
      const classC = makeClassification(
        3,
        'src/m-file.ts',
        'file',
        null,
        'unauthorized-logical-node'
      );

      const base = verificationModel();
      const modelForward: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [parent, childA, childB, childC],
            pathToId: new Map([
              ['src', 0],
              ['src/a-file.ts', 2],
              ['src/m-file.ts', 3],
              ['src/z-file.ts', 1],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, parentClass],
            [1, classA],
            [2, classB],
            [3, classC],
          ]),
          byPath: new Map([
            ['src', parentClass],
            ['src/a-file.ts', classB],
            ['src/m-file.ts', classC],
            ['src/z-file.ts', classA],
          ]),
          classifications: [parentClass, classA, classB, classC],
        },
      };

      const modelPermuted: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          inventory: {
            items: [childB, parent, childC, childA],
            pathToId: new Map([
              ['src', 0],
              ['src/a-file.ts', 2],
              ['src/m-file.ts', 3],
              ['src/z-file.ts', 1],
            ]),
            realPathToId: new Map(),
          },
        },
        taxonomy: {
          byItemId: new Map([
            [0, parentClass],
            [1, classA],
            [2, classB],
            [3, classC],
          ]),
          byPath: new Map([
            ['src', parentClass],
            ['src/a-file.ts', classB],
            ['src/m-file.ts', classC],
            ['src/z-file.ts', classA],
          ]),
          classifications: [classB, parentClass, classC, classA],
        },
      };

      const forwardOutcomes = verifyContainmentMatrix(modelForward);
      const permutedOutcomes = verifyContainmentMatrix(modelPermuted);

      expect(forwardOutcomes.map((item) => item.element)).toEqual([
        'src/a-file.ts',
        'src/m-file.ts',
        'src/z-file.ts',
      ]);
      expect(permutedOutcomes).toEqual(forwardOutcomes);
    });
  });
});
