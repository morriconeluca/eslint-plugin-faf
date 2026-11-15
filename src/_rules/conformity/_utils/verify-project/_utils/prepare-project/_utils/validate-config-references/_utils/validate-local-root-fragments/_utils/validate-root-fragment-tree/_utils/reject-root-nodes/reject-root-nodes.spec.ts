import { describe, expect, it } from 'vitest';

import type { TFAFRootFragment } from '../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventoryItem } from '../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../../../../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';

import { rejectRootNodes } from './reject-root-nodes.util.js';

const itemOf = (
  id: number,
  path: string,
  kind: 'directory' | 'file',
  parentId: null | number,
  treeOrigin: string
): TInventoryItem => ({
  depth: parentId === null ? 0 : 1,
  id,
  isSymlink: false,
  kind,
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: `/project/${path}`,
  treeOrigin,
});

describe('rejectRootNodes', () => {
  it('accepts direct-child root nodes under named and dot origins and rejects indirect or missing nodes', () => {
    const items = [
      itemOf(0, '.', 'directory', null, '.'),
      itemOf(1, 'main.ts', 'file', 0, '.'),
      itemOf(2, 'src', 'directory', 0, 'src'),
      itemOf(3, 'src/index.ts', 'file', 2, 'src'),
      itemOf(4, 'src/nested/deep.ts', 'file', 2, 'src'),
    ];
    const context: TReferenceContext = {
      aliasPrefixes: [],
      baseDirectory: '/project',
      enumeratedRootNodes: new Map(),
      inventory: {
        items,
        pathToId: new Map(items.map((item) => [item.path, item.id])),
        realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
      },
      ownedOrigins: new Map([
        ['.', { localIndex: 0, originKind: 'root-fragment' }],
        ['src', { localIndex: 0, originKind: 'root-fragment' }],
      ]),
    };

    const dotFragment: TFAFRootFragment = {
      path: '.',
      rootNodes: [['main.ts']],
    };
    expect(
      rejectRootNodes(dotFragment, 'faf.locals[0].rootFragments[0]', 0, context)
    ).toEqual([]);

    const srcFragment: TFAFRootFragment = {
      path: 'src',
      rootNodes: [['index.ts'], ['nested/deep.ts', 'missing.ts']],
    };
    const outcomes = rejectRootNodes(
      srcFragment,
      'faf.locals[0].rootFragments[1]',
      0,
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
        constraint: 'configuration/root-node-not-direct-child',
        element: 'src/nested/deep.ts',
        propertyPath: 'faf.locals[0].rootFragments[1].rootNodes[1][0]',
      },
      {
        constraint: 'configuration/non-existent-path',
        element: 'src/missing.ts',
        propertyPath: 'faf.locals[0].rootFragments[1].rootNodes[1][1]',
      },
    ]);
  });
});
