import { describe, expect, it } from 'vitest';

import type { TEffectiveRole } from '../../../../../../../../../_declarations/_types/declarations.type.js';
import type {
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { resolveCatalogCategory } from './resolve-catalog-category.util.js';

const role = (name: string, form: TEffectiveRole['form']): TEffectiveRole => ({
  allowMultipleSymbols: false,
  category: `_${name}s`,
  form,
  implicitExtensions: [],
  name,
  rank: 1,
});

const contextOf = (
  category: TEffectiveRole,
  mimeticPaths: readonly string[] = []
): TTreeClassificationContext => ({
  catalog: {
    categoryToRole: new Map([[category.category, category]]),
    extensionToRole: new Map(),
    roles: [category],
    subGraphRoles: [],
    topRank: 1,
  },
  foreignDomainPaths: new Set<string>(),
  foreignNodePaths: new Set<string>(),
  getRoleFromName: () => ({ kind: 'absent', roleName: null }),
  mimeticPaths: new Set(mimeticPaths),
  originKind: 'root-fragment',
  originPath: 'src',
  rootFragmentPaths: new Set<string>(),
  rootNodePaths: new Set<string>(),
});

const parentOf = (
  domainKind: TDirectoryParent['domainKind'],
  path: string,
  parentFragmentPath: null | string
): TDirectoryParent => ({
  domainKind,
  form: null,
  imposedRoleName: null,
  isMimeticContext: false,
  parentFragmentPath,
  path,
});

describe('resolveCatalogCategory', () => {
  it('returns null when the name is not a catalog category', () => {
    const parent = parentOf('root-fragment', 'src', null);
    const context = contextOf(role('component', 'fragments'));
    expect(resolveCatalogCategory('src/blog', parent, context)).toBeNull();
  });

  it('marks a category under a fragment or root fragment as private and encloses it in that fragment', () => {
    const fragments = role('component', 'fragments');
    const underFragment = resolveCatalogCategory(
      'src/button/_components',
      parentOf('fragment', 'src/button', null),
      contextOf(fragments)
    );
    const underRoot = resolveCatalogCategory(
      'src/_components',
      parentOf('root-fragment', 'src', null),
      contextOf(fragments)
    );
    const underCategory = resolveCatalogCategory(
      'src/button/_components/_components',
      parentOf('category', 'src/button/_components', 'src/button'),
      contextOf(fragments)
    );
    expect(underFragment?.isPrivateCategory).toBe(true);
    expect(underFragment?.parentFragmentPath).toBe('src/button');
    expect(underRoot?.isPrivateCategory).toBe(true);
    expect(underRoot?.parentFragmentPath).toBeNull();
    expect(underCategory?.isPrivateCategory).toBe(false);
    expect(underCategory?.parentFragmentPath).toBe('src/button');
  });

  it('opens a mimetic context only for a fragments category listed as a mimetic path', () => {
    const fragments = role('page', 'fragments');
    const nodes = role('type', 'category-nodes');
    const mimetic = resolveCatalogCategory(
      'src/_pages',
      parentOf('root-layer', 'src', null),
      contextOf(fragments, ['src/_pages'])
    );
    const asset = resolveCatalogCategory(
      'src/_types',
      parentOf('root-layer', 'src', null),
      contextOf(nodes, ['src/_types'])
    );
    expect(mimetic?.isMimeticContext).toBe(true);
    expect(mimetic?.imposedRoleName).toBe('page');
    expect(asset?.isMimeticContext).toBe(false);
  });
});
