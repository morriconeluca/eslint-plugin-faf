import { describe, expect, it } from 'vitest';

import type {
  TEntryKind,
  TInventory,
  TInventoryItem,
} from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TReferenceContext } from '../../../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';

import { rejectHierarchyPaths } from './reject-hierarchy-paths.util.js';

type TSimpleEntry = {
  readonly kind: TEntryKind;
  readonly parentId: null | number;
  readonly path: string;
  readonly treeOrigin: null | string;
};

function createContext(entries: readonly TSimpleEntry[]): TReferenceContext {
  const items: TInventoryItem[] = entries.map((entry, id) => ({
    depth: entry.path === '.' ? 0 : entry.path.split('/').length,
    id,
    isSymlink: false,
    kind: entry.kind,
    parentId: entry.parentId,
    path: entry.path,
    preorderEnd: id,
    preorderStart: id,
    realPath: `/project/${entry.path}`,
    treeOrigin: entry.treeOrigin,
  }));
  const inventory: TInventory = {
    items,
    pathToId: new Map(items.map((item) => [item.path, item.id])),
    realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
  };
  return {
    aliasPrefixes: [],
    baseDirectory: '/project',
    enumeratedRootNodes: new Map(),
    inventory,
    ownedOrigins: new Map([
      ['.', { localIndex: 0, originKind: 'root-layer' }],
      ['lib', { localIndex: 1, originKind: 'root-layer' }],
      ['src', { localIndex: 0, originKind: 'root-layer' }],
    ]),
  };
}

describe('rejectHierarchyPaths', () => {
  it('returns empty outcomes for empty hierarchies list', () => {
    const context = createContext([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
    ]);
    expect(
      rejectHierarchyPaths(
        [],
        'faf.locals[0].horizontalHierarchies',
        { kind: 'local', localIndex: 0 },
        context
      )
    ).toEqual([]);
  });

  it('accepts valid direct child directories and files under a subdirectory and dot root', () => {
    const srcContext = createContext([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      { kind: 'directory', parentId: 0, path: 'src/_types', treeOrigin: 'src' },
      { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
    ]);
    expect(
      rejectHierarchyPaths(
        [{ hierarchy: [['_types'], ['main.ts']], path: 'src' }],
        'faf.locals[0].horizontalHierarchies',
        { kind: 'local', localIndex: 0 },
        srcContext
      )
    ).toEqual([]);

    const dotContext = createContext([
      { kind: 'directory', parentId: null, path: '.', treeOrigin: '.' },
      { kind: 'directory', parentId: 0, path: '_domain', treeOrigin: '.' },
      { kind: 'directory', parentId: 0, path: '_ui', treeOrigin: '.' },
    ]);
    expect(
      rejectHierarchyPaths(
        [{ hierarchy: [['_domain'], ['_ui']], path: '.' }],
        'faf.locals[0].horizontalHierarchies',
        { kind: 'local', localIndex: 0 },
        dotContext
      )
    ).toEqual([]);
  });

  it('forwards parent directory scope/existence outcomes without checking members', () => {
    const context = createContext([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
      { kind: 'directory', parentId: null, path: 'lib', treeOrigin: 'lib' },
      { kind: 'directory', parentId: null, path: 'outside', treeOrigin: null },
    ]);
    const outcomes = rejectHierarchyPaths(
      [
        { hierarchy: [['_missing'], ['_also-missing']], path: 'src/absent' },
        { hierarchy: [['_missing'], ['_also-missing']], path: 'src/main.ts' },
        { hierarchy: [['_missing'], ['_also-missing']], path: 'outside' },
        { hierarchy: [['_missing'], ['_also-missing']], path: 'lib' },
      ],
      'faf.locals[0].horizontalHierarchies',
      { kind: 'local', localIndex: 0 },
      context
    );
    expect(
      outcomes.map(
        (outcome) =>
          `${outcome.propertyPath}|${outcome.constraint}|${outcome.element}`
      )
    ).toEqual([
      'faf.locals[0].horizontalHierarchies[0].path|configuration/non-existent-path|src/absent',
      'faf.locals[0].horizontalHierarchies[1].path|configuration/expected-directory|src/main.ts',
      'faf.locals[0].horizontalHierarchies[2].path|configuration/reference-outside-trees|outside',
      'faf.locals[0].horizontalHierarchies[3].path|configuration/reference-outside-local-scope|lib',
    ]);
  });

  it('rejects missing direct child, forward/backslash members, and inventory item with wrong parentId', () => {
    const context = createContext([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      { kind: 'directory', parentId: 0, path: 'src/_types', treeOrigin: 'src' },
      { kind: 'directory', parentId: 0, path: 'src/_a/_b', treeOrigin: 'src' },
      { kind: 'directory', parentId: 0, path: 'src/_a\\_b', treeOrigin: 'src' },
      {
        kind: 'directory',
        parentId: 1,
        path: 'src/_wrong-parent',
        treeOrigin: 'src',
      },
    ]);
    const outcomes = rejectHierarchyPaths(
      [
        {
          hierarchy: [
            ['_types', '_missing'],
            ['_a/_b', '_a\\_b', '_wrong-parent'],
          ],
          path: 'src',
        },
      ],
      'faf.locals[0].horizontalHierarchies',
      { kind: 'local', localIndex: 0 },
      context
    );
    expect(outcomes).toEqual([
      {
        constraint: 'configuration/non-existent-path',
        element: 'src/_missing',
        family: 'configuration',
        message:
          '\'src/_missing\' does not exist: Direct child "_missing" does not exist under "src"',
        normativeReference: 'FAF §1.2, §6.9',
        propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[0][1]',
      },
      {
        constraint: 'configuration/non-existent-path',
        element: 'src/_a/_b',
        family: 'configuration',
        message:
          '\'src/_a/_b\' does not exist: Direct child "_a/_b" does not exist under "src"',
        normativeReference: 'FAF §1.2, §6.9',
        propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[1][0]',
      },
      {
        constraint: 'configuration/non-existent-path',
        element: 'src/_a\\_b',
        family: 'configuration',
        message:
          '\'src/_a\\_b\' does not exist: Direct child "_a\\_b" does not exist under "src"',
        normativeReference: 'FAF §1.2, §6.9',
        propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[1][1]',
      },
      {
        constraint: 'configuration/non-existent-path',
        element: 'src/_wrong-parent',
        family: 'configuration',
        message:
          '\'src/_wrong-parent\' does not exist: Direct child "_wrong-parent" does not exist under "src"',
        normativeReference: 'FAF §1.2, §6.9',
        propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[1][2]',
      },
    ]);
  });

  it('rejects non-existent direct child under dot root using member directly as childPath', () => {
    const context = createContext([
      { kind: 'directory', parentId: null, path: '.', treeOrigin: '.' },
      { kind: 'directory', parentId: 0, path: '_domain', treeOrigin: '.' },
    ]);
    const outcomes = rejectHierarchyPaths(
      [{ hierarchy: [['_domain'], ['_missing']], path: '.' }],
      'faf.locals[0].horizontalHierarchies',
      { kind: 'local', localIndex: 0 },
      context
    );
    expect(outcomes).toEqual([
      {
        constraint: 'configuration/non-existent-path',
        element: '_missing',
        family: 'configuration',
        message:
          '\'_missing\' does not exist: Direct child "_missing" does not exist under "."',
        normativeReference: 'FAF §1.2, §6.9',
        propertyPath: 'faf.locals[0].horizontalHierarchies[0].hierarchy[1][0]',
      },
    ]);
  });
});
