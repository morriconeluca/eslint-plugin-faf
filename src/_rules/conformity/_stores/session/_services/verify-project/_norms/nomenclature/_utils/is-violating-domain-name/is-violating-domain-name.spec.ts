import { describe, expect, it } from 'vitest';

import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { isViolatingDomainName } from './index.js';

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
    Pick<TItemClassification, 'domainKind' | 'itemId' | 'path'>
): TItemClassification => ({
  entryKind: 'directory',
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
  parentId: null | number = null,
  treeOrigin: null | string = 'src'
): TInventoryItem => ({
  depth: path.split('/').length - 1,
  id,
  isSymlink: false,
  kind: 'directory',
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin,
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
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-layer',
  originPath: 'src',
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
};

const createInventory = (items: readonly TInventoryItem[]): TInventory => ({
  items,
  pathToId: new Map(items.map((item) => [item.path, item.id])),
  realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
});

describe('isViolatingDomainName', () => {
  it('returns false for files, null domains, or mimetic domains', () => {
    const fileClassification = createClassification({
      domainKind: 'fragment',
      entryKind: 'file',
      itemId: 0,
      path: 'src/_utils/widget/widget.util.ts',
    });
    const unclassified = createClassification({
      domainKind: null,
      itemId: 1,
      path: 'src/unknown',
    });
    const pathSubCategory = createClassification({
      domainKind: 'path-sub-category',
      itemId: 2,
      path: 'src/_apis/_todos',
    });
    const pathFragment = createClassification({
      domainKind: 'fragment',
      itemId: 3,
      path: 'src/_apis/get-todos',
      relationalQualifications: {
        ...qualifications,
        isPathFragment: true,
      },
    });
    const inventory = createInventory([
      createInventoryItem(0, 'src/_utils/widget/widget.util.ts'),
      createInventoryItem(1, 'src/unknown'),
      createInventoryItem(2, 'src/_apis/_todos'),
      createInventoryItem(3, 'src/_apis/get-todos'),
    ]);

    expect(
      isViolatingDomainName(fileClassification, inventory, [defaultTree])
    ).toBe(false);
    expect(isViolatingDomainName(unclassified, inventory, [defaultTree])).toBe(
      false
    );
    expect(
      isViolatingDomainName(pathSubCategory, inventory, [defaultTree])
    ).toBe(false);
    expect(isViolatingDomainName(pathFragment, inventory, [defaultTree])).toBe(
      false
    );
  });

  it('returns false when the inventory item is missing, outside tree, or tree is unresolved', () => {
    const classification = createClassification({
      domainKind: 'fragment',
      itemId: 99,
      path: 'src/_utils/widget',
    });
    const outsideClassification = createClassification({
      domainKind: 'fragment',
      itemId: 0,
      path: 'outside',
    });
    const inventory = createInventory([
      createInventoryItem(0, 'outside', null, null),
    ]);

    expect(
      isViolatingDomainName(classification, inventory, [defaultTree])
    ).toBe(false);
    expect(
      isViolatingDomainName(outsideClassification, inventory, [defaultTree])
    ).toBe(false);
    expect(isViolatingDomainName(classification, inventory, [])).toBe(false);
  });

  it('exempts tree origins, root fragments, root layers, and foreign domains', () => {
    const origin = createClassification({
      domainKind: 'root-layer',
      itemId: 0,
      path: 'src',
    });
    const rootFrag = createClassification({
      domainKind: 'root-fragment',
      itemId: 1,
      path: 'src/AppShell',
    });
    const foreign = createClassification({
      domainKind: 'foreign-domain',
      itemId: 2,
      path: 'src/foreign',
    });
    const inventory = createInventory([
      createInventoryItem(0, 'src'),
      createInventoryItem(1, 'src/AppShell'),
      createInventoryItem(2, 'src/foreign'),
    ]);

    expect(isViolatingDomainName(origin, inventory, [defaultTree])).toBe(false);
    expect(isViolatingDomainName(rootFrag, inventory, [defaultTree])).toBe(
      false
    );
    expect(isViolatingDomainName(foreign, inventory, [defaultTree])).toBe(
      false
    );
  });

  describe('categories, sub-categories, and layers', () => {
    it('accepts underscored kebab-case names', () => {
      const category = createClassification({
        domainKind: 'category',
        itemId: 0,
        path: 'src/_components',
      });
      const subCategory = createClassification({
        domainKind: 'sub-category',
        itemId: 1,
        path: 'src/_utils/_atoms',
      });
      const layer = createClassification({
        domainKind: 'layer',
        itemId: 2,
        path: 'src/_domain-layer',
      });
      const inventory = createInventory([
        createInventoryItem(0, 'src/_components'),
        createInventoryItem(1, 'src/_utils/_atoms'),
        createInventoryItem(2, 'src/_domain-layer'),
      ]);

      expect(isViolatingDomainName(category, inventory, [defaultTree])).toBe(
        false
      );
      expect(isViolatingDomainName(subCategory, inventory, [defaultTree])).toBe(
        false
      );
      expect(isViolatingDomainName(layer, inventory, [defaultTree])).toBe(
        false
      );
    });

    it('rejects missing underscore, uppercase letters, underscores in body, or empty names', () => {
      const noUnderscore = createClassification({
        domainKind: 'category',
        itemId: 0,
        path: 'src/components',
      });
      const badCasing = createClassification({
        domainKind: 'layer',
        itemId: 1,
        path: 'src/_BadLayer',
      });
      const underscoreBody = createClassification({
        domainKind: 'sub-category',
        itemId: 2,
        path: 'src/_sub_atoms',
      });
      const emptyName = createClassification({
        domainKind: 'category',
        itemId: 3,
        path: 'src/_',
      });
      const inventory = createInventory([
        createInventoryItem(0, 'src/components'),
        createInventoryItem(1, 'src/_BadLayer'),
        createInventoryItem(2, 'src/_sub_atoms'),
        createInventoryItem(3, 'src/_'),
      ]);

      expect(
        isViolatingDomainName(noUnderscore, inventory, [defaultTree])
      ).toBe(true);
      expect(isViolatingDomainName(badCasing, inventory, [defaultTree])).toBe(
        true
      );
      expect(
        isViolatingDomainName(underscoreBody, inventory, [defaultTree])
      ).toBe(true);
      expect(isViolatingDomainName(emptyName, inventory, [defaultTree])).toBe(
        true
      );
    });
  });

  describe('fractal branches', () => {
    it('accepts exact branch scope for root, fragment, and category parents', () => {
      const inventory = createInventory([
        createInventoryItem(0, 'src'),
        createInventoryItem(1, 'src/_src@shared', 0),
        createInventoryItem(2, 'src/_components/button', 0),
        createInventoryItem(3, 'src/_components/button/_button@shared', 2),
        createInventoryItem(4, 'src/_hooks', 0),
        createInventoryItem(5, 'src/_hooks/_hooks@shared', 4),
        createInventoryItem(6, '_root_parent'),
        createInventoryItem(7, '_root_parent@shared', 6),
      ]);

      expect(
        isViolatingDomainName(
          createClassification({
            domainKind: 'fractal-branch',
            itemId: 1,
            path: 'src/_src@shared',
          }),
          inventory,
          [defaultTree]
        )
      ).toBe(false);
      expect(
        isViolatingDomainName(
          createClassification({
            domainKind: 'fractal-branch',
            itemId: 3,
            path: 'src/_components/button/_button@shared',
          }),
          inventory,
          [defaultTree]
        )
      ).toBe(false);
      expect(
        isViolatingDomainName(
          createClassification({
            domainKind: 'fractal-branch',
            itemId: 5,
            path: 'src/_hooks/_hooks@shared',
          }),
          inventory,
          [defaultTree]
        )
      ).toBe(false);
    });

    it('rejects mismatched scope, missing parent item, or null parentId', () => {
      const inventory = createInventory([
        createInventoryItem(0, 'src/_components/button'),
        createInventoryItem(1, 'src/_components/button/_other@shared', 0),
        createInventoryItem(2, 'src/_components/button/__button@shared', 0),
        createInventoryItem(3, 'orphan-branch', null),
        createInventoryItem(4, 'broken-parent', 99),
      ]);

      expect(
        isViolatingDomainName(
          createClassification({
            domainKind: 'fractal-branch',
            itemId: 1,
            path: 'src/_components/button/_other@shared',
          }),
          inventory,
          [defaultTree]
        )
      ).toBe(true);
      expect(
        isViolatingDomainName(
          createClassification({
            domainKind: 'fractal-branch',
            itemId: 2,
            path: 'src/_components/button/__button@shared',
          }),
          inventory,
          [defaultTree]
        )
      ).toBe(true);
      expect(
        isViolatingDomainName(
          createClassification({
            domainKind: 'fractal-branch',
            itemId: 3,
            path: 'orphan-branch',
          }),
          inventory,
          [defaultTree]
        )
      ).toBe(true);
      expect(
        isViolatingDomainName(
          createClassification({
            domainKind: 'fractal-branch',
            itemId: 4,
            path: 'broken-parent',
          }),
          inventory,
          [defaultTree]
        )
      ).toBe(true);
    });
  });

  describe('ordinary fragments', () => {
    it('accepts kebab-case ordinary fragments without slashes or with slashes', () => {
      const inventory = createInventory([
        createInventoryItem(0, 'src/_utils/user-profile'),
        createInventoryItem(1, 'direct-fragment'),
      ]);

      expect(
        isViolatingDomainName(
          createClassification({
            domainKind: 'fragment',
            itemId: 0,
            path: 'src/_utils/user-profile',
          }),
          inventory,
          [defaultTree]
        )
      ).toBe(false);
      expect(
        isViolatingDomainName(
          createClassification({
            domainKind: 'fragment',
            itemId: 1,
            path: 'direct-fragment',
          }),
          inventory,
          [{ ...defaultTree, originPath: 'other-origin' }]
        )
      ).toBe(false);
    });

    it('rejects leading underscore or non-kebab-case fragment names', () => {
      const cases = [
        'src/_utils/UserProfile',
        'src/_utils/user_profile',
        'src/_utils/_user-profile',
        'src/_utils/user--profile',
        'src/_utils/-user',
        'src/_utils/user-',
      ];
      const inventory = createInventory(
        cases.map((path, index) => createInventoryItem(index, path))
      );

      for (const [index, path] of cases.entries()) {
        expect(
          isViolatingDomainName(
            createClassification({
              domainKind: 'fragment',
              itemId: index,
              path,
            }),
            inventory,
            [defaultTree]
          )
        ).toBe(true);
      }
    });
  });
});
