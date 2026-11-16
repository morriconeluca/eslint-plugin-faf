import { describe, expect, it } from 'vitest';

import type {
  TInventoryItem,
  TOriginKind,
} from '../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TReferenceContext } from './reject-reference-scope.type.js';

import { rejectReferenceScope } from './reject-reference-scope.util.js';

const buildContext = (
  items: readonly TInventoryItem[],
  ownedOrigins: ReadonlyMap<
    string,
    { readonly localIndex: number; readonly originKind: TOriginKind }
  >
): TReferenceContext => ({
  aliasPrefixes: [],
  baseDirectory: '/project',
  enumeratedRootNodes: new Map(),
  inventory: {
    items,
    pathToId: new Map(items.map((item) => [item.path, item.id])),
    realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
  },
  ownedOrigins,
});

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

describe('rejectReferenceScope', () => {
  describe('directory checks', () => {
    it('rejects missing paths, missing resolved items, and non-directories', () => {
      const fileItem = itemOf(0, 'src/main.ts', 'file', 'src');
      const context = buildContext(
        [fileItem],
        new Map([['src', { localIndex: 0, originKind: 'root-layer' }]])
      );

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'directory',
          label: 'Target directory',
          path: 'src/missing',
          propertyPath: 'faf.locals[0].path',
          scope: { kind: 'common' },
        })
      ).toEqual([
        expect.objectContaining({
          constraint: 'configuration/non-existent-path',
          element: 'src/missing',
        }),
      ]);

      const brokenContext: TReferenceContext = {
        ...context,
        inventory: {
          items: [],
          pathToId: new Map([['src/ghost', 99]]),
          realPathToId: new Map(),
        },
      };
      expect(
        rejectReferenceScope({
          context: brokenContext,
          expectedKind: 'directory',
          label: 'Target directory',
          path: 'src/ghost',
          propertyPath: 'faf.locals[0].path',
          scope: { kind: 'common' },
        })
      ).toEqual([
        expect.objectContaining({
          constraint: 'configuration/expected-directory',
          element: 'src/ghost',
        }),
      ]);

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'directory',
          label: 'Target directory',
          path: 'src/main.ts',
          propertyPath: 'faf.locals[0].path',
          scope: { kind: 'common' },
        })
      ).toEqual([
        expect.objectContaining({
          constraint: 'configuration/expected-directory',
          element: 'src/main.ts',
        }),
      ]);
    });

    it('enforces tree membership, common scope, and local scope', () => {
      const outside = itemOf(0, 'docs', 'directory', null);
      const unowned = itemOf(1, 'other/dir', 'directory', 'other');
      const treeZero = itemOf(2, 'src/dir', 'directory', 'src');
      const context = buildContext(
        [outside, unowned, treeZero],
        new Map([['src', { localIndex: 0, originKind: 'root-layer' }]])
      );

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'directory',
          label: 'Dir',
          path: 'docs',
          propertyPath: 'p',
          scope: { kind: 'common' },
        })[0]?.constraint
      ).toBe('configuration/reference-outside-trees');

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'directory',
          label: 'Dir',
          path: 'other/dir',
          propertyPath: 'p',
          scope: { kind: 'common' },
        })[0]?.constraint
      ).toBe('configuration/reference-outside-trees');

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'directory',
          label: 'Dir',
          path: 'src/dir',
          propertyPath: 'p',
          scope: { kind: 'common' },
        })
      ).toEqual([]);

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'directory',
          label: 'Dir',
          path: 'src/dir',
          propertyPath: 'p',
          scope: { kind: 'local', localIndex: 0 },
        })
      ).toEqual([]);

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'directory',
          label: 'Dir',
          path: 'src/dir',
          propertyPath: 'p',
          scope: { kind: 'local', localIndex: 1 },
        })[0]?.constraint
      ).toBe('configuration/reference-outside-local-scope');
    });
  });

  describe('file checks', () => {
    it('rejects missing files, missing resolved items, non-files, and enforces scope', () => {
      const directoryItem = itemOf(0, 'src', 'directory', 'src');
      const outsideFile = itemOf(1, 'outside.ts', 'file', null);
      const unownedFile = itemOf(2, 'other/file.ts', 'file', 'other');
      const ownedFile = itemOf(3, 'src/main.ts', 'file', 'src');
      const context = buildContext(
        [directoryItem, outsideFile, unownedFile, ownedFile],
        new Map([['src', { localIndex: 0, originKind: 'root-fragment' }]])
      );

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'file',
          label: 'File',
          path: 'src/missing.ts',
          propertyPath: 'p',
          scope: { kind: 'common' },
        })[0]?.constraint
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
        rejectReferenceScope({
          context: brokenContext,
          expectedKind: 'file',
          label: 'File',
          path: 'src/ghost.ts',
          propertyPath: 'p',
          scope: { kind: 'common' },
        })[0]?.constraint
      ).toBe('configuration/expected-file');

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'file',
          label: 'File',
          path: 'src',
          propertyPath: 'p',
          scope: { kind: 'common' },
        })[0]?.constraint
      ).toBe('configuration/expected-file');

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'file',
          label: 'File',
          path: 'outside.ts',
          propertyPath: 'p',
          scope: { kind: 'common' },
        })[0]?.constraint
      ).toBe('configuration/reference-outside-trees');

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'file',
          label: 'File',
          path: 'other/file.ts',
          propertyPath: 'p',
          scope: { kind: 'common' },
        })[0]?.constraint
      ).toBe('configuration/reference-outside-trees');

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'file',
          label: 'File',
          path: 'src/main.ts',
          propertyPath: 'p',
          scope: { kind: 'common' },
        })
      ).toEqual([]);

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'file',
          label: 'File',
          path: 'src/main.ts',
          propertyPath: 'p',
          scope: { kind: 'local', localIndex: 0 },
        })
      ).toEqual([]);

      expect(
        rejectReferenceScope({
          context,
          expectedKind: 'file',
          label: 'File',
          path: 'src/main.ts',
          propertyPath: 'p',
          scope: { kind: 'local', localIndex: 1 },
        })[0]?.constraint
      ).toBe('configuration/reference-outside-local-scope');
    });
  });
});
