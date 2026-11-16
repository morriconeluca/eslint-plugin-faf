import { describe, expect, it } from 'vitest';

import type { TInventoryItem } from '../../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { rejectOriginDirectory } from './reject-origin-directory.util.js';

const itemOf = (
  id: number,
  path: string,
  kind: 'directory' | 'file'
): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind,
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: `/project/${path}`,
  treeOrigin: 'src',
});

const buildContext = (items: readonly TInventoryItem[]): TReferenceContext => ({
  aliasPrefixes: [],
  baseDirectory: '/project',
  enumeratedRootNodes: new Map(),
  inventory: {
    items,
    pathToId: new Map(items.map((item) => [item.path, item.id])),
    realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
  },
  ownedOrigins: new Map(),
});

describe('rejectOriginDirectory', () => {
  it('accepts valid self-originating directories and rejects invalid origins', () => {
    const origin = itemOf(0, 'src', 'directory');
    const nested = itemOf(1, 'src/nested', 'directory');
    const file = itemOf(2, 'src/main.ts', 'file');
    const context = buildContext([origin, nested, file]);

    expect(
      rejectOriginDirectory({
        context,
        label: 'Origin directory',
        path: 'src',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      })
    ).toEqual([]);

    expect(
      rejectOriginDirectory({
        context,
        label: 'Origin directory',
        path: 'missing',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      })[0]?.constraint
    ).toBe('configuration/non-existent-path');

    const brokenContext: TReferenceContext = {
      ...context,
      inventory: {
        items: [],
        pathToId: new Map([['ghost', 99]]),
        realPathToId: new Map(),
      },
    };
    expect(
      rejectOriginDirectory({
        context: brokenContext,
        label: 'Origin directory',
        path: 'ghost',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      })[0]?.constraint
    ).toBe('configuration/expected-directory');

    expect(
      rejectOriginDirectory({
        context,
        label: 'Origin directory',
        path: 'src/main.ts',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      })[0]?.constraint
    ).toBe('configuration/expected-directory');

    expect(
      rejectOriginDirectory({
        context,
        label: 'Origin directory',
        path: 'src/nested',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      })[0]?.constraint
    ).toBe('configuration/origin-contained-in-other-tree');
  });
});
