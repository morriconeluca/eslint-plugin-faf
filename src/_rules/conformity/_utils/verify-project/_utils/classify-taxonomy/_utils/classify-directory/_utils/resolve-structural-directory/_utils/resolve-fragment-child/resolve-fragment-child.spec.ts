import { describe, expect, it } from 'vitest';

import type { TDirectoryParent } from '../../../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { resolveFragmentChild } from './resolve-fragment-child.util.js';

const parentOf = (overrides: Partial<TDirectoryParent>): TDirectoryParent => ({
  domainKind: 'category',
  form: 'fragments',
  imposedRoleName: 'component',
  isMimeticContext: false,
  parentFragmentPath: null,
  path: 'src/_components',
  ...overrides,
});

describe('resolveFragmentChild', () => {
  it('returns null for a reserved name or a parent that does not admit fragments', () => {
    expect(
      resolveFragmentChild('src/_components/_private', parentOf({}))
    ).toBeNull();
    expect(
      resolveFragmentChild(
        'src/_types/ids',
        parentOf({ form: 'category-nodes', path: 'src/_types' })
      )
    ).toBeNull();
  });

  it('marks a path fragment under a path sub-category or a mimetic parent, and only then', () => {
    const underPath = resolveFragmentChild(
      'src/_pages/blog',
      parentOf({
        domainKind: 'path-sub-category',
        isMimeticContext: false,
        parentFragmentPath: 'src/app',
        path: 'src/_pages/_blog',
      })
    );
    const underMimetic = resolveFragmentChild(
      'src/_pages/home',
      parentOf({
        domainKind: 'category',
        isMimeticContext: true,
        path: 'src/_pages',
      })
    );
    const ordinary = resolveFragmentChild(
      'src/_components/button',
      parentOf({ isMimeticContext: false, parentFragmentPath: null })
    );
    expect(underPath?.isPathFragment).toBe(true);
    expect(underPath?.isSubFragment).toBe(true);
    expect(underPath?.parentFragmentPath).toBe('src/app');
    expect(underMimetic?.isPathFragment).toBe(true);
    expect(underMimetic?.isSubFragment).toBe(false);
    expect(ordinary?.isPathFragment).toBe(false);
    expect(ordinary?.isSubFragment).toBe(false);
    expect(ordinary?.imposedRoleName).toBe('component');
    expect(ordinary?.domainKind).toBe('fragment');
  });
});
