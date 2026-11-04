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
});
