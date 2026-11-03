import { describe, expect, it } from 'vitest';

import type {
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { resolveDeclaredDirectory } from './resolve-declared-directory.util.js';

const contextOf = (
  overrides: Partial<TTreeClassificationContext> = {}
): TTreeClassificationContext => ({
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 1,
  },
  foreignDomainPaths: new Set<string>(),
  foreignNodePaths: new Set<string>(),
  getRoleFromName: () => ({ kind: 'absent', roleName: null }),
  mimeticPaths: new Set<string>(),
  originKind: 'root-fragment',
  originPath: 'src',
  rootFragmentPaths: new Set<string>(),
  rootNodePaths: new Set<string>(),
  ...overrides,
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

describe('resolveDeclaredDirectory', () => {
  it('encloses a declared foreign domain in the parent fragment path', () => {
    const insideFragment = resolveDeclaredDirectory(
      'src/button/_vendor',
      parentOf('fragment', 'src/button', null),
      contextOf({ foreignDomainPaths: new Set(['src/button/_vendor']) })
    );
    const insideCategory = resolveDeclaredDirectory(
      'src/button/_components/_vendor',
      parentOf('category', 'src/button/_components', 'src/button'),
      contextOf({
        foreignDomainPaths: new Set(['src/button/_components/_vendor']),
      })
    );
    expect(insideFragment?.domainKind).toBe('foreign-domain');
    expect(insideFragment?.parentFragmentPath).toBe('src/button');
    expect(insideCategory?.parentFragmentPath).toBe('src/button');
  });

  it('propagates a foreign domain from the parent even when the child path is not declared', () => {
    const result = resolveDeclaredDirectory(
      'src/_vendor/nested',
      parentOf('foreign-domain', 'src/_vendor', 'src'),
      contextOf()
    );
    expect(result?.domainKind).toBe('foreign-domain');
    expect(result?.parentFragmentPath).toBe('src');
  });

  it('recognizes only the reserved fractal branch of the parent scope', () => {
    const branch = resolveDeclaredDirectory(
      'src/button/_button@shared',
      parentOf('fragment', 'src/button', null),
      contextOf()
    );
    const mismatch = resolveDeclaredDirectory(
      'src/button/_other@shared',
      parentOf('fragment', 'src/button', null),
      contextOf()
    );
    expect(branch?.domainKind).toBe('fractal-branch');
    expect(branch?.parentFragmentPath).toBe('src/button');
    expect(mismatch?.domainKind).toBeNull();
    expect(mismatch?.parentFragmentPath).toBe('src/button');
  });

  it('returns null when no declaration applies', () => {
    expect(
      resolveDeclaredDirectory(
        'src/blog',
        parentOf('root-fragment', 'src', null),
        contextOf()
      )
    ).toBeNull();
  });
});
