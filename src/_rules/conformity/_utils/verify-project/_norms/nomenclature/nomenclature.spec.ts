import { describe, expect, it } from 'vitest';

import type {
  TEffectiveTree,
  TInventory,
  TInventoryItem,
  TItemClassification,
  TTaxonomyModel,
  TVerificationModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';

import { verificationModel } from '../_norms@shared/_mocks/verification-model.mock.js';
import { verifyNomenclature } from './nomenclature.norm.js';

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const createClassification = (
  overrides: Partial<TItemClassification> &
    Pick<TItemClassification, 'entryKind' | 'itemId' | 'path'>
): TItemClassification => ({
  domainKind: null,
  fragmentInternalRank: null,
  imposedRoleName: null,
  nodeKind: null,
  relationalQualifications: qualifications,
  role: { kind: 'absent', roleName: null },
  ...overrides,
});

const createInventoryItem = (
  id: number,
  path: string,
  kind: 'directory' | 'file',
  parentId: null | number = null
): TInventoryItem => ({
  depth: path.split('/').length - 1,
  id,
  isSymlink: false,
  kind,
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const defaultTree: TEffectiveTree = {
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 1,
  },
  externalDependencyPairs: [],
  foreignDomains: ['src/_tooling'],
  foreignNodes: { families: [], individualPaths: ['src/Design.Notes.MD'] },
  horizontalHierarchies: [],
  horizontalHierarchyModels: [],
  mimeticPathStructures: [
    { actions: ['get', 'get-or-create', 'post'], paths: ['src/_apis'] },
    { actions: null, paths: ['src/_pages'] },
  ],
  originKind: 'root-layer',
  originPath: 'src',
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
};

const buildModel = (
  classifications: readonly TItemClassification[],
  items: readonly TInventoryItem[]
): TVerificationModel => {
  const base = verificationModel();
  const taxonomy: TTaxonomyModel = {
    byItemId: new Map(classifications.map((entry) => [entry.itemId, entry])),
    byPath: new Map(classifications.map((entry) => [entry.path, entry])),
    classifications,
  };
  const inventory: TInventory = {
    items,
    pathToId: new Map(items.map((entry) => [entry.path, entry.id])),
    realPathToId: new Map(items.map((entry) => [entry.realPath, entry.id])),
  };

  return {
    ...base,
    basis: {
      ...base.basis,
      declarations: {
        ...base.basis.declarations,
        trees: [defaultTree],
      },
      inventory,
    },
    taxonomy,
  };
};

describe('verifyNomenclature', () => {
  it('returns empty outcomes for a fully conforming model', () => {
    const classifications = [
      createClassification({
        domainKind: 'category',
        entryKind: 'directory',
        itemId: 0,
        path: 'src/_components',
      }),
      createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 1,
        path: 'src/_components/button',
      }),
      createClassification({
        entryKind: 'file',
        itemId: 2,
        nodeKind: 'master-node',
        path: 'src/_components/button/button.component.tsx',
      }),
      createClassification({
        entryKind: 'file',
        itemId: 3,
        nodeKind: 'access-node',
        path: 'src/_components/button/index.ts',
      }),
      createClassification({
        domainKind: 'fractal-branch',
        entryKind: 'directory',
        itemId: 4,
        path: 'src/_components/button/_button@shared',
      }),
    ];
    const items = [
      createInventoryItem(0, 'src/_components', 'directory'),
      createInventoryItem(1, 'src/_components/button', 'directory', 0),
      createInventoryItem(
        2,
        'src/_components/button/button.component.tsx',
        'file',
        1
      ),
      createInventoryItem(3, 'src/_components/button/index.ts', 'file', 1),
      createInventoryItem(
        4,
        'src/_components/button/_button@shared',
        'directory',
        1
      ),
    ];
    const model = buildModel(classifications, items);
    const outcomes = verifyNomenclature(model);

    expect(outcomes).toEqual([]);
  });

  it('exempts tree origins, Root Fragments, Root Nodes, and Foreign Nodes/Domains', () => {
    const classifications = [
      createClassification({
        domainKind: 'root-layer',
        entryKind: 'directory',
        itemId: 0,
        path: 'src',
      }),
      createClassification({
        entryKind: 'file',
        itemId: 1,
        nodeKind: 'root-node',
        path: 'src/AppEntry.tsx',
      }),
      createClassification({
        entryKind: 'file',
        itemId: 2,
        nodeKind: 'foreign-node',
        path: 'src/Design.Notes.MD',
      }),
      createClassification({
        domainKind: 'foreign-domain',
        entryKind: 'directory',
        itemId: 3,
        path: 'src/_tooling',
      }),
    ];
    const items = [
      createInventoryItem(0, 'src', 'directory'),
      createInventoryItem(1, 'src/AppEntry.tsx', 'file', 0),
      createInventoryItem(2, 'src/Design.Notes.MD', 'file', 0),
      createInventoryItem(3, 'src/_tooling', 'directory', 0),
    ];
    const model = buildModel(classifications, items);
    const outcomes = verifyNomenclature(model);

    expect(outcomes).toEqual([]);
  });

  it('reports violations for invalid Category Nodes, Fragments, and Path Fragments', () => {
    const classifications = [
      createClassification({
        domainKind: 'category',
        entryKind: 'directory',
        itemId: 0,
        path: 'src/components',
      }),
      createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 1,
        path: 'src/_utils/UserProfile',
      }),
      createClassification({
        entryKind: 'file',
        itemId: 2,
        nodeKind: 'master-node',
        path: 'src/_utils/UserProfile/UserProfile.util.ts',
      }),
      createClassification({
        entryKind: 'file',
        itemId: 3,
        nodeKind: 'category-node',
        path: 'src/_types/userProfile.type.ts',
      }),
      createClassification({
        domainKind: 'path-sub-category',
        entryKind: 'directory',
        itemId: 4,
        path: 'src/_apis/_[todoId]',
      }),
      createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 5,
        path: 'src/_apis/delete-todo',
        relationalQualifications: {
          ...qualifications,
          isPathFragment: true,
        },
      }),
      createClassification({
        entryKind: 'file',
        itemId: 6,
        nodeKind: 'master-node',
        path: 'src/_apis/delete-todo/delete-todo.api.ts',
      }),
    ];
    const items = [
      createInventoryItem(0, 'src/components', 'directory'),
      createInventoryItem(1, 'src/_utils/UserProfile', 'directory'),
      createInventoryItem(
        2,
        'src/_utils/UserProfile/UserProfile.util.ts',
        'file',
        1
      ),
      createInventoryItem(3, 'src/_types/userProfile.type.ts', 'file'),
      createInventoryItem(4, 'src/_apis/_[todoId]', 'directory'),
      createInventoryItem(5, 'src/_apis/delete-todo', 'directory'),
      createInventoryItem(
        6,
        'src/_apis/delete-todo/delete-todo.api.ts',
        'file',
        5
      ),
    ];
    const model = buildModel(classifications, items);
    const outcomes = verifyNomenclature(model);

    expect(outcomes.map((item) => item.element)).toEqual([
      'src/_apis/_[todoId]',
      'src/_apis/delete-todo',
      'src/_apis/delete-todo/delete-todo.api.ts',
      'src/_types/userProfile.type.ts',
      'src/_utils/UserProfile',
      'src/_utils/UserProfile/UserProfile.util.ts',
      'src/components',
    ]);
  });

  it('guarantees deterministic ordering under input permutation', () => {
    const classifications = [
      createClassification({
        domainKind: 'category',
        entryKind: 'directory',
        itemId: 0,
        path: 'src/_z_bad',
      }),
      createClassification({
        domainKind: 'category',
        entryKind: 'directory',
        itemId: 1,
        path: 'src/_a_bad',
      }),
      createClassification({
        domainKind: 'category',
        entryKind: 'directory',
        itemId: 2,
        path: 'src/_m_bad',
      }),
    ];
    const items = [
      createInventoryItem(0, 'src/_z_bad', 'directory'),
      createInventoryItem(1, 'src/_a_bad', 'directory'),
      createInventoryItem(2, 'src/_m_bad', 'directory'),
    ];

    const reversed = [
      classifications[1],
      classifications[2],
      classifications[0],
    ].filter((entry): entry is TItemClassification => entry !== undefined);
    const modelNormal = buildModel(classifications, items);
    const modelReversed = buildModel(reversed, items);

    const outcomesNormal = verifyNomenclature(modelNormal);
    const outcomesReversed = verifyNomenclature(modelReversed);

    expect(outcomesNormal.map((entry) => entry.element)).toEqual([
      'src/_a_bad',
      'src/_m_bad',
      'src/_z_bad',
    ]);
    expect(outcomesNormal).toEqual(outcomesReversed);
  });

  it('does not mutate the verification model', () => {
    const classifications = Object.freeze([
      createClassification({
        domainKind: 'category',
        entryKind: 'directory',
        itemId: 0,
        path: 'src/_components',
      }),
    ]);
    const items = Object.freeze([
      createInventoryItem(0, 'src/_components', 'directory'),
    ]);
    const model = buildModel(classifications, items);
    const serializedBefore = JSON.stringify(model);

    verifyNomenclature(model);

    const serializedAfter = JSON.stringify(model);
    expect(serializedBefore).toBe(serializedAfter);
  });

  it('deduplicates multiple reports for the same element path', () => {
    const duplicate = createClassification({
      domainKind: 'category',
      entryKind: 'directory',
      itemId: 0,
      path: 'src/components',
    });
    const items = [createInventoryItem(0, 'src/components', 'directory')];
    const model = buildModel([duplicate, duplicate], items);
    const outcomes = verifyNomenclature(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.element).toBe('src/components');
  });

  it('validates fractal-branch naming, layer/sub-category naming, path-sub-category static vs dynamic naming, and missing tree/item guards', () => {
    const classifications = [
      createClassification({
        domainKind: 'root-layer',
        entryKind: 'directory',
        itemId: 0,
        path: 'src_invalid_origin',
      }),
      createClassification({
        domainKind: 'category',
        entryKind: 'directory',
        itemId: 1,
        path: 'src/_components',
      }),
      createClassification({
        domainKind: 'fractal-branch',
        entryKind: 'directory',
        itemId: 2,
        path: 'src/_components/_wrong@shared',
      }),
      createClassification({
        domainKind: 'layer',
        entryKind: 'directory',
        itemId: 3,
        path: 'src/BadLayer',
      }),
      createClassification({
        domainKind: 'sub-category',
        entryKind: 'directory',
        itemId: 4,
        path: 'src/_components/BadSub',
      }),
      createClassification({
        domainKind: 'path-sub-category',
        entryKind: 'directory',
        itemId: 5,
        path: 'src/_apis/no-underscore',
      }),
      createClassification({
        domainKind: 'path-sub-category',
        entryKind: 'directory',
        itemId: 6,
        path: 'src/_apis/_valid-static',
      }),
      createClassification({
        domainKind: 'path-sub-category',
        entryKind: 'directory',
        itemId: 7,
        path: 'src/_apis/_[valid-param]',
      }),
      createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 8,
        path: 'src/_apis/get',
        relationalQualifications: { ...qualifications, isPathFragment: true },
      }),
      createClassification({
        entryKind: 'file',
        itemId: 9,
        nodeKind: 'access-node',
        path: 'src/_apis/get/index.ts',
      }),
      createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 10,
        path: 'src/_pages/ValidPage',
        relationalQualifications: { ...qualifications, isPathFragment: true },
      }),
      createClassification({
        domainKind: 'fragment',
        entryKind: 'directory',
        itemId: 11,
        path: 'src/_pages/valid-page',
        relationalQualifications: { ...qualifications, isPathFragment: true },
      }),
      createClassification({
        entryKind: 'file',
        itemId: 12,
        nodeKind: 'master-node',
        path: 'src/_apis/get/get.api.ts',
      }),
      createClassification({
        entryKind: 'file',
        itemId: 13,
        nodeKind: 'master-node',
        path: 'missing-tree/BadFile.util.ts',
      }),
      createClassification({
        domainKind: 'category',
        entryKind: 'directory',
        itemId: 99,
        path: 'src/_missing_from_inventory',
      }),
    ];
    const items = [
      createInventoryItem(0, 'src_invalid_origin', 'directory'),
      createInventoryItem(1, 'src/_components', 'directory'),
      createInventoryItem(2, 'src/_components/_wrong@shared', 'directory', 1),
      createInventoryItem(3, 'src/BadLayer', 'directory'),
      createInventoryItem(4, 'src/_components/BadSub', 'directory', 1),
      createInventoryItem(5, 'src/_apis/no-underscore', 'directory'),
      createInventoryItem(6, 'src/_apis/_valid-static', 'directory'),
      createInventoryItem(7, 'src/_apis/_[valid-param]', 'directory'),
      createInventoryItem(8, 'src/_apis/get', 'directory'),
      createInventoryItem(9, 'src/_apis/get/index.ts', 'file', 8),
      createInventoryItem(10, 'src/_pages/ValidPage', 'directory'),
      createInventoryItem(11, 'src/_pages/valid-page', 'directory'),
      createInventoryItem(12, 'src/_apis/get/get.api.ts', 'file', 8),
      {
        ...createInventoryItem(13, 'missing-tree/BadFile.util.ts', 'file'),
        treeOrigin: 'unknown-origin',
      },
    ];
    const treeWithCustomOrigin: TEffectiveTree = {
      ...defaultTree,
      originPath: 'src_invalid_origin',
    };
    const baseModel = buildModel(classifications, items);
    const model: TVerificationModel = {
      ...baseModel,
      basis: {
        ...baseModel.basis,
        declarations: {
          ...baseModel.basis.declarations,
          trees: [defaultTree, treeWithCustomOrigin],
        },
      },
    };

    const outcomes = verifyNomenclature(model);
    expect(outcomes.map((item) => item.element)).toEqual([
      'src/BadLayer',
      'src/_apis/get',
      'src/_apis/get/get.api.ts',
      'src/_apis/no-underscore',
      'src/_components/BadSub',
      'src/_components/_wrong@shared',
      'src/_pages/ValidPage',
    ]);
  });
});
