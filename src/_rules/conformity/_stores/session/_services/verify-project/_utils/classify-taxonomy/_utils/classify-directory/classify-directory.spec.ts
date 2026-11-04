import { describe, expect, it } from 'vitest';

import type {
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { classifyDirectory } from './classify-directory.util.js';

const context: TTreeClassificationContext = {
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
};

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

describe('classifyDirectory', () => {
  it('keeps an unclassifiable directory inside the enclosing fragment path', () => {
    expect(
      classifyDirectory(
        'src/button/blog',
        parentOf('fragment', 'src/button', null),
        context
      )
    ).toEqual({
      domainKind: null,
      form: null,
      imposedRoleName: null,
      isMimeticContext: false,
      isPathFragment: false,
      isPrivateCategory: false,
      isSubFragment: false,
      isSubLayer: false,
      parentFragmentPath: 'src/button',
    });
  });

  it('keeps an unclassifiable directory inside the parent fragment path when the parent is not a fragment', () => {
    expect(
      classifyDirectory(
        'src/button/blog',
        parentOf('category', 'src/button/_components', 'src/button'),
        context
      ).parentFragmentPath
    ).toBe('src/button');
  });
});
