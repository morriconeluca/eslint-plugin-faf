import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEntryKind,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { hasTaxonomicConflict } from './index.js';

type TSpec = {
  readonly domainKind?: null | TLogicalDomainKind;
  readonly id: number;
  readonly kind: TEntryKind;
  readonly nodeKind?: null | TNodeKind;
  readonly path: string;
};

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const role = { kind: 'absent' as const, roleName: null };

const createItem = (spec: TSpec): TInventoryItem => ({
  depth: 1,
  id: spec.id,
  isSymlink: false,
  kind: spec.kind,
  parentId: 0,
  path: spec.path,
  preorderEnd: spec.id,
  preorderStart: spec.id,
  realPath: spec.path,
  treeOrigin: 'src',
});

const createClassification = (spec: TSpec): TItemClassification => ({
  domainKind: spec.domainKind ?? null,
  entryKind: spec.kind,
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: spec.id,
  nodeKind: spec.nodeKind ?? null,
  path: spec.path,
  relationalQualifications: qualifications,
  role,
});

const createTaxonomy = (specs: readonly TSpec[]): TTaxonomyModel => {
  const classifications = specs.map((spec) => createClassification(spec));
  return {
    byItemId: new Map(classifications.map((item) => [item.itemId, item])),
    byPath: new Map(classifications.map((item) => [item.path, item])),
    classifications,
  };
};

describe('hasTaxonomicConflict', () => {
  it('returns false when there are no children', () => {
    const taxonomy = createTaxonomy([]);
    expect(hasTaxonomicConflict([], taxonomy)).toBe(false);
  });

  it('returns false when containing only sub-categories', () => {
    const specs: readonly TSpec[] = [
      {
        domainKind: 'sub-category',
        id: 1,
        kind: 'directory',
        path: 'src/_types/_dtos',
      },
      {
        domainKind: 'sub-category',
        id: 2,
        kind: 'directory',
        path: 'src/_types/_primitives',
      },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasTaxonomicConflict(children, taxonomy)).toBe(false);
  });

  it('returns false when containing only fragments', () => {
    const specs: readonly TSpec[] = [
      {
        domainKind: 'fragment',
        id: 1,
        kind: 'directory',
        path: 'src/_components/_atoms/button',
      },
      {
        domainKind: 'fragment',
        id: 2,
        kind: 'directory',
        path: 'src/_components/_atoms/badge',
      },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasTaxonomicConflict(children, taxonomy)).toBe(false);
  });

  it('returns false when containing only category nodes', () => {
    const specs: readonly TSpec[] = [
      {
        id: 1,
        kind: 'file',
        nodeKind: 'category-node',
        path: 'src/_types/user.type.ts',
      },
      {
        id: 2,
        kind: 'file',
        nodeKind: 'category-node',
        path: 'src/_types/item.type.ts',
      },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasTaxonomicConflict(children, taxonomy)).toBe(false);
  });

  it('returns true when mixing sub-categories and fragments', () => {
    const specs: readonly TSpec[] = [
      {
        domainKind: 'sub-category',
        id: 1,
        kind: 'directory',
        path: 'src/_components/_atoms',
      },
      {
        domainKind: 'fragment',
        id: 2,
        kind: 'directory',
        path: 'src/_components/button',
      },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasTaxonomicConflict(children, taxonomy)).toBe(true);
  });

  it('returns true when mixing path sub-categories and fragments', () => {
    const specs: readonly TSpec[] = [
      {
        domainKind: 'path-sub-category',
        id: 1,
        kind: 'directory',
        path: 'src/_apis/_todos',
      },
      {
        domainKind: 'fragment',
        id: 2,
        kind: 'directory',
        path: 'src/_apis/root',
      },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasTaxonomicConflict(children, taxonomy)).toBe(true);
  });

  it('returns true when mixing sub-categories and category nodes', () => {
    const specs: readonly TSpec[] = [
      {
        domainKind: 'sub-category',
        id: 1,
        kind: 'directory',
        path: 'src/_types/_primitives',
      },
      {
        id: 2,
        kind: 'file',
        nodeKind: 'category-node',
        path: 'src/_types/item.type.ts',
      },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasTaxonomicConflict(children, taxonomy)).toBe(true);
  });

  it('returns true when mixing fragments and category nodes', () => {
    const specs: readonly TSpec[] = [
      {
        domainKind: 'fragment',
        id: 1,
        kind: 'directory',
        path: 'src/_utils/helper',
      },
      {
        id: 2,
        kind: 'file',
        nodeKind: 'category-node',
        path: 'src/_utils/item.util.ts',
      },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasTaxonomicConflict(children, taxonomy)).toBe(true);
  });

  it('returns true when mixing all three forms', () => {
    const specs: readonly TSpec[] = [
      {
        domainKind: 'sub-category',
        id: 1,
        kind: 'directory',
        path: 'src/_utils/_nested',
      },
      {
        domainKind: 'fragment',
        id: 2,
        kind: 'directory',
        path: 'src/_utils/helper',
      },
      {
        id: 3,
        kind: 'file',
        nodeKind: 'category-node',
        path: 'src/_utils/item.util.ts',
      },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasTaxonomicConflict(children, taxonomy)).toBe(true);
  });

  it('ignores foreign domains, foreign nodes, fractal branches, unclassified and missing entries', () => {
    const specs: readonly TSpec[] = [
      {
        domainKind: 'fragment',
        id: 1,
        kind: 'directory',
        path: 'src/_components/button',
      },
      {
        domainKind: 'fractal-branch',
        id: 2,
        kind: 'directory',
        path: 'src/_components/_components@shared',
      },
      {
        domainKind: 'foreign-domain',
        id: 3,
        kind: 'directory',
        path: 'src/_components/_foreign',
      },
      {
        id: 4,
        kind: 'file',
        nodeKind: 'foreign-node',
        path: 'src/_components/README.md',
      },
      {
        domainKind: null,
        id: 5,
        kind: 'directory',
        path: 'src/_components/unknown-dir',
      },
      {
        id: 6,
        kind: 'file',
        nodeKind: null,
        path: 'src/_components/unknown.ts',
      },
      {
        domainKind: 'fragment',
        id: 7,
        kind: 'directory',
        path: 'src/_components/missing-meta',
      },
    ];
    const children = specs.map((spec) => createItem(spec));
    const knownSpecs = specs.filter((spec) => spec.id !== 7);
    const taxonomy = createTaxonomy(knownSpecs);
    expect(hasTaxonomicConflict(children, taxonomy)).toBe(false);
  });
});
