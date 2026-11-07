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

import { hasStratifiedConflict } from './has-stratified-conflict.util.js';

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

describe('hasStratifiedConflict', () => {
  it('returns false when there are no children', () => {
    const taxonomy = createTaxonomy([]);
    expect(hasStratifiedConflict([], taxonomy)).toBe(false);
  });

  it('returns false when containing only categories', () => {
    const specs: readonly TSpec[] = [
      { domainKind: 'category', id: 1, kind: 'directory', path: 'src/_types' },
      { domainKind: 'category', id: 2, kind: 'directory', path: 'src/_utils' },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasStratifiedConflict(children, taxonomy)).toBe(false);
  });

  it('returns false when containing only layers', () => {
    const specs: readonly TSpec[] = [
      { domainKind: 'layer', id: 1, kind: 'directory', path: 'src/_domain' },
      { domainKind: 'layer', id: 2, kind: 'directory', path: 'src/_ui' },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasStratifiedConflict(children, taxonomy)).toBe(false);
  });

  it('returns true when containing both categories and layers', () => {
    const specs: readonly TSpec[] = [
      { domainKind: 'category', id: 1, kind: 'directory', path: 'src/_types' },
      { domainKind: 'layer', id: 2, kind: 'directory', path: 'src/_ui' },
    ];
    const children = specs.map((spec) => createItem(spec));
    const taxonomy = createTaxonomy(specs);
    expect(hasStratifiedConflict(children, taxonomy)).toBe(true);
  });

  it('ignores foreign nodes, foreign domains, fractal branches, unclassified and missing entries', () => {
    const specs: readonly TSpec[] = [
      { domainKind: 'category', id: 1, kind: 'directory', path: 'src/_types' },
      {
        domainKind: 'fractal-branch',
        id: 2,
        kind: 'directory',
        path: 'src/_src@shared',
      },
      {
        domainKind: 'foreign-domain',
        id: 3,
        kind: 'directory',
        path: 'src/_foreign',
      },
      { id: 4, kind: 'file', nodeKind: 'foreign-node', path: 'src/README.md' },
      { domainKind: null, id: 5, kind: 'directory', path: 'src/unknown-dir' },
      { id: 6, kind: 'file', nodeKind: null, path: 'src/unknown.ts' },
      {
        domainKind: 'category',
        id: 7,
        kind: 'directory',
        path: 'src/missing-meta',
      },
    ];
    const children = specs.map((spec) => createItem(spec));
    const knownSpecs = specs.filter((spec) => spec.id !== 7);
    const taxonomy = createTaxonomy(knownSpecs);
    expect(hasStratifiedConflict(children, taxonomy)).toBe(false);
  });
});
