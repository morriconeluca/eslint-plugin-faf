import { describe, expect, it } from 'vitest';

import type { TInventory } from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { rejectTreeDependencies } from './reject-tree-dependencies.util.js';

const inventory: TInventory = {
  items: [
    {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'app',
      preorderEnd: 1,
      preorderStart: 0,
      realPath: '/project/app',
      treeOrigin: 'app',
    },
    {
      depth: 1,
      id: 1,
      isSymlink: false,
      kind: 'directory',
      parentId: 0,
      path: 'app/nested',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: '/project/app/nested',
      treeOrigin: 'app',
    },
    {
      depth: 0,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'lib',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: '/project/lib',
      treeOrigin: 'lib',
    },
  ],
  pathToId: new Map([
    ['app', 0],
    ['app/nested', 1],
    ['lib', 2],
  ]),
  realPathToId: new Map(),
};

const context: TReferenceContext = {
  aliasPrefixes: [],
  baseDirectory: '/project',
  enumeratedRootNodes: new Map(),
  inventory,
  ownedOrigins: new Map([
    ['app', { localIndex: 0, originKind: 'root-fragment' }],
    ['lib', { localIndex: 1, originKind: 'root-layer' }],
  ]),
};

describe('rejectTreeDependencies', () => {
  it('accepts valid directed dependencies between Fractal Tree origins', () => {
    expect(
      rejectTreeDependencies(
        [{ from: ['app'], to: ['lib'] }],
        'faf.locals[0].treeDependencies',
        { kind: 'local', localIndex: 0 },
        context
      )
    ).toEqual([]);
  });

  it('rejects self-dependencies, non-origin directories, and local out-of-scope sources', () => {
    const outcomes = rejectTreeDependencies(
      [{ from: ['lib', 'app/nested'], to: ['lib', 'app/nested'] }],
      'faf.locals[0].treeDependencies',
      { kind: 'local', localIndex: 0 },
      context
    );
    expect(outcomes.map((outcome) => outcome.constraint)).toEqual([
      'configuration/tree-dependency-from-outside-scope',
      'configuration/tree-dependency-not-tree-origin',
      'configuration/tree-dependency-not-tree-origin',
      'configuration/tree-dependency-self',
      'configuration/tree-dependency-self',
    ]);
  });
});
