import { describe, expect, it } from 'vitest';

import type { TEffectiveRole } from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { resolveStructuralDirectory } from './resolve-structural-directory.util.js';

const role = (name: string, form: TEffectiveRole['form']): TEffectiveRole => ({
  allowMultipleSymbols: false,
  category: `_${name}s`,
  form,
  implicitExtensions: [],
  name,
  rank: 1,
});

const contextOf = (
  roles: readonly TEffectiveRole[],
  mimeticPaths: readonly string[] = []
): TTreeClassificationContext => ({
  catalog: {
    categoryToRole: new Map(roles.map((entry) => [entry.category, entry])),
    extensionToRole: new Map(),
    roles,
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

const parentOf = (overrides: Partial<TDirectoryParent>): TDirectoryParent => ({
  domainKind: 'root-layer',
  form: null,
  imposedRoleName: null,
  isMimeticContext: false,
  parentFragmentPath: null,
  path: 'src',
  ...overrides,
});

describe('resolveStructuralDirectory', () => {
  it('marks Private Categories, enclosed Fragment paths, and mimetic context on Category matching', () => {
    const context = contextOf(
      [
        role('component', 'fragments'),
        role('page', 'fragments'),
        role('type', 'category-nodes'),
      ],
      ['src/_pages', 'src/_types']
    );

    const underFragment = resolveStructuralDirectory(
      'src/button/_components',
      parentOf({ domainKind: 'fragment', path: 'src/button' }),
      context
    );
    expect(underFragment?.isPrivateCategory).toBe(true);
    expect(underFragment?.parentFragmentPath).toBe('src/button');

    const underRootFragment = resolveStructuralDirectory(
      'src/_components',
      parentOf({ domainKind: 'root-fragment', path: 'src' }),
      context
    );
    expect(underRootFragment?.isPrivateCategory).toBe(true);
    expect(underRootFragment?.parentFragmentPath).toBeNull();

    const underCategory = resolveStructuralDirectory(
      'src/button/_components/_components',
      parentOf({
        domainKind: 'category',
        parentFragmentPath: 'src/button',
        path: 'src/button/_components',
      }),
      context
    );
    expect(underCategory?.isPrivateCategory).toBe(false);
    expect(underCategory?.parentFragmentPath).toBe('src/button');

    const mimetic = resolveStructuralDirectory(
      'src/_pages',
      parentOf({}),
      context
    );
    expect(mimetic?.isMimeticContext).toBe(true);
    expect(mimetic?.imposedRoleName).toBe('page');

    const categoryNodesMimetic = resolveStructuralDirectory(
      'src/_types',
      parentOf({}),
      context
    );
    expect(categoryNodesMimetic?.isMimeticContext).toBe(false);
  });

  it('classifies Path Sub-Categories, Path Fragments, ordinary Fragments, Layers, and Sub-Categories', () => {
    const context = contextOf([role('component', 'fragments')]);

    const pathSub = resolveStructuralDirectory(
      'src/_pages/_users',
      parentOf({
        domainKind: 'category',
        form: 'fragments',
        imposedRoleName: 'page',
        isMimeticContext: true,
        path: 'src/_pages',
      }),
      context
    );
    expect(pathSub?.domainKind).toBe('path-sub-category');
    expect(pathSub?.isMimeticContext).toBe(true);

    const pathFragment = resolveStructuralDirectory(
      'src/_pages/_blog/post',
      parentOf({
        domainKind: 'path-sub-category',
        form: 'fragments',
        imposedRoleName: 'page',
        parentFragmentPath: 'src/app',
        path: 'src/_pages/_blog',
      }),
      context
    );
    expect(pathFragment?.domainKind).toBe('fragment');
    expect(pathFragment?.isPathFragment).toBe(true);
    expect(pathFragment?.isSubFragment).toBe(true);

    const ordinaryFragment = resolveStructuralDirectory(
      'src/_components/button',
      parentOf({
        domainKind: 'category',
        form: 'fragments',
        imposedRoleName: 'component',
        path: 'src/_components',
      }),
      context
    );
    expect(ordinaryFragment?.domainKind).toBe('fragment');
    expect(ordinaryFragment?.isPathFragment).toBe(false);
    expect(ordinaryFragment?.isSubFragment).toBe(false);

    const subLayer = resolveStructuralDirectory(
      'src/_domain/_core',
      parentOf({ domainKind: 'layer', path: 'src/_domain' }),
      context
    );
    expect(subLayer?.domainKind).toBe('layer');
    expect(subLayer?.isSubLayer).toBe(true);

    const subCategory = resolveStructuralDirectory(
      'src/_components/_atoms',
      parentOf({
        domainKind: 'category',
        form: 'fragments',
        imposedRoleName: 'component',
        path: 'src/_components',
      }),
      context
    );
    expect(subCategory?.domainKind).toBe('sub-category');

    expect(
      resolveStructuralDirectory(
        'src/_types/ids',
        parentOf({
          domainKind: 'category',
          form: 'category-nodes',
          path: 'src/_types',
        }),
        context
      )
    ).toBeNull();

    expect(
      resolveStructuralDirectory(
        'src/blog',
        parentOf({ domainKind: 'root-fragment', path: 'src' }),
        context
      )
    ).toBeNull();
  });
});
