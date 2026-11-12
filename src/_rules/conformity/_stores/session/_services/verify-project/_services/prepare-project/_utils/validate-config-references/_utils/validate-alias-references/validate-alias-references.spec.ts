import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventory } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_types/reference-context.type.js';

import { validateAliasReferences } from './validate-alias-references.util.js';

const emptyInventory: TInventory = {
  items: [],
  pathToId: new Map(),
  realPathToId: new Map(),
};

const createContext = (inventory: TInventory): TReferenceContext => ({
  aliasPrefixes: [],
  baseDirectory: '/project',
  enumeratedRootNodes: new Map(),
  inventory,
  ownedOrigins: new Map(),
});

describe('validateAliasReferences', () => {
  it('returns empty array when common or aliases is absent', () => {
    const configA: TFAFConfig = {
      faf: {
        locals: [{ rootLayers: ['src'] }],
      },
    };
    const configB: TFAFConfig = {
      faf: {
        common: {},
        locals: [{ rootLayers: ['src'] }],
      },
    };
    const context = createContext(emptyInventory);
    expect(validateAliasReferences(configA, context)).toEqual([]);
    expect(validateAliasReferences(configB, context)).toEqual([]);
  });

  it('accepts alias base that resolves to an inventory directory', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          aliases: {
            '#shared': 'src/_shared',
          },
        },
        locals: [{ rootLayers: ['src'] }],
      },
    };
    const inventory: TInventory = {
      items: [
        {
          depth: 2,
          id: 0,
          isSymlink: false,
          kind: 'directory',
          parentId: null,
          path: 'src/_shared',
          preorderEnd: 0,
          preorderStart: 0,
          realPath: '/project/src/_shared',
          treeOrigin: 'src',
        },
      ],
      pathToId: new Map([['src/_shared', 0]]),
      realPathToId: new Map([['/project/src/_shared', 0]]),
    };
    const context = createContext(inventory);
    expect(validateAliasReferences(config, context)).toEqual([]);
  });

  it('rejects alias base that does not exist in inventory', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          aliases: {
            '#missing': 'src/nonexistent',
          },
        },
        locals: [{ rootLayers: ['src'] }],
      },
    };
    const context = createContext(emptyInventory);
    const outcomes = validateAliasReferences(config, context);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('configuration/non-existent-path');
    expect(outcomes[0]?.element).toBe('src/nonexistent');
    expect(outcomes[0]?.propertyPath).toBe('faf.common.aliases.#missing');
    expect(outcomes[0]?.message).toContain(
      'Alias base "src/nonexistent" does not exist under configuration base "/project"'
    );
  });

  it('rejects alias base that resolves to a file', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          aliases: {
            '#file': 'src/file.ts',
          },
        },
        locals: [{ rootLayers: ['src'] }],
      },
    };
    const inventory: TInventory = {
      items: [
        {
          depth: 2,
          id: 0,
          isSymlink: false,
          kind: 'file',
          parentId: null,
          path: 'src/file.ts',
          preorderEnd: 0,
          preorderStart: 0,
          realPath: '/project/src/file.ts',
          treeOrigin: 'src',
        },
      ],
      pathToId: new Map([['src/file.ts', 0]]),
      realPathToId: new Map([['/project/src/file.ts', 0]]),
    };
    const context = createContext(inventory);
    const outcomes = validateAliasReferences(config, context);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('configuration/expected-directory');
    expect(outcomes[0]?.element).toBe('src/file.ts');
    expect(outcomes[0]?.propertyPath).toBe('faf.common.aliases.#file');
    expect(outcomes[0]?.message).toContain(
      'Alias base "src/file.ts" must be a directory'
    );
  });

  it('rejects alias base when inventory item is missing', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          aliases: {
            '#dangling': 'src/dangling',
          },
        },
        locals: [{ rootLayers: ['src'] }],
      },
    };
    const inventory: TInventory = {
      items: [],
      pathToId: new Map([['src/dangling', 99]]),
      realPathToId: new Map(),
    };
    const context = createContext(inventory);
    const outcomes = validateAliasReferences(config, context);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.constraint).toBe('configuration/expected-directory');
    expect(outcomes[0]?.element).toBe('src/dangling');
    expect(outcomes[0]?.propertyPath).toBe('faf.common.aliases.#dangling');
  });
});
