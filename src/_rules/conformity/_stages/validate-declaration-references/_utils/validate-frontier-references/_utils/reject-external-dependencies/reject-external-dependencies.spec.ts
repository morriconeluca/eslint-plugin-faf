import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { rejectExternalDependencies } from './reject-external-dependencies.util.js';

const itemOf = (
  id: number,
  path: string,
  kind: 'directory' | 'file',
  treeOrigin: null | string
): TInventoryItem => ({
  depth: 0,
  id,
  isSymlink: false,
  kind,
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: `/project/${path}`,
  treeOrigin,
});

const items: readonly TInventoryItem[] = [
  itemOf(0, 'packages/app/src', 'directory', 'packages/app/src'),
  itemOf(1, 'packages/app/src/main.ts', 'file', 'packages/app/src'),
  itemOf(2, 'packages/app/src/_utils', 'directory', 'packages/app/src'),
  itemOf(3, 'packages', 'directory', null),
  itemOf(4, '.', 'directory', null),
  itemOf(5, 'legacy', 'directory', null),
  itemOf(6, 'legacy/client.ts', 'file', null),
  itemOf(7, '#sharedness/file.ts', 'file', null),
  itemOf(8, 'other-tree/main.ts', 'file', 'other-tree'),
];

const inventory: TInventory = {
  items,
  pathToId: new Map(items.map((item) => [item.path, item.id])),
  realPathToId: new Map(),
};

const context: TReferenceContext = {
  aliasPrefixes: ['#shared'],
  baseDirectory: '/project',
  enumeratedRootNodes: new Map(),
  inventory,
  ownedOrigins: new Map([
    ['other-tree', { localIndex: 1, originKind: 'root-fragment' }],
    ['packages/app/src', { localIndex: 0, originKind: 'root-fragment' }],
  ]),
};

describe('rejectExternalDependencies', () => {
  it('accepts file and directory sources in scope and external file and directory targets', () => {
    expect(
      rejectExternalDependencies(
        [
          {
            from: ['packages/app/src/main.ts', 'packages/app/src/_utils'],
            to: ['legacy/client.ts', 'legacy', '#sharedness/file.ts'],
          },
        ],
        'faf.locals[0].externalDependencies',
        { kind: 'local', localIndex: 0 },
        context
      )
    ).toEqual([]);
  });

  it('rejects out-of-scope or non-existent sources and invalid external targets', () => {
    const outcomes = rejectExternalDependencies(
      [
        {
          from: ['legacy', 'legacy/client.ts', 'other-tree/main.ts'],
          to: [
            '#shared',
            '#shared/file.ts',
            'node_modules/react/index.js',
            'packages/app/src/node_modules/pkg/index.js',
            'legacy/missing.ts',
            'packages/app/src/main.ts',
            'packages/app/src',
            'packages',
            '.',
          ],
        },
      ],
      'faf.locals[0].externalDependencies',
      { kind: 'local', localIndex: 0 },
      context
    );

    expect(outcomes.map((outcome) => outcome.constraint)).toEqual([
      'configuration/reference-outside-trees',
      'configuration/reference-outside-trees',
      'configuration/reference-outside-local-scope',
      'configuration/external-dependency-to-alias',
      'configuration/external-dependency-to-alias',
      'configuration/external-dependency-to-library',
      'configuration/external-dependency-to-library',
      'configuration/non-existent-path',
      'configuration/external-dependency-to-inside-tree',
      'configuration/external-dependency-to-inside-tree',
      'configuration/external-dependency-to-inside-tree',
      'configuration/external-dependency-to-inside-tree',
    ]);
  });

  it('rejects dangling inventory target IDs as non-existent-path', () => {
    const danglingContext: TReferenceContext = {
      ...context,
      inventory: {
        ...inventory,
        pathToId: new Map([...inventory.pathToId, ['ghost.ts', 99]]),
      },
    };
    const outcomes = rejectExternalDependencies(
      [{ from: ['packages/app/src/main.ts'], to: ['ghost.ts'] }],
      'faf.locals[0].externalDependencies',
      { kind: 'local', localIndex: 0 },
      danglingContext
    );

    expect(outcomes.map((outcome) => outcome.constraint)).toEqual([
      'configuration/non-existent-path',
    ]);
  });
});
