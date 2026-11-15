import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';

import { validateStructuralReferences } from './validate-structural-references.util.js';

const itemOf = (
  id: number,
  path: string,
  parentId: null | number
): TInventoryItem => ({
  depth: parentId === null ? 0 : 1,
  id,
  isSymlink: false,
  kind: 'directory',
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: `/project/${path}`,
  treeOrigin: 'src',
});

describe('validateStructuralReferences', () => {
  it('validates common mimetic structures and local hierarchies and mimetic structures', () => {
    const items = [
      itemOf(0, 'src', null),
      itemOf(1, 'src/_domain', 0),
      itemOf(2, 'src/_ui', 0),
      itemOf(3, 'src/_apis', 0),
      itemOf(4, 'src/_routes', 0),
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
        ['src', { localIndex: 0, originKind: 'root-layer' }],
      ]),
    };

    const validConfig: TFAFConfig = {
      faf: {
        common: {
          mimeticPathStructures: [{ paths: ['src/_apis'] }],
        },
        locals: [
          {
            horizontalHierarchies: [
              { hierarchy: [['_domain'], ['_ui']], path: 'src' },
            ],
            mimeticPathStructures: [{ paths: ['src/_routes'] }],
            rootLayers: ['src'],
          },
        ],
      },
    };
    expect(validateStructuralReferences(validConfig, context)).toEqual([]);

    const invalidConfig: TFAFConfig = {
      faf: {
        common: {
          mimeticPathStructures: [{ paths: ['src/_missing-common'] }],
        },
        locals: [
          {
            horizontalHierarchies: [
              { hierarchy: [['_domain'], ['_ui']], path: 'src/_missing-h' },
            ],
            mimeticPathStructures: [{ paths: ['src/_missing-local'] }],
            rootLayers: ['src'],
          },
        ],
      },
    };
    const outcomes = validateStructuralReferences(invalidConfig, context);
    expect(outcomes.map((outcome) => outcome.propertyPath)).toEqual([
      'faf.common.mimeticPathStructures[0].paths[0]',
      'faf.locals[0].horizontalHierarchies[0].path',
      'faf.locals[0].mimeticPathStructures[0].paths[0]',
    ]);
  });
});
