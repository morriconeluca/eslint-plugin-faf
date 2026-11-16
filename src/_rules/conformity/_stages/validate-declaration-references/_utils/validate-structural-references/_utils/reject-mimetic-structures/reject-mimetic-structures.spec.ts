import { describe, expect, it } from 'vitest';

import type { TInventoryItem } from '../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { rejectMimeticStructures } from './reject-mimetic-structures.util.js';

const itemOf = (id: number, path: string): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind: 'directory',
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: `/project/${path}`,
  treeOrigin: 'src',
});

describe('rejectMimeticStructures', () => {
  it('accepts distinct existing directories and rejects duplicates or out-of-scope paths', () => {
    const items = [itemOf(0, 'src/_apis'), itemOf(1, 'src/_routes')];
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
        ['src', { localIndex: 0, originKind: 'root-layer' }],
      ]),
    };

    expect(
      rejectMimeticStructures(
        [{ paths: ['src/_apis'] }, { paths: ['src/_routes'] }],
        'faf.locals[0].mimeticPathStructures',
        { kind: 'local', localIndex: 0 },
        context
      )
    ).toEqual([]);

    const outcomes = rejectMimeticStructures(
      [{ paths: ['src/_apis'] }, { paths: ['src/_apis', 'src/_missing'] }],
      'faf.locals[0].mimeticPathStructures',
      { kind: 'local', localIndex: 0 },
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
        constraint: 'configuration/duplicate-mimetic-path',
        element: 'src/_apis',
        propertyPath: 'faf.locals[0].mimeticPathStructures[1].paths[0]',
      },
      {
        constraint: 'configuration/non-existent-path',
        element: 'src/_missing',
        propertyPath: 'faf.locals[0].mimeticPathStructures[1].paths[1]',
      },
    ]);
  });
});
