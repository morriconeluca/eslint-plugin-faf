import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TReferenceContext } from '../../../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { rejectNestedRootFragment } from './reject-nested-root-fragment.util.js';

function createDirectoryItem(
  id: number,
  path: string,
  parentId: null | number
): TInventoryItem {
  return {
    depth: 1,
    id,
    isSymlink: false,
    kind: 'directory',
    parentId,
    path,
    preorderEnd: id,
    preorderStart: id,
    realPath: `/${path}`,
    treeOrigin: 'src',
  };
}

describe('rejectNestedRootFragment', () => {
  it('returns empty array when child is direct child and in local scope', () => {
    const inventory: TInventory = {
      items: [
        createDirectoryItem(0, 'src', null),
        createDirectoryItem(1, 'src/app', 0),
      ],
      pathToId: new Map([
        ['src', 0],
        ['src/app', 1],
      ]),
      realPathToId: new Map(),
    };
    const context: TReferenceContext = {
      aliasPrefixes: [],
      baseDirectory: '.',
      enumeratedRootNodes: new Map(),
      inventory,
      ownedOrigins: new Map([
        ['src', { localIndex: 0, originKind: 'root-fragment' }],
      ]),
    };

    const outcomes = rejectNestedRootFragment(
      'src/app',
      'src',
      'faf.locals[0].rootFragments[0].subRootFragments[0]',
      0,
      context
    );
    expect(outcomes).toEqual([]);
  });

  it('rejects child when it is not a direct child directory', () => {
    const inventory: TInventory = {
      items: [
        createDirectoryItem(0, 'src', null),
        createDirectoryItem(1, 'src/nested/app', 0),
      ],
      pathToId: new Map([
        ['src', 0],
        ['src/nested/app', 1],
      ]),
      realPathToId: new Map(),
    };
    const context: TReferenceContext = {
      aliasPrefixes: [],
      baseDirectory: '.',
      enumeratedRootNodes: new Map(),
      inventory,
      ownedOrigins: new Map([
        ['src', { localIndex: 0, originKind: 'root-fragment' }],
      ]),
    };

    const outcomes = rejectNestedRootFragment(
      'src/nested/app',
      'src',
      'faf.locals[0].rootFragments[0].subRootFragments[0]',
      0,
      context
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe(
      'configuration/nested-root-fragment-not-direct-child'
    );
  });

  it('reports non-existent path when child directory is not found', () => {
    const inventory: TInventory = {
      items: [createDirectoryItem(0, 'src', null)],
      pathToId: new Map([['src', 0]]),
      realPathToId: new Map(),
    };
    const context: TReferenceContext = {
      aliasPrefixes: [],
      baseDirectory: '.',
      enumeratedRootNodes: new Map(),
      inventory,
      ownedOrigins: new Map([
        ['src', { localIndex: 0, originKind: 'root-fragment' }],
      ]),
    };

    const outcomes = rejectNestedRootFragment(
      'src/missing',
      'src',
      'faf.locals[0].rootFragments[0].subRootFragments[0]',
      0,
      context
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('configuration/non-existent-path');
  });
});
