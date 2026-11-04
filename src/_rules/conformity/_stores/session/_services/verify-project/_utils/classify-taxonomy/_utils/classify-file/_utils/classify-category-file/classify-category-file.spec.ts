import { describe, expect, it } from 'vitest';

import type {
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { classifyCategoryFile } from './classify-category-file.util.js';

const context: TTreeClassificationContext = {
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 2,
  },
  foreignDomainPaths: new Set<string>(),
  foreignNodePaths: new Set<string>(),
  getRoleFromName: (fileName) =>
    fileName === 'ids.type.ts'
      ? { kind: 'explicit', roleName: 'type' }
      : { kind: 'absent', roleName: null },
  mimeticPaths: new Set<string>(),
  originKind: 'root-layer',
  originPath: 'src',
  rootFragmentPaths: new Set<string>(),
  rootNodePaths: new Set<string>(),
};

const parentOf = (overrides: Partial<TDirectoryParent>): TDirectoryParent => ({
  domainKind: 'category',
  form: 'category-nodes',
  imposedRoleName: 'type',
  isMimeticContext: false,
  parentFragmentPath: null,
  path: 'src/_types',
  ...overrides,
});

describe('classifyCategoryFile', () => {
  it('classifies a matching explicit file in a category-nodes category or sub-category', () => {
    expect(
      classifyCategoryFile(
        'src/_types/ids.type.ts',
        parentOf({}),
        context,
        null
      ).fields.nodeKind
    ).toBe('category-node');
    expect(
      classifyCategoryFile(
        'src/_types/_models/ids.type.ts',
        parentOf({
          domainKind: 'sub-category',
          path: 'src/_types/_models',
        }),
        context,
        null
      ).fields.nodeKind
    ).toBe('category-node');
  });

  it('rejects a file whose container form, domain, or role does not match', () => {
    expect(
      classifyCategoryFile(
        'src/_types/ids.type.ts',
        parentOf({ form: 'fragments' }),
        context,
        null
      ).fields.nodeKind
    ).toBe('unauthorized-logical-node');
    expect(
      classifyCategoryFile(
        'src/_domain/ids.type.ts',
        parentOf({ domainKind: 'layer', form: null, path: 'src/_domain' }),
        context,
        null
      ).fields.nodeKind
    ).toBe('unauthorized-logical-node');
    expect(
      classifyCategoryFile('src/_types/readme', parentOf({}), context, null)
        .fields.nodeKind
    ).toBe('unauthorized-logical-node');
    expect(
      classifyCategoryFile(
        'src/_types/ids.type.ts',
        parentOf({ domainKind: 'category', form: null }),
        context,
        null
      ).fields.nodeKind
    ).toBe('unauthorized-logical-node');
  });
});
