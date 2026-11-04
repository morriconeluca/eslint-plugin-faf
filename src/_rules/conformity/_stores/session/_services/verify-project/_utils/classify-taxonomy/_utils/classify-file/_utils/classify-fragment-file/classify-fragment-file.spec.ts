import { describe, expect, it } from 'vitest';

import type { TRoleAttribution } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveCatalog } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TDirectoryParent,
  TTreeClassificationContext,
} from '../../../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { classifyFragmentFile } from './classify-fragment-file.util.js';

const catalog: TEffectiveCatalog = {
  categoryToRole: new Map(),
  extensionToRole: new Map(),
  roles: [
    {
      allowMultipleSymbols: false,
      category: '_hooks',
      form: 'fragments',
      implicitExtensions: [],
      name: 'hook',
      rank: 1,
    },
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
  topRank: 7,
};

const roleOf = (fileName: string): TRoleAttribution => {
  if (fileName.endsWith('.spec.tsx')) {
    return { kind: 'explicit', roleName: 'spec' };
  }
  if (fileName.endsWith('.component.tsx')) {
    return { kind: 'explicit', roleName: 'component' };
  }
  if (fileName.endsWith('.css')) {
    return { kind: 'implicit', roleName: 'style' };
  }
  return { kind: 'absent', roleName: null };
};

const context: TTreeClassificationContext = {
  catalog,
  foreignDomainPaths: new Set<string>(),
  foreignNodePaths: new Set<string>(),
  getRoleFromName: roleOf,
  mimeticPaths: new Set<string>(),
  originKind: 'root-layer',
  originPath: 'src',
  rootFragmentPaths: new Set<string>(),
  rootNodePaths: new Set<string>(),
};

const parent: TDirectoryParent = {
  domainKind: 'fragment',
  form: 'fragments',
  imposedRoleName: 'component',
  isMimeticContext: false,
  parentFragmentPath: null,
  path: 'src/_components/button',
};

describe('classifyFragmentFile', () => {
  it('classifies index.ts with an absent role as the access node at top rank', () => {
    const result = classifyFragmentFile(
      'index.ts',
      parent,
      context,
      'src/_components/button'
    );
    expect(result.fields.nodeKind).toBe('access-node');
    expect(result.fields.fragmentInternalRank).toBe(7);
    expect(result.fields.role).toEqual({ kind: 'absent', roleName: null });
  });

  it('does not treat index.ts with an explicit role as an access node', () => {
    const explicitIndex: TTreeClassificationContext = {
      ...context,
      getRoleFromName: () => ({ kind: 'explicit', roleName: 'component' }),
    };
    expect(
      classifyFragmentFile(
        'index.ts',
        parent,
        explicitIndex,
        'src/_components/button'
      ).fields.nodeKind
    ).toBe('unauthorized-logical-node');
  });

  it('classifies a name-matching explicit file at the catalog rank and a sub-graph file at top rank', () => {
    const fragment = classifyFragmentFile(
      'button.component.tsx',
      parent,
      context,
      'src/_components/button'
    );
    const subGraph = classifyFragmentFile(
      'button.spec.tsx',
      parent,
      context,
      'src/_components/button'
    );
    expect(fragment.fields.nodeKind).toBe('fragment-node');
    expect(fragment.fields.fragmentInternalRank).toBe(4);
    expect(fragment.fields.role).toEqual({
      kind: 'explicit',
      roleName: 'component',
    });
    expect(subGraph.fields.nodeKind).toBe('sub-graph-node');
    expect(subGraph.fields.fragmentInternalRank).toBe(7);
  });

  it('rejects a name mismatch, an implicit role, and a non-matching stem', () => {
    expect(
      classifyFragmentFile(
        'other.component.tsx',
        parent,
        context,
        'src/_components/button'
      ).fields.nodeKind
    ).toBe('unauthorized-logical-node');
    expect(
      classifyFragmentFile(
        'other.spec.tsx',
        parent,
        context,
        'src/_components/button'
      ).fields.nodeKind
    ).toBe('unauthorized-logical-node');
    expect(
      classifyFragmentFile(
        'button.css',
        parent,
        context,
        'src/_components/button'
      ).fields.nodeKind
    ).toBe('unauthorized-logical-node');
  });
});
