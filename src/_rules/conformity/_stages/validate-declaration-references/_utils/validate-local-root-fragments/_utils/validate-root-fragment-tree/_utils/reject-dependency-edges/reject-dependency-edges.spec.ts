import { describe, expect, it } from 'vitest';

import type { TFAFRootFragment } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TReferenceContext } from '../../../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { rejectDependencyEdges } from './reject-dependency-edges.util.js';

describe('rejectDependencyEdges', () => {
  const context: TReferenceContext = {
    aliasPrefixes: [],
    baseDirectory: '/project',
    enumeratedRootNodes: new Map([
      ['other/entry.ts', { rootFragmentPath: 'other', treeOrigin: 'other' }],
      ['src/app/app.ts', { rootFragmentPath: 'src/app', treeOrigin: 'src' }],
      ['src/helper.ts', { rootFragmentPath: 'src', treeOrigin: 'src' }],
      ['src/main.ts', { rootFragmentPath: 'src', treeOrigin: 'src' }],
    ]),
    inventory: { items: [], pathToId: new Map(), realPathToId: new Map() },
    ownedOrigins: new Map(),
  };

  it('accepts edges from current rootNodes to enumerated root nodes in another fragment of the same tree', () => {
    const fragment: TFAFRootFragment = {
      dependencyEdges: [{ from: ['main.ts'], to: ['src/app/app.ts'] }],
      path: 'src',
      rootNodes: [['main.ts'], ['helper.ts']],
    };
    expect(
      rejectDependencyEdges(
        fragment,
        'src',
        'faf.locals[0].rootFragments[0]',
        context
      )
    ).toEqual([]);
  });

  it('returns empty when dependencyEdges is omitted', () => {
    const fragment: TFAFRootFragment = {
      path: 'src',
      rootNodes: [['main.ts']],
    };
    expect(
      rejectDependencyEdges(
        fragment,
        'src',
        'faf.locals[0].rootFragments[0]',
        context
      )
    ).toEqual([]);
  });

  it('rejects unenumerated sources, unenumerated targets, cross-tree targets, and same-fragment targets', () => {
    const fragment: TFAFRootFragment = {
      dependencyEdges: [
        {
          from: ['missing.ts'],
          to: ['src/missing.ts', 'other/entry.ts', 'src/helper.ts'],
        },
      ],
      path: 'src',
      rootNodes: [['main.ts', 'helper.ts']],
    };

    const outcomes = rejectDependencyEdges(
      fragment,
      'src',
      'faf.locals[0].rootFragments[0]',
      context
    );

    expect(
      outcomes.map((outcome) => ({
        constraint: outcome.constraint,
        element: outcome.element,
        propertyPath: outcome.propertyPath,
      }))
    ).toEqual([
      {
        constraint: 'configuration/invalid-root-dependency-from',
        element: 'missing.ts',
        propertyPath:
          'faf.locals[0].rootFragments[0].dependencyEdges[0].from[0]',
      },
      {
        constraint: 'configuration/invalid-root-dependency-to',
        element: 'src/missing.ts',
        propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to[0]',
      },
      {
        constraint: 'configuration/root-dependency-different-tree',
        element: 'other/entry.ts',
        propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to[1]',
      },
      {
        constraint: 'configuration/root-dependency-same-fragment',
        element: 'src/helper.ts',
        propertyPath: 'faf.locals[0].rootFragments[0].dependencyEdges[0].to[2]',
      },
    ]);
  });
});
