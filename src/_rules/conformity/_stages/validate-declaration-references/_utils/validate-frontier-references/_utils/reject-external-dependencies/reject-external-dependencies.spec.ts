import { describe, expect, it } from 'vitest';

import type { TInventory } from '../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { rejectExternalDependencies } from './reject-external-dependencies.util.js';

const inventory: TInventory = {
  items: [
    {
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'src/main.ts',
      preorderEnd: 0,
      preorderStart: 0,
      realPath: '/project/src/main.ts',
      treeOrigin: 'src',
    },
    {
      depth: 0,
      id: 1,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'legacy/client.ts',
      preorderEnd: 1,
      preorderStart: 1,
      realPath: '/project/legacy/client.ts',
      treeOrigin: null,
    },
    {
      depth: 0,
      id: 2,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'legacy',
      preorderEnd: 2,
      preorderStart: 2,
      realPath: '/project/legacy',
      treeOrigin: null,
    },
    {
      depth: 0,
      id: 3,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: '#sharedness/file.ts',
      preorderEnd: 3,
      preorderStart: 3,
      realPath: '/project/#sharedness/file.ts',
      treeOrigin: null,
    },
  ],
  pathToId: new Map([
    ['#sharedness/file.ts', 3],
    ['legacy', 2],
    ['legacy/client.ts', 1],
    ['src/main.ts', 0],
  ]),
  realPathToId: new Map(),
};

const context: TReferenceContext = {
  aliasPrefixes: ['#shared'],
  baseDirectory: '/project',
  enumeratedRootNodes: new Map(),
  inventory,
  ownedOrigins: new Map([
    ['src', { localIndex: 0, originKind: 'root-fragment' }],
  ]),
};

describe('rejectExternalDependencies', () => {
  it('accepts valid source-to-external-file pairs and segment-boundary non-alias paths', () => {
    expect(
      rejectExternalDependencies(
        [
          {
            from: ['src/main.ts'],
            to: ['legacy/client.ts', '#sharedness/file.ts'],
          },
        ],
        'faf.locals[0].externalDependencies',
        { kind: 'local', localIndex: 0 },
        context
      )
    ).toEqual([]);
  });

  it('rejects alias targets, node_modules library paths, missing paths, directories, and inside-tree targets', () => {
    const outcomes = rejectExternalDependencies(
      [
        {
          from: ['src/main.ts'],
          to: [
            '#shared',
            '#shared/file.ts',
            'node_modules/react/index.js',
            'src/node_modules/pkg/index.js',
            'legacy/missing.ts',
            'legacy',
            'src/main.ts',
          ],
        },
      ],
      'faf.locals[0].externalDependencies',
      { kind: 'local', localIndex: 0 },
      context
    );

    expect(outcomes.map((outcome) => outcome.constraint)).toEqual([
      'configuration/external-dependency-to-alias',
      'configuration/external-dependency-to-alias',
      'configuration/external-dependency-to-library',
      'configuration/external-dependency-to-library',
      'configuration/non-existent-path',
      'configuration/expected-file',
      'configuration/external-dependency-to-inside-tree',
    ]);
  });
});
