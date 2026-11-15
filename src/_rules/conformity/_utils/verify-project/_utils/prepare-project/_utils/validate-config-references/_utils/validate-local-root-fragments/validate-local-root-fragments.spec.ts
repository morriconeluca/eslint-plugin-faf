import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';

import { validateLocalRootFragments } from './validate-local-root-fragments.util.js';

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

describe('validateLocalRootFragments', () => {
  it('validates rootLayers and rootFragments across locals entries', () => {
    const items = [
      itemOf(0, 'lib', 'directory', null, 'lib'),
      itemOf(1, 'app', 'directory', null, 'app'),
      itemOf(2, 'app/main.ts', 'file', 1, 'app'),
    ];
    const context: TReferenceContext = {
      aliasPrefixes: [],
      baseDirectory: '/project',
      enumeratedRootNodes: new Map([
        ['app/main.ts', { rootFragmentPath: 'app', treeOrigin: 'app' }],
      ]),
      inventory: {
        items,
        pathToId: new Map(items.map((item) => [item.path, item.id])),
        realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
      },
      ownedOrigins: new Map([
        ['app', { localIndex: 1, originKind: 'root-fragment' }],
        ['lib', { localIndex: 0, originKind: 'root-layer' }],
      ]),
    };

    const validConfig: TFAFConfig = {
      faf: {
        locals: [
          { rootLayers: ['lib'] },
          { rootFragments: [{ path: 'app', rootNodes: [['main.ts']] }] },
        ],
      },
    };
    expect(validateLocalRootFragments(validConfig, context)).toEqual([]);

    const invalidConfig: TFAFConfig = {
      faf: {
        locals: [
          { rootLayers: ['missing-lib'] },
          {
            rootFragments: [
              { path: 'missing-app', rootNodes: [['missing.ts']] },
            ],
          },
        ],
      },
    };
    const outcomes = validateLocalRootFragments(invalidConfig, context);
    expect(outcomes.map((outcome) => outcome.propertyPath)).toEqual([
      'faf.locals[0].rootLayers[0]',
      'faf.locals[1].rootFragments[0].path',
      'faf.locals[1].rootFragments[0].rootNodes[0][0]',
    ]);
  });
});
