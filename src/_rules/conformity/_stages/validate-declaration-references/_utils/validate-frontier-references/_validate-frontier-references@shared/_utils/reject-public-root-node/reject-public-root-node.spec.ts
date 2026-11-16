import { describe, expect, it } from 'vitest';

import type { TInventoryItem } from '../../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { rejectPublicRootNode } from './reject-public-root-node.util.js';

const itemOf = (path: string, kind: 'directory' | 'file'): TInventoryItem => ({
  depth: 1,
  id: 0,
  isSymlink: false,
  kind,
  parentId: null,
  path,
  preorderEnd: 0,
  preorderStart: 0,
  realPath: `/project/${path}`,
  treeOrigin: 'src',
});

const buildContext = (
  items: readonly TInventoryItem[],
  enumeratedRootNodes: ReadonlyMap<
    string,
    { readonly rootFragmentPath: string; readonly treeOrigin: string }
  >,
  ownedOrigins: ReadonlyMap<
    string,
    { readonly localIndex: number; readonly originKind: 'root-fragment' }
  >
): TReferenceContext => ({
  aliasPrefixes: [],
  baseDirectory: '/project',
  enumeratedRootNodes,
  inventory: {
    items,
    pathToId: new Map(items.map((item) => [item.path, item.id])),
    realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
  },
  ownedOrigins,
});

describe('rejectPublicRootNode', () => {
  it('rejects non-existent paths, unresolved inventory entries, and directory targets', () => {
    const directory = itemOf('src', 'directory');
    const context = buildContext([directory], new Map(), new Map());

    expect(
      rejectPublicRootNode(
        'src/missing.ts',
        'p',
        { kind: 'common' },
        context
      )[0]?.constraint
    ).toBe('configuration/non-existent-path');

    const brokenContext: TReferenceContext = {
      ...context,
      inventory: {
        items: [],
        pathToId: new Map([['src/ghost.ts', 99]]),
        realPathToId: new Map(),
      },
    };
    expect(
      rejectPublicRootNode(
        'src/ghost.ts',
        'p',
        { kind: 'common' },
        brokenContext
      )[0]?.constraint
    ).toBe('configuration/expected-file');

    expect(
      rejectPublicRootNode('src', 'p', { kind: 'common' }, context)[0]
        ?.constraint
    ).toBe('configuration/expected-file');
  });

  it('rejects unenumerated files and enforces common vs local ownership', () => {
    const file = itemOf('src/main.ts', 'file');
    const unenumeratedContext = buildContext([file], new Map(), new Map());
    expect(
      rejectPublicRootNode(
        'src/main.ts',
        'p',
        { kind: 'common' },
        unenumeratedContext
      )[0]?.constraint
    ).toBe('configuration/public-root-node-not-enumerated');

    const enumeratedContext = buildContext(
      [file],
      new Map([
        ['src/main.ts', { rootFragmentPath: 'src', treeOrigin: 'src' }],
      ]),
      new Map([['src', { localIndex: 0, originKind: 'root-fragment' }]])
    );

    expect(
      rejectPublicRootNode(
        'src/main.ts',
        'p',
        { kind: 'common' },
        enumeratedContext
      )
    ).toEqual([]);
    expect(
      rejectPublicRootNode(
        'src/main.ts',
        'p',
        { kind: 'local', localIndex: 0 },
        enumeratedContext
      )
    ).toEqual([]);
    expect(
      rejectPublicRootNode(
        'src/main.ts',
        'p',
        { kind: 'local', localIndex: 1 },
        enumeratedContext
      )[0]?.constraint
    ).toBe('configuration/reference-outside-local-scope');
  });
});
