import { describe, expect, it } from 'vitest';

import type { TTreeClassificationContext } from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { classifyFile } from './classify-file.util.js';

const context: TTreeClassificationContext = {
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [
      {
        allowMultipleSymbols: false,
        category: '_components',
        form: 'fragments',
        implicitExtensions: [],
        name: 'component',
        rank: 4,
      },
    ],
    subGraphRoles: ['spec'],
    topRank: 5,
  },
  foreignDomainPaths: new Set<string>(),
  foreignNodePaths: new Set(['src/readme.md']),
  getRoleFromName: () => ({ kind: 'explicit', roleName: 'component' }),
  mimeticPaths: new Set<string>(),
  originKind: 'root-fragment',
  originPath: 'src',
  rootFragmentPaths: new Set(['src']),
  rootNodePaths: new Set(['src/main.ts']),
};

describe('classifyFile', () => {
  it('returns a contradictory conflict before a foreign classification', () => {
    const result = classifyFile(
      'src/main.ts',
      {
        domainKind: 'root-fragment',
        form: null,
        imposedRoleName: null,
        isMimeticContext: false,
        parentFragmentPath: null,
        path: 'src',
      },
      { ...context, foreignNodePaths: new Set(['src/main.ts']) }
    );
    expect(result.conflict).toBe('contradictory-root-foreign');
    expect(result.fields.nodeKind).toBeNull();
  });

  it('returns an unenumerated root file when the parent is a root fragment', () => {
    const result = classifyFile(
      'src/extra.ts',
      {
        domainKind: 'root-fragment',
        form: null,
        imposedRoleName: null,
        isMimeticContext: false,
        parentFragmentPath: null,
        path: 'src',
      },
      context
    );
    expect(result.conflict).toBe('unenumerated-root-file');
    expect(result.fields.nodeKind).toBeNull();
  });

  it('returns null node kind under an unclassifiable parent', () => {
    const result = classifyFile(
      'src/notes/orphan.ts',
      {
        domainKind: null,
        form: null,
        imposedRoleName: null,
        isMimeticContext: false,
        parentFragmentPath: null,
        path: 'src/notes',
      },
      context
    );
    expect(result.conflict).toBeNull();
    expect(result.fields.nodeKind).toBeNull();
  });

  it('classifies designated Foreign Nodes, enumerated Root Nodes, and Category or Sub-Category files', () => {
    const foreignResult = classifyFile(
      'src/readme.md',
      {
        domainKind: 'root-fragment',
        form: null,
        imposedRoleName: null,
        isMimeticContext: false,
        parentFragmentPath: null,
        path: 'src',
      },
      context
    );
    expect(foreignResult.conflict).toBeNull();
    expect(foreignResult.fields.nodeKind).toBe('foreign-node');

    const rootResult = classifyFile(
      'src/main.ts',
      {
        domainKind: 'root-fragment',
        form: null,
        imposedRoleName: null,
        isMimeticContext: false,
        parentFragmentPath: null,
        path: 'src',
      },
      context
    );
    expect(rootResult.conflict).toBeNull();
    expect(rootResult.fields.nodeKind).toBe('root-node');

    const categoryContext: TTreeClassificationContext = {
      ...context,
      getRoleFromName: (fileName) =>
        fileName === 'ids.type.ts'
          ? { kind: 'explicit', roleName: 'type' }
          : { kind: 'absent', roleName: null },
    };
    expect(
      classifyFile(
        'src/_types/_models/ids.type.ts',
        {
          domainKind: 'sub-category',
          form: 'category-nodes',
          imposedRoleName: 'type',
          isMimeticContext: false,
          parentFragmentPath: null,
          path: 'src/_types/_models',
        },
        categoryContext
      ).fields.nodeKind
    ).toBe('category-node');

    expect(
      classifyFile(
        'src/_types/ids.type.ts',
        {
          domainKind: 'category',
          form: 'fragments',
          imposedRoleName: 'type',
          isMimeticContext: false,
          parentFragmentPath: null,
          path: 'src/_types',
        },
        categoryContext
      ).fields.nodeKind
    ).toBe('unauthorized-logical-node');

    expect(
      classifyFile(
        'src/_domain/ids.type.ts',
        {
          domainKind: 'layer',
          form: null,
          imposedRoleName: null,
          isMimeticContext: false,
          parentFragmentPath: null,
          path: 'src/_domain',
        },
        categoryContext
      ).fields.nodeKind
    ).toBe('unauthorized-logical-node');

    expect(
      classifyFile(
        'src/_types/readme',
        {
          domainKind: 'category',
          form: 'category-nodes',
          imposedRoleName: 'type',
          isMimeticContext: false,
          parentFragmentPath: null,
          path: 'src/_types',
        },
        categoryContext
      ).fields.nodeKind
    ).toBe('unauthorized-logical-node');
  });
});
