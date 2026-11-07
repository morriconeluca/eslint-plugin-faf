import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveDeclarations } from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TEntryKind,
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { OUTCOME_CATALOG } from '../../../../../../_conformity@shared/_configs/outcome-catalog.config.js';
import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyExclusiveForms } from './exclusive-forms.norm.js';

type TItemSpec = {
  readonly domainKind?: null | TLogicalDomainKind;
  readonly id: number;
  readonly kind: TEntryKind;
  readonly nodeKind?: null | TNodeKind;
  readonly parentId: null | number;
  readonly path: string;
};

const defaultQualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const defaultRole = { kind: 'absent' as const, roleName: null };

const buildInventoryItem = (spec: TItemSpec): TInventoryItem => ({
  depth: spec.path.split('/').length - 1,
  id: spec.id,
  isSymlink: false,
  kind: spec.kind,
  parentId: spec.parentId,
  path: spec.path,
  preorderEnd: spec.id,
  preorderStart: spec.id,
  realPath: spec.path,
  treeOrigin: 'src',
});

const buildClassification = (spec: TItemSpec): TItemClassification => ({
  domainKind: spec.domainKind ?? null,
  entryKind: spec.kind,
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: spec.id,
  nodeKind: spec.nodeKind ?? null,
  path: spec.path,
  relationalQualifications: defaultQualifications,
  role: defaultRole,
});

const buildModel = (
  specs: readonly TItemSpec[],
  mimeticPaths: readonly string[] = []
): TVerificationModel => {
  const inventoryItems = specs.map((spec) => buildInventoryItem(spec));
  const classifications = specs.map((spec) => buildClassification(spec));

  const inventory: TInventory = {
    items: inventoryItems,
    pathToId: new Map(specs.map((spec) => [spec.path, spec.id])),
    realPathToId: new Map(specs.map((spec) => [spec.path, spec.id])),
  };

  const taxonomy: TTaxonomyModel = {
    byItemId: new Map(classifications.map((item) => [item.itemId, item])),
    byPath: new Map(classifications.map((item) => [item.path, item])),
    classifications,
  };

  const declarations: TEffectiveDeclarations = {
    aliases: [],
    baseDirectory: '/project',
    trees: [
      {
        catalog: {
          categoryToRole: new Map(),
          extensionToRole: new Map(),
          roles: [],
          subGraphRoles: [],
          topRank: 20,
        },
        externalDependencyPairs: [],
        foreignDomains: [],
        foreignNodes: { families: [], individualPaths: [] },
        horizontalHierarchies: [],
        localHorizontalHierarchies: [],
        mimeticPathStructures:
          mimeticPaths.length > 0
            ? [{ actions: null, paths: mimeticPaths }]
            : [],
        originKind: 'root-layer',
        originPath: 'src',
        publicRootNodes: [],
        rootFragments: [],
        treeDependencyPairs: [],
      },
    ],
  };

  return {
    ...verificationModel(),
    basis: {
      ...verificationModel().basis,
      declarations,
      inventory,
    },
    taxonomy,
  };
};

