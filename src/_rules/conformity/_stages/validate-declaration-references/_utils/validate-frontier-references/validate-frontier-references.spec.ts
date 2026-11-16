import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventoryItem } from '../../../../_conformity@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { validateFrontierReferences } from './validate-frontier-references.util.js';

const itemOf = (
  id: number,
  path: string,
  kind: 'directory' | 'file',
  treeOrigin: null | string
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
  treeOrigin,
});

describe('validateFrontierReferences', () => {
  it('validates common and local frontier references and returns empty for valid declarations', () => {
    const items = [
      itemOf(0, 'app', 'directory', 'app'),
      itemOf(1, 'app/main.ts', 'file', 'app'),
      itemOf(2, 'lib', 'directory', 'lib'),
      itemOf(3, 'vendor/ext.ts', 'file', null),
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
        ['app', { localIndex: 0, originKind: 'root-fragment' }],
        ['lib', { localIndex: 1, originKind: 'root-layer' }],
      ]),
    };

    const validConfig: TFAFConfig = {
      faf: {
        common: {
          externalDependencies: [
            { from: ['app/main.ts'], to: ['vendor/ext.ts'] },
          ],
          publicRootNodes: ['app/main.ts'],
          treeDependencies: [{ from: ['app'], to: ['lib'] }],
        },
        locals: [
          {
            externalDependencies: [
              { from: ['app/main.ts'], to: ['vendor/ext.ts'] },
            ],
            publicRootNodes: ['app/main.ts'],
            rootFragments: [{ path: 'app', rootNodes: [['main.ts']] }],
            treeDependencies: [{ from: ['app'], to: ['lib'] }],
          },
          {
            rootLayers: ['lib'],
          },
        ],
      },
    };

    expect(validateFrontierReferences(validConfig, context)).toEqual([]);
  });

  it('aggregates outcomes across common and local frontier sections with exact property paths', () => {
    const context: TReferenceContext = {
      aliasPrefixes: [],
      baseDirectory: '/project',
      enumeratedRootNodes: new Map(),
      inventory: { items: [], pathToId: new Map(), realPathToId: new Map() },
      ownedOrigins: new Map(),
    };

    const invalidConfig: TFAFConfig = {
      faf: {
        common: {
          externalDependencies: [{ from: ['c/a.ts'], to: ['c/b.ts'] }],
          publicRootNodes: ['c/main.ts'],
          treeDependencies: [{ from: ['c'], to: ['d'] }],
        },
        locals: [
          {
            externalDependencies: [{ from: ['l/a.ts'], to: ['l/b.ts'] }],
            publicRootNodes: ['l/main.ts'],
            rootFragments: [{ path: 'l', rootNodes: [['main.ts']] }],
            treeDependencies: [{ from: ['l'], to: ['m'] }],
          },
        ],
      },
    };

    const propertyPaths = validateFrontierReferences(
      invalidConfig,
      context
    ).map((outcome) => outcome.propertyPath);

    expect(propertyPaths).toEqual([
      'faf.common.publicRootNodes[0]',
      'faf.common.treeDependencies[0].from[0]',
      'faf.common.treeDependencies[0].to[0]',
      'faf.common.externalDependencies[0].from[0]',
      'faf.common.externalDependencies[0].to[0]',
      'faf.locals[0].publicRootNodes[0]',
      'faf.locals[0].treeDependencies[0].from[0]',
      'faf.locals[0].treeDependencies[0].to[0]',
      'faf.locals[0].externalDependencies[0].from[0]',
      'faf.locals[0].externalDependencies[0].to[0]',
    ]);
  });
});
