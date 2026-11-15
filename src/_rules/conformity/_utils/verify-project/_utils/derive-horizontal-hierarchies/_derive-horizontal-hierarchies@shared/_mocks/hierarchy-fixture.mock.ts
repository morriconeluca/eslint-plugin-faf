import type {
  TEffectiveTree,
  TInventoryItem,
  TItemClassification,
  TProjectBasis,
  TRelationalQualifications,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

export function hierarchyFixture(
  entries: readonly (Partial<
    Omit<TItemClassification, 'relationalQualifications'>
  > &
    Pick<TItemClassification, 'path'> & {
      readonly relationalQualifications?: Partial<TRelationalQualifications>;
    })[],
  overrides: Partial<TEffectiveTree> = {}
): {
  readonly basis: TProjectBasis;
  readonly context: {
    readonly children: readonly TInventoryItem[];
    readonly parent: TInventoryItem;
    readonly taxonomy: TTaxonomyModel;
    readonly tree: TEffectiveTree;
  };
  readonly taxonomy: TTaxonomyModel;
} {
  const tree: TEffectiveTree = {
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
    horizontalHierarchyModels: [],
    mimeticPathStructures: [],
    originKind: 'root-layer',
    originPath: 'src',
    publicRootNodes: [],
    rootFragments: [],
    treeDependencyPairs: [],
    ...overrides,
  };
  const classifications: TItemClassification[] = entries.map(
    (entry, itemId) => ({
      domainKind: null,
      entryKind: entry.domainKind === undefined ? 'file' : 'directory',
      fragmentInternalRank: null,
      imposedRoleName: null,
      itemId,
      nodeKind: null,
      role: { kind: 'absent', roleName: null },
      ...entry,
      relationalQualifications: {
        isParentCategory: false,
        isPathFragment: false,
        isPrivateCategory: false,
        isSubFragment: false,
        isSubLayer: false,
        parentFragmentPath: null,
        ...entry.relationalQualifications,
      },
    })
  );
  const items = classifications.map((item) => ({
    depth: item.path.split('/').length - 1,
    id: item.itemId,
    isSymlink: false,
    kind: item.entryKind,
    parentId:
      classifications.find(
        (candidate) =>
          candidate.path === item.path.split('/').slice(0, -1).join('/')
      )?.itemId ?? null,
    path: item.path,
    preorderEnd: classifications.length,
    preorderStart: item.itemId,
    realPath: `/project/${item.path}`,
    treeOrigin: tree.originPath,
  }));
  const taxonomy = {
    byItemId: new Map(classifications.map((item) => [item.itemId, item])),
    byPath: new Map(classifications.map((item) => [item.path, item])),
    classifications,
  };
  const basis: TProjectBasis = {
    aliases: [],
    baseDirectory: '/project',
    configPath: '/project/faf.config.ts',
    declarations: { aliases: [], baseDirectory: '/project', trees: [tree] },
    inventory: {
      items,
      pathToId: new Map(items.map((item) => [item.path, item.id])),
      realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
    },
    inventoryOutcomes: [],
    kind: 'ready',
    loadedFiles: [],
  };
  const parent = items[0];
  if (parent === undefined) {
    return {
      basis,
      context: {
        children: [],
        parent: {
          depth: 0,
          id: 0,
          isSymlink: false,
          kind: 'directory',
          parentId: null,
          path: 'src',
          preorderEnd: 0,
          preorderStart: 0,
          realPath: '/project/src',
          treeOrigin: 'src',
        },
        taxonomy,
        tree,
      },
      taxonomy,
    };
  }
  return {
    basis,
    context: {
      children: items.filter((item) => item.parentId === parent.id),
      parent,
      taxonomy,
      tree,
    },
    taxonomy,
  };
}