describe('verifyExclusiveForms', () => {
  it('returns no outcomes for an empty inventory', () => {
    const model = buildModel([]);
    expect(verifyExclusiveForms(model)).toEqual([]);
  });

  it('returns no outcomes for empty containers of each type', () => {
    const model = buildModel([
      {
        domainKind: 'root-layer',
        id: 0,
        kind: 'directory',
        parentId: null,
        path: 'src',
      },
      {
        domainKind: 'layer',
        id: 1,
        kind: 'directory',
        parentId: 0,
        path: 'src/_domain',
      },
      {
        domainKind: 'category',
        id: 2,
        kind: 'directory',
        parentId: 1,
        path: 'src/_domain/_types',
      },
      {
        domainKind: 'sub-category',
        id: 3,
        kind: 'directory',
        parentId: 2,
        path: 'src/_domain/_types/_primitives',
      },
      {
        domainKind: 'fractal-branch',
        id: 4,
        kind: 'directory',
        parentId: 1,
        path: 'src/_domain/_domain@shared',
      },
    ]);
    expect(verifyExclusiveForms(model)).toEqual([]);
  });

  describe('Root Layer forms', () => {
    it('accepts a Root Layer containing only Categories', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'category',
          id: 2,
          kind: 'directory',
          parentId: 0,
          path: 'src/_utils',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('accepts a Root Layer containing only Layers', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'layer',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_domain',
        },
        {
          domainKind: 'layer',
          id: 2,
          kind: 'directory',
          parentId: 0,
          path: 'src/_ui',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('reports a Root Layer mixing Categories and Layers', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'layer',
          id: 2,
          kind: 'directory',
          parentId: 0,
          path: 'src/_ui',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src');
      expect(outcomes[0]?.family).toBe('classification');
      expect(outcomes[0]?.message).toContain(
        OUTCOME_CATALOG['classification/exclusive-forms'].predicate
      );
      expect(outcomes[0]?.normativeReference).toBe(
        OUTCOME_CATALOG['classification/exclusive-forms'].normativeReference
      );
    });

    it('allows an accessory Branch, Foreign Domain, and Foreign Node in a Root Layer', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'fractal-branch',
          id: 2,
          kind: 'directory',
          parentId: 0,
          path: 'src/_src@shared',
        },
        {
          domainKind: 'foreign-domain',
          id: 3,
          kind: 'directory',
          parentId: 0,
          path: 'src/_foreign',
        },
        {
          id: 4,
          kind: 'file',
          nodeKind: 'foreign-node',
          parentId: 0,
          path: 'src/README.md',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });
  });

  describe('Layer forms', () => {
    it('accepts a Layer containing only Categories', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'layer',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_domain',
        },
        {
          domainKind: 'category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_domain/_types',
        },
        {
          domainKind: 'category',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_domain/_schemas',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('accepts a Layer containing only Sub-Layers', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'layer',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_domain',
        },
        {
          domainKind: 'layer',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_domain/_one',
        },
        {
          domainKind: 'layer',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_domain/_two',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('reports a Layer mixing Categories and Sub-Layers', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'layer',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_domain',
        },
        {
          domainKind: 'category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_domain/_types',
        },
        {
          domainKind: 'layer',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_domain/_ui',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_domain');
    });

    it('allows an accessory Branch, Foreign Domain, and Foreign Node in a Layer', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'layer',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_domain',
        },
        {
          domainKind: 'layer',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_domain/_sub',
        },
        {
          domainKind: 'fractal-branch',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_domain/_domain@shared',
        },
        {
          domainKind: 'foreign-domain',
          id: 4,
          kind: 'directory',
          parentId: 1,
          path: 'src/_domain/_foreign',
        },
        {
          id: 5,
          kind: 'file',
          nodeKind: 'foreign-node',
          parentId: 1,
          path: 'src/_domain/README.md',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });
  });

  describe('Fractal Branch forms', () => {
    it('accepts a Fractal Branch containing only Categories', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'fractal-branch',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_src@shared',
        },
        {
          domainKind: 'category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_src@shared/_types',
        },
        {
          domainKind: 'category',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_src@shared/_utils',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('accepts a Fractal Branch containing only Layers', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'fractal-branch',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_src@shared',
        },
        {
          domainKind: 'layer',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_src@shared/_domain',
        },
        {
          domainKind: 'layer',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_src@shared/_ui',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('reports a Fractal Branch mixing Categories and Layers', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'fractal-branch',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_src@shared',
        },
        {
          domainKind: 'category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_src@shared/_utils',
        },
        {
          domainKind: 'layer',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_src@shared/_ui',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_src@shared');
    });

    it('allows a Foreign Domain and Foreign Node in a Fractal Branch', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'fractal-branch',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_src@shared',
        },
        {
          domainKind: 'category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_src@shared/_types',
        },
        {
          domainKind: 'foreign-domain',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_src@shared/_foreign',
        },
        {
          id: 4,
          kind: 'file',
          nodeKind: 'foreign-node',
          parentId: 1,
          path: 'src/_src@shared/README.md',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });
  });

  describe('Category forms', () => {
    it('accepts a Category containing only Sub-Categories', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_components',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/_atoms',
        },
        {
          domainKind: 'sub-category',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/_molecules',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('accepts a Category containing only Fragments', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_components',
        },
        {
          domainKind: 'fragment',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/button',
        },
        {
          domainKind: 'fragment',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/card',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('accepts a Category containing only Category Nodes', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          id: 2,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 1,
          path: 'src/_types/user.type.ts',
        },
        {
          id: 3,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 1,
          path: 'src/_types/account.type.ts',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('reports a Category mixing Sub-Categories and Fragments', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_components',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/_nested',
        },
        {
          domainKind: 'fragment',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/item',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_components');
    });

    it('reports a Category mixing Sub-Categories and Category Nodes', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_types/_nested',
        },
        {
          id: 3,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 1,
          path: 'src/_types/item.type.ts',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_types');
    });

    it('reports a Category mixing Fragments and Category Nodes', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_utils',
        },
        {
          domainKind: 'fragment',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_utils/helper',
        },
        {
          id: 3,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 1,
          path: 'src/_utils/widget.util.ts',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_utils');
    });

    it('reports a Category mixing Sub-Categories, Fragments, and Category Nodes', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_utils',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_utils/_nested',
        },
        {
          domainKind: 'fragment',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_utils/helper',
        },
        {
          id: 4,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 1,
          path: 'src/_utils/widget.util.ts',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_utils');
    });

    it('allows an accessory Branch, Foreign Domain, and Foreign Node in a Category', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_components',
        },
        {
          domainKind: 'fragment',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/button',
        },
        {
          domainKind: 'fractal-branch',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/_components@shared',
        },
        {
          domainKind: 'foreign-domain',
          id: 4,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/_foreign',
        },
        {
          id: 5,
          kind: 'file',
          nodeKind: 'foreign-node',
          parentId: 1,
          path: 'src/_components/README.md',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('enforces exclusive forms in a Private Category', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_components',
        },
        {
          domainKind: 'fragment',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/button',
        },
        {
          domainKind: 'category',
          id: 3,
          kind: 'directory',
          parentId: 2,
          path: 'src/_components/button/_utils',
        },
        {
          domainKind: 'sub-category',
          id: 4,
          kind: 'directory',
          parentId: 3,
          path: 'src/_components/button/_utils/_nested',
        },
        {
          domainKind: 'fragment',
          id: 5,
          kind: 'directory',
          parentId: 3,
          path: 'src/_components/button/_utils/item',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_components/button/_utils');
    });
  });

  describe('Sub-Category forms', () => {
    it('accepts a Sub-Category containing only Sub-Categories', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_types/_dtos',
        },
        {
          domainKind: 'sub-category',
          id: 3,
          kind: 'directory',
          parentId: 2,
          path: 'src/_types/_dtos/_requests',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('accepts a Sub-Category containing only Fragments', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_components',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/_atoms',
        },
        {
          domainKind: 'fragment',
          id: 3,
          kind: 'directory',
          parentId: 2,
          path: 'src/_components/_atoms/badge',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('accepts a Sub-Category containing only Category Nodes', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_types/_primitives',
        },
        {
          id: 3,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 2,
          path: 'src/_types/_primitives/item.type.ts',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('reports a Sub-Category mixing Sub-Categories and Fragments', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_components',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_components/_atoms',
        },
        {
          domainKind: 'sub-category',
          id: 3,
          kind: 'directory',
          parentId: 2,
          path: 'src/_components/_atoms/_nested',
        },
        {
          domainKind: 'fragment',
          id: 4,
          kind: 'directory',
          parentId: 2,
          path: 'src/_components/_atoms/item',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_components/_atoms');
    });

    it('reports a Sub-Category mixing Sub-Categories and Category Nodes', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_types/_primitives',
        },
        {
          domainKind: 'sub-category',
          id: 3,
          kind: 'directory',
          parentId: 2,
          path: 'src/_types/_primitives/_nested',
        },
        {
          id: 4,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 2,
          path: 'src/_types/_primitives/item.type.ts',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_types/_primitives');
    });

    it('reports a Sub-Category mixing Fragments and Category Nodes', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_utils',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_utils/_primitives',
        },
        {
          domainKind: 'fragment',
          id: 3,
          kind: 'directory',
          parentId: 2,
          path: 'src/_utils/_primitives/helper',
        },
        {
          id: 4,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 2,
          path: 'src/_utils/_primitives/item.util.ts',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_utils/_primitives');
    });

    it('allows an accessory Branch, Foreign Domain, and Foreign Node in a Sub-Category', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'sub-category',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_types/_primitives',
        },
        {
          id: 3,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 2,
          path: 'src/_types/_primitives/item.type.ts',
        },
        {
          domainKind: 'fractal-branch',
          id: 4,
          kind: 'directory',
          parentId: 2,
          path: 'src/_types/_primitives/_primitives@shared',
        },
        {
          domainKind: 'foreign-domain',
          id: 5,
          kind: 'directory',
          parentId: 2,
          path: 'src/_types/_primitives/_foreign',
        },
        {
          id: 6,
          kind: 'file',
          nodeKind: 'foreign-node',
          parentId: 2,
          path: 'src/_types/_primitives/README.md',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });
  });

  describe('Mimetic Path Structures', () => {
    it('admits Path Fragments and Path Sub-Categories together in a Mimetic Parent Category', () => {
      const model = buildModel(
        [
          {
            domainKind: 'root-layer',
            id: 0,
            kind: 'directory',
            parentId: null,
            path: 'src',
          },
          {
            domainKind: 'category',
            id: 1,
            kind: 'directory',
            parentId: 0,
            path: 'src/_apis',
          },
          {
            domainKind: 'fragment',
            id: 2,
            kind: 'directory',
            parentId: 1,
            path: 'src/_apis/root',
          },
          {
            domainKind: 'path-sub-category',
            id: 3,
            kind: 'directory',
            parentId: 1,
            path: 'src/_apis/_todos',
          },
        ],
        ['src/_apis']
      );
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('admits Path Fragments and Path Sub-Categories together in a Path Sub-Category', () => {
      const model = buildModel(
        [
          {
            domainKind: 'root-layer',
            id: 0,
            kind: 'directory',
            parentId: null,
            path: 'src',
          },
          {
            domainKind: 'category',
            id: 1,
            kind: 'directory',
            parentId: 0,
            path: 'src/_apis',
          },
          {
            domainKind: 'path-sub-category',
            id: 2,
            kind: 'directory',
            parentId: 1,
            path: 'src/_apis/_todos',
          },
          {
            domainKind: 'fragment',
            id: 3,
            kind: 'directory',
            parentId: 2,
            path: 'src/_apis/_todos/list',
          },
          {
            domainKind: 'path-sub-category',
            id: 4,
            kind: 'directory',
            parentId: 2,
            path: 'src/_apis/_todos/_[todo-id]',
          },
        ],
        ['src/_apis']
      );
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('violates exclusive forms when a Category has Sub-Category and Fragment without mimetic designation', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_apis',
        },
        {
          domainKind: 'fragment',
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_apis/root',
        },
        {
          domainKind: 'sub-category',
          id: 3,
          kind: 'directory',
          parentId: 1,
          path: 'src/_apis/_todos',
        },
      ]);
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src/_apis');
    });
  });

  describe('Horizontal Hierarchy interaction', () => {
    it('does not heal a mixing with a declared Horizontal Hierarchy', () => {
      const base = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'layer',
          id: 2,
          kind: 'directory',
          parentId: 0,
          path: 'src/_ui',
        },
      ]);
      const model: TVerificationModel = {
        ...base,
        hierarchies: {
          conflicts: [],
          sets: [
            {
              id: 0,
              isOrderable: true,
              origin: 'general',
              parentPath: 'src',
              repetitions: [],
              siblings: [
                { itemId: 1, rank: 0 },
                { itemId: 2, rank: 1 },
              ],
            },
          ],
        },
      };
      const outcomes = verifyExclusiveForms(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.constraint).toBe('classification/exclusive-forms');
      expect(outcomes[0]?.element).toBe('src');
    });
  });

  describe('unclassified items and non-containers', () => {
    it('ignores unclassified directories and unclassified files', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: null,
          id: 2,
          kind: 'directory',
          parentId: 1,
          path: 'src/_types/unclassified-dir',
        },
        {
          id: 3,
          kind: 'file',
          nodeKind: null,
          parentId: 1,
          path: 'src/_types/unclassified-file.ts',
        },
        {
          id: 4,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 1,
          path: 'src/_types/item.type.ts',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('ignores Root Fragment and Fragment internal structures', () => {
      const model = buildModel([
        {
          domainKind: 'root-fragment',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          id: 1,
          kind: 'file',
          nodeKind: 'root-node',
          parentId: 0,
          path: 'src/main.ts',
        },
        {
          domainKind: 'fragment',
          id: 2,
          kind: 'directory',
          parentId: 0,
          path: 'src/app',
        },
        {
          id: 3,
          kind: 'file',
          nodeKind: 'master-node',
          parentId: 2,
          path: 'src/app/app.ts',
        },
        {
          id: 4,
          kind: 'file',
          nodeKind: 'access-node',
          parentId: 2,
          path: 'src/app/index.ts',
        },
      ]);
      expect(verifyExclusiveForms(model)).toEqual([]);
    });

    it('ignores items with missing taxonomy classifications', () => {
      const base = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          id: 2,
          kind: 'file',
          nodeKind: 'category-node',
          parentId: 1,
          path: 'src/_types/item.type.ts',
        },
      ]);
      const incompleteTaxonomy: TTaxonomyModel = {
        byItemId: new Map(),
        byPath: new Map(),
        classifications: [],
      };
      const model = { ...base, taxonomy: incompleteTaxonomy };
      expect(verifyExclusiveForms(model)).toEqual([]);
    });
  });

  describe('determinism under permutation', () => {
    it('produces identical outcomes regardless of inventory item order', () => {
      const specs: readonly TItemSpec[] = [
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'layer',
          id: 2,
          kind: 'directory',
          parentId: 0,
          path: 'src/_ui',
        },
        {
          domainKind: 'category',
          id: 3,
          kind: 'directory',
          parentId: 2,
          path: 'src/_ui/_components',
        },
        {
          domainKind: 'sub-category',
          id: 4,
          kind: 'directory',
          parentId: 3,
          path: 'src/_ui/_components/_nested',
        },
        {
          domainKind: 'fragment',
          id: 5,
          kind: 'directory',
          parentId: 3,
          path: 'src/_ui/_components/button',
        },
      ];
      const forward = buildModel(specs);
      const reversedSpecs: TItemSpec[] = [];
      for (let index = specs.length - 1; index >= 0; index -= 1) {
        const entry = specs[index];
        if (entry !== undefined) {
          reversedSpecs.push(entry);
        }
      }
      const reversed = buildModel(reversedSpecs);

      const forwardOutcomes = verifyExclusiveForms(forward);
      const reversedOutcomes = verifyExclusiveForms(reversed);

      expect(forwardOutcomes).toHaveLength(2);
      expect(forwardOutcomes.map((item) => item.element)).toEqual([
        'src',
        'src/_ui/_components',
      ]);
      expect(reversedOutcomes).toEqual(forwardOutcomes);
    });
  });

  describe('absence of mutation', () => {
    it('does not mutate the verification model', () => {
      const model = buildModel([
        {
          domainKind: 'root-layer',
          id: 0,
          kind: 'directory',
          parentId: null,
          path: 'src',
        },
        {
          domainKind: 'category',
          id: 1,
          kind: 'directory',
          parentId: 0,
          path: 'src/_types',
        },
        {
          domainKind: 'layer',
          id: 2,
          kind: 'directory',
          parentId: 0,
          path: 'src/_ui',
        },
      ]);
      const snapshot = JSON.stringify(model);
      verifyExclusiveForms(model);
      expect(JSON.stringify(model)).toBe(snapshot);
    });
  });
});
