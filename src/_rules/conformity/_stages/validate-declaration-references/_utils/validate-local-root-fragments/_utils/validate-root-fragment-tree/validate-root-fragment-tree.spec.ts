import { describe, expect, it } from 'vitest';

import type { TFAFRootFragment } from '../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventoryItem } from '../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { validateRootFragmentTree } from './validate-root-fragment-tree.util.js';

const itemOf = (
  id: number,
  path: string,
  kind: 'directory' | 'file',
  parentId: null | number
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
  treeOrigin: 'src',
});

describe('validateRootFragmentTree', () => {
  it('validates a root fragment tree and its nested subRootFragments recursively', () => {
    const items = [
      itemOf(0, 'src', 'directory', null),
      itemOf(1, 'src/main.ts', 'file', 0),
      itemOf(2, 'src/app', 'directory', 0),
      itemOf(3, 'src/app/app.ts', 'file', 2),
    ];
    const context: TReferenceContext = {
      aliasPrefixes: [],
      baseDirectory: '/project',
      enumeratedRootNodes: new Map([
        ['src/app/app.ts', { rootFragmentPath: 'src/app', treeOrigin: 'src' }],
        ['src/main.ts', { rootFragmentPath: 'src', treeOrigin: 'src' }],
      ]),
      inventory: {
        items,
        pathToId: new Map(items.map((item) => [item.path, item.id])),
        realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
      },
      ownedOrigins: new Map([
        ['src', { localIndex: 0, originKind: 'root-fragment' }],
      ]),
    };

    const validTree: TFAFRootFragment = {
      dependencyEdges: [{ from: ['main.ts'], to: ['src/app/app.ts'] }],
      path: 'src',
      rootNodes: [['main.ts']],
      subRootFragments: [{ path: 'src/app', rootNodes: [['app.ts']] }],
    };

    expect(
      validateRootFragmentTree(
        validTree,
        null,
        'src',
        0,
        'faf.locals[0].rootFragments[0]',
        context
      )
    ).toEqual([]);

    const invalidTree: TFAFRootFragment = {
      path: 'missing-src',
      rootNodes: [['main.ts']],
      subRootFragments: [{ path: 'missing-sub', rootNodes: [['sub.ts']] }],
    };

    const outcomes = validateRootFragmentTree(
      invalidTree,
      null,
      'missing-src',
      0,
      'faf.locals[0].rootFragments[0]',
      context
    );
    expect(outcomes.map((outcome) => outcome.propertyPath)).toEqual([
      'faf.locals[0].rootFragments[0].path',
      'faf.locals[0].rootFragments[0].rootNodes[0][0]',
      'faf.locals[0].rootFragments[0].subRootFragments[0].path',
      'faf.locals[0].rootFragments[0].subRootFragments[0].path',
      'faf.locals[0].rootFragments[0].subRootFragments[0].rootNodes[0][0]',
    ]);
  });
});
