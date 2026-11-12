import { describe, expect, it } from 'vitest';

import type {
  TFAFConfig,
  TFAFLocalConfig,
} from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TEffectiveDeclarations,
  TEffectiveTree,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TEntryKind,
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { validateConfigReferences } from './validate-config-references.util.js';

type TSimpleEntry = {
  readonly kind: TEntryKind;
  readonly parentId: null | number;
  readonly path: string;
  readonly treeOrigin: null | string;
};

function constraintsOf(
  config: TFAFConfig,
  inventory: TInventory,
  declarations: TEffectiveDeclarations = createDeclarations()
): readonly string[] {
  const outcomes = validateConfigReferences(config, declarations, inventory);
  for (const outcome of outcomes) {
    expect(outcome.message).toContain(outcome.element);
    expect(outcome.message.toLowerCase()).toContain(
      phraseFor(outcome.propertyPath).toLowerCase()
    );
    expect(outcome.message.length).toBeGreaterThan(outcome.element.length);
    expect(outcome.family).toBe('configuration');
    expect(outcome.normativeReference.length).toBeGreaterThan(0);
  }
  return outcomes.map(
    (outcome) =>
      `${outcome.propertyPath}|${outcome.constraint}|${outcome.element}`
  );
}

function createDeclarations(
  trees: readonly TEffectiveTree[] = [],
  baseDirectory = '/project'
): TEffectiveDeclarations {
  return {
    aliases: [],
    baseDirectory,
    trees,
  };
}

function createInventory(entries: readonly TSimpleEntry[]): TInventory {
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
  return {
    items,
    pathToId: new Map(items.map((item) => [item.path, item.id])),
    realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
  };
}

function createTree(originPath: string): TEffectiveTree {
  return {
    catalog: {
      categoryToRole: new Map(),
      extensionToRole: new Map(),
      roles: [],
      subGraphRoles: [],
      topRank: 1,
    },
    externalDependencyPairs: [],
    foreignDomains: [],
    foreignNodes: { families: [], individualPaths: [] },
    horizontalHierarchies: [],
    localHorizontalHierarchies: [],
    mimeticPathStructures: [],
    originKind: 'root-layer',
    originPath,
    publicRootNodes: [],
    rootFragments: [],
    treeDependencyPairs: [],
  };
}

function localLayer(path: string): TFAFLocalConfig {
  return { rootLayers: [path] };
}

function outcomeFallbackPhrase(propertyPath: string): string {
  if (
    propertyPath.includes('externalDependencies') &&
    propertyPath.includes('.from[')
  ) {
    return 'External dependency source';
  }
  if (propertyPath.includes('rootLayers')) {
    return 'Origin directory';
  }
  if (propertyPath.includes('.path')) {
    return 'root fragment';
  }
  if (propertyPath.includes('rootNodes')) {
    return 'Root node';
  }
  if (propertyPath.includes('publicRootNodes')) {
    return 'public';
  }
  if (propertyPath.includes('treeDependencies')) {
    return 'Tree dependency';
  }
  if (propertyPath.includes('externalDependencies')) {
    return 'External dependency';
  }
  if (propertyPath.includes('dependencyEdges')) {
    return 'Root dependency';
  }
  return 'configuration';
}

function phraseFor(propertyPath: string): string {
  if (propertyPath.includes('aliases')) {
    return 'Alias base';
  }
  if (propertyPath.includes('foreignDomains')) {
    return 'Foreign domain';
  }
  if (propertyPath.includes('foreignNodes')) {
    return propertyPath.includes('.paths[')
      ? 'Foreign family path'
      : 'Foreign node';
  }
  if (propertyPath.includes('localHorizontalHierarchies')) {
    return 'Hierarchy directory';
  }
  if (propertyPath.includes('mimeticPathStructures')) {
    return 'Mimetic path';
  }
  return outcomeFallbackPhrase(propertyPath);
}

describe('validateConfigReferences', () => {
  it('returns no outcomes when every punctual reference exists with the required nature', () => {
    const inventory = createInventory([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      { kind: 'directory', parentId: 0, path: 'src/app', treeOrigin: 'src' },
      { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
      { kind: 'file', parentId: 1, path: 'src/app/app.tsx', treeOrigin: 'src' },
      {
        kind: 'directory',
        parentId: 0,
        path: 'src/_tooling',
        treeOrigin: 'src',
      },
      { kind: 'file', parentId: 0, path: 'src/README.md', treeOrigin: 'src' },
      { kind: 'directory', parentId: 0, path: 'src/_apis', treeOrigin: 'src' },
      {
        kind: 'directory',
        parentId: 0,
        path: 'src/_domain',
        treeOrigin: 'src',
      },
      { kind: 'directory', parentId: null, path: 'lib', treeOrigin: 'lib' },
      { kind: 'file', parentId: null, path: 'package.json', treeOrigin: null },
    ]);
    const config: TFAFConfig = {
      faf: {
        common: {
          foreignDomains: ['src/_tooling'],
          foreignNodes: [
            'src/README.md',
            { paths: ['src'], patterns: ['*.missing'] },
          ],
          localHorizontalHierarchies: [
            { hierarchies: [['_absent']], paths: ['src/_domain'] },
          ],
          mimeticPathStructures: [{ actions: ['get'], paths: ['src/_apis'] }],
          publicRootNodes: ['src/app/app.tsx'],
          roles: [{ category: '_missing', name: 'missing' }],
        },
        locals: [
          {
            externalDependencies: [
              { from: ['src/main.ts'], to: ['package.json'] },
            ],
            rootFragments: [
              {
                dependencyEdges: [
                  { from: ['main.ts'], to: ['src/app/app.tsx'] },
                ],
                path: 'src',
                rootNodes: [['main.ts']],
                subRootFragments: [
                  { path: 'src/app', rootNodes: [['app.tsx']] },
                ],
              },
            ],
            treeDependencies: [{ from: ['src'], to: ['lib'] }],
          },
        ],
      },
    };

    expect(
      validateConfigReferences(config, createDeclarations(), inventory)
    ).toEqual([]);
  });

  it('sorts outcomes by property path, constraint, and element', () => {
    const inventory = createInventory([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
    ]);
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            foreignDomains: ['missing-z', 'missing-a'],
            rootLayers: ['src'],
          },
        ],
      },
    };

    const outcomes = validateConfigReferences(
      config,
      createDeclarations(),
      inventory
    );
    expect(outcomes.map((outcome) => outcome.propertyPath)).toEqual([
      'faf.locals[0].foreignDomains[0]',
      'faf.locals[0].foreignDomains[1]',
    ]);
    expect(outcomes[0]?.element).toBe('missing-z');
  });

  describe('I riferimenti puntuali devono identificare elementi esistenti del tipo richiesto', () => {
    const inventory = createInventory([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
      { kind: 'directory', parentId: 0, path: 'src/app', treeOrigin: 'src' },
      {
        kind: 'file',
        parentId: 2,
        path: 'src/app/index.ts',
        treeOrigin: 'src',
      },
      { kind: 'file', parentId: 0, path: 'src/README.md', treeOrigin: 'src' },
      {
        kind: 'directory',
        parentId: 0,
        path: 'src/app/[todoId]',
        treeOrigin: 'src',
      },
      {
        kind: 'directory',
        parentId: 0,
        path: 'src/app/(auth)',
        treeOrigin: 'src',
      },
      {
        kind: 'directory',
        parentId: 0,
        path: 'src/_src@shared',
        treeOrigin: 'src',
      },
    ]);

    it('reports a missing file without searching an omitted extension or index.ts', () => {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              foreignNodes: ['src/main', 'src/app'],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const outcomes = validateConfigReferences(
        config,
        createDeclarations(),
        inventory
      );
      expect(outcomes.map((outcome) => outcome.element)).toEqual([
        'src/main',
        'src/app',
      ]);
      expect(outcomes.map((outcome) => outcome.constraint)).toEqual([
        'configuration/non-existent-path',
        'configuration/expected-file',
      ]);
      expect(outcomes[0]?.message).toContain('/project');
      expect(outcomes[0]?.propertyPath).toBe('faf.locals[0].foreignNodes[0]');
    });

    it('does not expand a glob selector outside patterns', () => {
      const config: TFAFConfig = {
        faf: {
          locals: [{ foreignNodes: ['src/*.md'], rootLayers: ['src'] }],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].foreignNodes[0]|configuration/non-existent-path|src/*.md',
      ]);
    });

    it('treats brackets and @ as literal path characters and does not rewrite separators', () => {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              foreignDomains: [
                'src/app/[todoId]',
                'src/app/(auth)',
                'src/_src@shared',
                'src\\main.ts',
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const outcomes = validateConfigReferences(
        config,
        createDeclarations(),
        inventory
      );
      expect(outcomes.map((outcome) => outcome.element)).toEqual([
        'src\\main.ts',
      ]);
    });

    it('reports a file where a directory is required', () => {
      const config: TFAFConfig = {
        faf: {
          locals: [{ foreignDomains: ['src/main.ts'], rootLayers: ['src'] }],
        },
      };
      expect(constraintsOf(config, inventory)[0]).toContain(
        'configuration/expected-directory'
      );
    });

    it('names the POSIX configuration base in a missing-path message', () => {
      const config: TFAFConfig = {
        faf: { locals: [{ rootLayers: ['missing'] }] },
      };
      const [outcome] = validateConfigReferences(
        config,
        createDeclarations([], 'C:\\project'),
        inventory
      );
      expect(outcome?.message).toContain('C:/project');
      expect(outcome?.normativeReference).toBe('D-14');
    });
  });

  describe("L'assenza di un nome potenziale non equivale a un riferimento puntuale inesistente", () => {
    it('admits absent category names, absent hierarchy child names, and an empty foreign family', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        {
          kind: 'directory',
          parentId: 0,
          path: 'src/_domain',
          treeOrigin: 'src',
        },
      ]);
      const config: TFAFConfig = {
        faf: {
          common: {
            foreignNodes: [{ paths: ['src'], patterns: ['*.md'] }],
            horizontalHierarchies: [[['_not-present']]],
            localHorizontalHierarchies: [
              { hierarchies: [['_also-absent']], paths: ['src/_domain'] },
            ],
            roles: [{ category: '_never-created', name: 'ghost' }],
          },
          locals: [localLayer('src')],
        },
      };
      expect(
        validateConfigReferences(config, createDeclarations(), inventory)
      ).toEqual([]);
    });

    it('still requires the punctual parent and family scope to exist', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              foreignNodes: [{ paths: ['src/missing'], patterns: ['*.md'] }],
              localHorizontalHierarchies: [
                { hierarchies: [['_types']], paths: ['src/gone'] },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].foreignNodes[0].paths[0]|configuration/non-existent-path|src/missing',
        'faf.locals[0].localHorizontalHierarchies[0].paths[0]|configuration/non-existent-path|src/gone',
      ]);
    });
  });

  describe('Enumerare Root Nodes e Root Fragments diretti senza deduzioni dai nomi', () => {
    it('requires a nested path to be a direct child relative to the codebase', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        { kind: 'directory', parentId: 0, path: 'src/app', treeOrigin: 'src' },
        {
          kind: 'directory',
          parentId: 1,
          path: 'src/app/routes',
          treeOrigin: 'src',
        },
        { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [['main.ts']],
                  subRootFragments: [
                    { path: 'src/app', rootNodes: [] },
                    { path: 'src/app/routes', rootNodes: [] },
                  ],
                },
              ],
            },
          ],
        },
      };
      const outcomes = validateConfigReferences(
        config,
        createDeclarations(),
        inventory
      );
      expect(outcomes).toEqual([
        expect.objectContaining({
          constraint: 'configuration/nested-root-fragment-not-direct-child',
          element: 'src/app/routes',
          propertyPath:
            'faf.locals[0].rootFragments[0].subRootFragments[1].path',
        }),
      ]);
    });

    it('rejects a nested directory whose inventory parent is not the declared parent', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        {
          kind: 'directory',
          parentId: null,
          path: 'src/app',
          treeOrigin: 'src',
        },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [],
                  subRootFragments: [{ path: 'src/app', rootNodes: [] }],
                },
              ],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)[0]).toContain(
        'configuration/nested-root-fragment-not-direct-child'
      );
    });

    it('accepts a root fragment at . and a direct child file name', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: '.', treeOrigin: '.' },
        { kind: 'file', parentId: 0, path: 'main.ts', treeOrigin: '.' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            { rootFragments: [{ path: '.', rootNodes: [['main.ts']] }] },
          ],
        },
      };
      expect(
        validateConfigReferences(config, createDeclarations(), inventory)
      ).toEqual([]);
    });
  });

  describe("Rifiutare dichiarazioni Root non coerenti con l'inventario", () => {
    it('un file enumerato in rootNodes che non esiste', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            { rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }] },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].rootFragments[0].rootNodes[0][0]|configuration/non-existent-path|src/main.ts',
      ]);
    });

    it('rejects a root node that exists but is not a direct child file', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        {
          kind: 'directory',
          parentId: 0,
          path: 'src/nested',
          treeOrigin: 'src',
        },
        { kind: 'file', parentId: 1, path: 'src/main.ts', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            { rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }] },
          ],
        },
      };
      expect(constraintsOf(config, inventory)[0]).toContain(
        'configuration/root-node-not-direct-child'
      );
    });

    it('rejects a nested path that does not start with the parent prefix', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        { kind: 'directory', parentId: null, path: 'lib', treeOrigin: 'lib' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              rootFragments: [
                {
                  path: 'src',
                  rootNodes: [],
                  subRootFragments: [{ path: 'lib', rootNodes: [] }],
                },
              ],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)[0]).toContain(
        'configuration/nested-root-fragment-not-direct-child'
      );
    });

    it('rejects a root node name that identifies a directory', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        { kind: 'directory', parentId: 0, path: 'src/app', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [{ rootFragments: [{ path: 'src', rootNodes: [['app']] }] }],
        },
      };
      expect(constraintsOf(config, inventory)[0]).toContain(
        'configuration/expected-file'
      );
    });

    it("un'origine è designata Foreign Domain", () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [{ foreignDomains: ['src'], rootLayers: ['src'] }],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].foreignDomains[0]|configuration/origin-designated-foreign-domain|src',
      ]);
    });

    it('dependencyEdges.from non identifica un Root Node corrente', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
        { kind: 'directory', parentId: 0, path: 'src/app', treeOrigin: 'src' },
        {
          kind: 'file',
          parentId: 2,
          path: 'src/app/page.tsx',
          treeOrigin: 'src',
        },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              rootFragments: [
                {
                  dependencyEdges: [
                    { from: ['other.ts'], to: ['src/app/page.tsx'] },
                  ],
                  path: 'src',
                  rootNodes: [['main.ts']],
                  subRootFragments: [
                    { path: 'src/app', rootNodes: [['page.tsx']] },
                  ],
                },
              ],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].rootFragments[0].dependencyEdges[0].from[0]|configuration/invalid-root-dependency-from|other.ts',
      ]);
    });

    it('dependencyEdges.to non identifica un Root Node enumerato', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
        { kind: 'file', parentId: 0, path: 'src/extra.ts', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              rootFragments: [
                {
                  dependencyEdges: [
                    { from: ['main.ts'], to: ['src/extra.ts'] },
                  ],
                  path: 'src',
                  rootNodes: [['main.ts']],
                },
              ],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)[0]).toContain(
        'configuration/invalid-root-dependency-to'
      );
    });

    it('dependencyEdges.to identifica un Root Node dello stesso Root Fragment', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        { kind: 'file', parentId: 0, path: 'src/a.ts', treeOrigin: 'src' },
        { kind: 'file', parentId: 0, path: 'src/b.ts', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              rootFragments: [
                {
                  dependencyEdges: [{ from: ['a.ts'], to: ['src/b.ts'] }],
                  path: 'src',
                  rootNodes: [['a.ts'], ['b.ts']],
                },
              ],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].rootFragments[0].dependencyEdges[0].to[0]|configuration/root-dependency-same-fragment|src/b.ts',
      ]);
    });

    it('dependencyEdges.to identifica un Root Node di un altro Tree', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
        { kind: 'directory', parentId: null, path: 'lib', treeOrigin: 'lib' },
        { kind: 'file', parentId: 2, path: 'lib/index.ts', treeOrigin: 'lib' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              rootFragments: [
                {
                  dependencyEdges: [
                    { from: ['main.ts'], to: ['lib/index.ts'] },
                  ],
                  path: 'src',
                  rootNodes: [['main.ts']],
                },
              ],
            },
            { rootFragments: [{ path: 'lib', rootNodes: [['index.ts']] }] },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].rootFragments[0].dependencyEdges[0].to[0]|configuration/root-dependency-different-tree|lib/index.ts',
      ]);
    });

    it('rejects an origin that is a file or contained in another tree', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
        {
          kind: 'directory',
          parentId: 0,
          path: 'src/nested',
          treeOrigin: 'src',
        },
      ]);
      const fileOrigin: TFAFConfig = {
        faf: { locals: [{ rootLayers: ['src/main.ts'] }] },
      };
      const contained: TFAFConfig = {
        faf: { locals: [{ rootLayers: ['src/nested'] }] },
      };
      expect(constraintsOf(fileOrigin, inventory)[0]).toContain(
        'configuration/expected-directory'
      );
      expect(constraintsOf(contained, inventory)[0]).toContain(
        'configuration/origin-contained-in-other-tree'
      );
    });
  });

  describe('Rifiutare criteri Foreign fuori dalla grammatica documentata', () => {
    it('ambito puntuale inesistente', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              foreignNodes: [{ paths: ['src/missing'], patterns: ['*.md'] }],
              rootLayers: ['src'],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)[0]).toContain(
        'configuration/non-existent-path'
      );
    });

    it('ambito fuori dai Trees interessati', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        {
          kind: 'directory',
          parentId: null,
          path: 'outside',
          treeOrigin: null,
        },
        { kind: 'directory', parentId: null, path: 'lib', treeOrigin: 'lib' },
        { kind: 'directory', parentId: 2, path: 'lib/docs', treeOrigin: 'lib' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              foreignNodes: [
                { paths: ['outside', 'lib/docs'], patterns: ['*.md'] },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].foreignNodes[0].paths[0]|configuration/reference-outside-trees|outside',
        'faf.locals[0].foreignNodes[0].paths[1]|configuration/reference-outside-local-scope|lib/docs',
      ]);
    });
  });

  describe('Le selezioni Foreign si uniscono senza introdurre nuove classificazioni', () => {
    it('un file individuale deve essere un percorso letterale esistente', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        { kind: 'file', parentId: 0, path: 'src/notes.md', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              foreignNodes: ['src/notes.md', 'src/missing.md'],
              rootLayers: ['src'],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].foreignNodes[1]|configuration/non-existent-path|src/missing.md',
      ]);
    });
  });

  describe('Le proprietà di frontiera selezionano nodi e relazioni senza derogare alla struttura', () => {
    const inventory = createInventory([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      { kind: 'directory', parentId: 0, path: 'src/app', treeOrigin: 'src' },
      { kind: 'file', parentId: 1, path: 'src/app/app.tsx', treeOrigin: 'src' },
      { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
      { kind: 'directory', parentId: null, path: 'lib', treeOrigin: 'lib' },
      { kind: 'file', parentId: 4, path: 'lib/index.ts', treeOrigin: 'lib' },
      {
        kind: 'file',
        parentId: null,
        path: 'legacy/client.ts',
        treeOrigin: null,
      },
      { kind: 'directory', parentId: null, path: 'legacy', treeOrigin: null },
      { kind: 'directory', parentId: null, path: 'other', treeOrigin: 'other' },
      { kind: 'directory', parentId: 0, path: 'src/nested', treeOrigin: 'src' },
    ]);
    const rooted: TFAFConfig = {
      faf: {
        locals: [
          {
            rootFragments: [
              {
                path: 'src',
                rootNodes: [['main.ts']],
                subRootFragments: [
                  { path: 'src/app', rootNodes: [['app.tsx']] },
                ],
              },
            ],
          },
          { rootFragments: [{ path: 'lib', rootNodes: [['index.ts']] }] },
        ],
      },
    };

    it('accepts an enumerated nested root node and rejects a directory, a missing file, and a non-root file', () => {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              ...rooted.faf.locals[0],
              publicRootNodes: [
                'src/app/app.tsx',
                'src',
                'src/missing.ts',
                'src/main.ts',
              ],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].publicRootNodes[1]|configuration/expected-file|src',
        'faf.locals[0].publicRootNodes[2]|configuration/non-existent-path|src/missing.ts',
      ]);
    });

    it('rejects an existing file that is not an enumerated root node', () => {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              publicRootNodes: ['src/extra.ts'],
              rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
            },
          ],
        },
      };
      const withExtra = createInventory([
        ...inventory.items.map((item) => ({
          kind: item.kind,
          parentId: item.parentId,
          path: item.path,
          treeOrigin: item.treeOrigin,
        })),
        { kind: 'file', parentId: 0, path: 'src/extra.ts', treeOrigin: 'src' },
      ]);
      expect(constraintsOf(config, withExtra)).toEqual([
        'faf.locals[0].publicRootNodes[0]|configuration/public-root-node-not-enumerated|src/extra.ts',
      ]);
    });

    it('rejects a non-empty publicRootNodes list on a root-layer-only local and admits an empty list', () => {
      const rejected: TFAFConfig = {
        faf: {
          locals: [{ publicRootNodes: ['src/main.ts'], rootLayers: ['src'] }],
        },
      };
      const admitted: TFAFConfig = {
        faf: { locals: [{ publicRootNodes: [], rootLayers: ['src'] }] },
      };
      expect(constraintsOf(rejected, inventory)).toEqual([
        'faf.locals[0].publicRootNodes[0]|configuration/public-root-nodes-in-root-layer-tree|src/main.ts',
      ]);
      expect(
        validateConfigReferences(admitted, createDeclarations(), inventory)
      ).toEqual([]);
    });

    it('accepts tree dependency targets of another configuration and rejects nested fragments, self pairs, and unknown origins', () => {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              ...rooted.faf.locals[0],
              treeDependencies: [
                { from: ['src'], to: ['other', 'src', 'src/app', 'missing'] },
              ],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].treeDependencies[0].to[1]|configuration/tree-dependency-self|src',
        'faf.locals[0].treeDependencies[0].to[2]|configuration/tree-dependency-not-tree-origin|src/app',
        'faf.locals[0].treeDependencies[0].to[3]|configuration/non-existent-path|missing',
      ]);
    });

    it('rejects a tree dependency source outside the local scope or that is a file', () => {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              rootLayers: ['src'],
              treeDependencies: [
                { from: ['lib', 'src/main.ts'], to: ['other'] },
              ],
            },
            { rootLayers: ['lib'] },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].treeDependencies[0].from[0]|configuration/tree-dependency-from-outside-scope|lib',
        'faf.locals[0].treeDependencies[0].from[1]|configuration/expected-directory|src/main.ts',
      ]);
    });

    it('rejects a tree dependency source that is not an origin of this configuration', () => {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              rootLayers: ['src'],
              treeDependencies: [{ from: ['other'], to: ['src'] }],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].treeDependencies[0].from[0]|configuration/tree-dependency-not-tree-origin|other',
      ]);
    });

    it('rejects external selectors that are directories, out of scope, libraries, aliases, or inside a tree', () => {
      const declarations = createDeclarations();
      const withAlias: TEffectiveDeclarations = {
        ...declarations,
        aliases: [
          { prefix: '#shared', source: 'common.aliases', targets: ['src'] },
        ],
      };
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              externalDependencies: [
                {
                  from: ['src', 'legacy/client.ts', 'lib/index.ts'],
                  to: [
                    'legacy',
                    'src/main.ts',
                    'node_modules/react/index.js',
                    '#shared/file.ts',
                    'legacy/missing.ts',
                  ],
                },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory, withAlias)).toEqual([
        'faf.locals[0].externalDependencies[0].from[0]|configuration/expected-file|src',
        'faf.locals[0].externalDependencies[0].from[1]|configuration/reference-outside-trees|legacy/client.ts',
        'faf.locals[0].externalDependencies[0].from[2]|configuration/reference-outside-local-scope|lib/index.ts',
        'faf.locals[0].externalDependencies[0].to[0]|configuration/expected-file|legacy',
        'faf.locals[0].externalDependencies[0].to[1]|configuration/external-dependency-to-inside-tree|src/main.ts',
        'faf.locals[0].externalDependencies[0].to[2]|configuration/external-dependency-to-library|node_modules/react/index.js',
        'faf.locals[0].externalDependencies[0].to[3]|configuration/external-dependency-to-alias|#shared/file.ts',
        'faf.locals[0].externalDependencies[0].to[4]|configuration/non-existent-path|legacy/missing.ts',
      ]);
    });

    it('accepts an exact external file pair', () => {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              externalDependencies: [
                { from: ['src/main.ts'], to: ['legacy/client.ts'] },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      expect(
        validateConfigReferences(config, createDeclarations(), inventory)
      ).toEqual([]);
    });
  });

  describe('I riferimenti comuni si filtrano per appartenenza senza ribasare i percorsi', () => {
    it('accepts a common root node of app and does not require lib/app/main.ts', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'app', treeOrigin: 'app' },
        { kind: 'file', parentId: 0, path: 'app/main.ts', treeOrigin: 'app' },
        { kind: 'directory', parentId: null, path: 'lib', treeOrigin: 'lib' },
        { kind: 'directory', parentId: 2, path: 'lib/docs', treeOrigin: 'lib' },
      ]);
      const config: TFAFConfig = {
        faf: {
          common: {
            foreignNodes: [
              { paths: ['app'], patterns: ['*.md'] },
              { paths: ['lib'], patterns: ['*.md'] },
            ],
            publicRootNodes: ['app/main.ts'],
          },
          locals: [
            { rootFragments: [{ path: 'app', rootNodes: [['main.ts']] }] },
            localLayer('lib'),
          ],
        },
      };
      expect(
        validateConfigReferences(config, createDeclarations(), inventory)
      ).toEqual([]);
    });

    it('reports a common file that exists only in another configuration tree', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'app', treeOrigin: 'app' },
        {
          kind: 'directory',
          parentId: null,
          path: 'foreign-config',
          treeOrigin: 'foreign-config',
        },
        {
          kind: 'file',
          parentId: 1,
          path: 'foreign-config/readme.md',
          treeOrigin: 'foreign-config',
        },
      ]);
      const config: TFAFConfig = {
        faf: {
          common: { foreignNodes: ['foreign-config/readme.md'] },
          locals: [localLayer('app')],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.common.foreignNodes[0]|configuration/reference-outside-trees|foreign-config/readme.md',
      ]);
    });

    it('reports a common reference missing from the overall inventory', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'app', treeOrigin: 'app' },
        { kind: 'directory', parentId: null, path: 'lib', treeOrigin: 'lib' },
      ]);
      const config: TFAFConfig = {
        faf: {
          common: { publicRootNodes: ['app/missing.ts'] },
          locals: [localLayer('app'), localLayer('lib')],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.common.publicRootNodes[0]|configuration/non-existent-path|app/missing.ts',
      ]);
    });

    it('uses a tree present only in effective declarations when filtering common references', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'app', treeOrigin: 'app' },
        {
          kind: 'directory',
          parentId: null,
          path: 'vendor',
          treeOrigin: 'vendor',
        },
        {
          kind: 'directory',
          parentId: 1,
          path: 'vendor/tools',
          treeOrigin: 'vendor',
        },
      ]);
      const config: TFAFConfig = {
        faf: {
          common: { foreignDomains: ['vendor/tools'] },
          locals: [localLayer('app')],
        },
      };
      const withoutTree = validateConfigReferences(
        config,
        createDeclarations(),
        inventory
      );
      const withTree = validateConfigReferences(
        config,
        createDeclarations([createTree('app'), createTree('vendor')]),
        inventory
      );
      expect(withoutTree.map((outcome) => outcome.constraint)).toEqual([
        'configuration/reference-outside-trees',
      ]);
      expect(withTree).toEqual([]);
    });
  });

  describe("Un riferimento locale non può classificare i Trees di un'altra configurazione", () => {
    it('rejects a local classification path or source that belongs to another local tree', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'app', treeOrigin: 'app' },
        { kind: 'file', parentId: 0, path: 'app/main.ts', treeOrigin: 'app' },
        { kind: 'directory', parentId: null, path: 'lib', treeOrigin: 'lib' },
        { kind: 'directory', parentId: 2, path: 'lib/docs', treeOrigin: 'lib' },
        { kind: 'file', parentId: 2, path: 'lib/index.ts', treeOrigin: 'lib' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              foreignDomains: ['lib/docs'],
              publicRootNodes: ['lib/index.ts'],
              rootFragments: [{ path: 'app', rootNodes: [['main.ts']] }],
              treeDependencies: [{ from: ['app'], to: ['lib'] }],
            },
            { rootFragments: [{ path: 'lib', rootNodes: [['index.ts']] }] },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].foreignDomains[0]|configuration/reference-outside-local-scope|lib/docs',
        'faf.locals[0].publicRootNodes[0]|configuration/reference-outside-local-scope|lib/index.ts',
      ]);
    });
  });

  describe('Rifiutare designazioni mimetiche non univoche o non ammissibili', () => {
    it('due dichiarazioni sullo stesso path anche con azioni uguali', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        {
          kind: 'directory',
          parentId: 0,
          path: 'src/_apis',
          treeOrigin: 'src',
        },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              mimeticPathStructures: [
                { actions: ['get'], paths: ['src/_apis'] },
                { actions: ['get'], paths: ['src/_apis'] },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.locals[0].mimeticPathStructures[1].paths[0]|configuration/duplicate-mimetic-path|src/_apis',
      ]);
    });

    it('does not treat a local replacement of the same common path as a second declaration', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        {
          kind: 'directory',
          parentId: 0,
          path: 'src/_apis',
          treeOrigin: 'src',
        },
      ]);
      const config: TFAFConfig = {
        faf: {
          common: { mimeticPathStructures: [{ paths: ['src/_apis'] }] },
          locals: [
            {
              mimeticPathStructures: [{ paths: ['src/_apis'] }],
              rootLayers: ['src'],
            },
          ],
        },
      };
      expect(
        validateConfigReferences(config, createDeclarations(), inventory)
      ).toEqual([]);
    });

    it('reports a missing common hierarchy directory on the common property path', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          common: {
            localHorizontalHierarchies: [
              { hierarchies: [['_types']], paths: ['src/missing'] },
            ],
          },
          locals: [localLayer('src')],
        },
      };
      expect(constraintsOf(config, inventory)).toEqual([
        'faf.common.localHorizontalHierarchies[0].paths[0]|configuration/non-existent-path|src/missing',
      ]);
    });

    it('reports a mimetic or hierarchy path that is a file', () => {
      const inventory = createInventory([
        { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
        { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
      ]);
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              localHorizontalHierarchies: [
                { hierarchies: [['_types']], paths: ['src/main.ts'] },
              ],
              mimeticPathStructures: [{ paths: ['src/main.ts'] }],
              rootLayers: ['src'],
            },
          ],
        },
      };
      expect(
        constraintsOf(config, inventory).every((entry) =>
          entry.includes('expected-directory')
        )
      ).toBe(true);
    });
  });

  it('names a missing root fragment path on the path property', () => {
    const inventory = createInventory([]);
    const config: TFAFConfig = {
      faf: {
        locals: [{ rootFragments: [{ path: 'src', rootNodes: [] }] }],
      },
    };
    expect(constraintsOf(config, inventory)).toEqual([
      'faf.locals[0].rootFragments[0].path|configuration/non-existent-path|src',
    ]);
  });

  it('accepts an origin whose inventory tree is not yet assigned', () => {
    const inventory = createInventory([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: null },
    ]);
    const config: TFAFConfig = {
      faf: { locals: [localLayer('src')] },
    };
    expect(
      validateConfigReferences(config, createDeclarations(), inventory)
    ).toEqual([]);
  });

  it('reports a dangling inventory id as the wrong physical kind', () => {
    const inventory = createInventory([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
      {
        kind: 'file',
        parentId: null,
        path: 'legacy/client.ts',
        treeOrigin: null,
      },
    ]);
    const pathToId = new Map(inventory.pathToId);
    pathToId.set('src/ghost-dir', 9);
    pathToId.set('src/ghost-file', 9);
    pathToId.set('src/ghost-public', 9);
    pathToId.set('ghost-origin', 9);
    pathToId.set('ghost-tree', 9);
    pathToId.set('ghost-external', 9);
    const dangling = { ...inventory, pathToId };
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            externalDependencies: [
              { from: ['src/main.ts'], to: ['ghost-external'] },
            ],
            foreignDomains: ['src/ghost-dir'],
            foreignNodes: ['src/ghost-file'],
            publicRootNodes: ['src/ghost-public'],
            rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
            treeDependencies: [{ from: ['src'], to: ['ghost-tree'] }],
          },
          { rootLayers: ['ghost-origin'] },
        ],
      },
    };
    expect(constraintsOf(config, dangling)).toEqual([
      'faf.locals[0].externalDependencies[0].to[0]|configuration/expected-file|ghost-external',
      'faf.locals[0].foreignDomains[0]|configuration/expected-directory|src/ghost-dir',
      'faf.locals[0].foreignNodes[0]|configuration/expected-file|src/ghost-file',
      'faf.locals[0].publicRootNodes[0]|configuration/expected-file|src/ghost-public',
      'faf.locals[0].treeDependencies[0].to[0]|configuration/expected-directory|ghost-tree',
      'faf.locals[1].rootLayers[0]|configuration/expected-directory|ghost-origin',
    ]);
  });

  it('accepts common tree and external references that belong to this configuration', () => {
    const inventory = createInventory([
      { kind: 'directory', parentId: null, path: 'app', treeOrigin: 'app' },
      { kind: 'directory', parentId: 0, path: 'app/docs', treeOrigin: 'app' },
      { kind: 'file', parentId: 0, path: 'app/main.ts', treeOrigin: 'app' },
      { kind: 'directory', parentId: null, path: 'lib', treeOrigin: 'lib' },
      {
        kind: 'file',
        parentId: null,
        path: 'legacy/client.ts',
        treeOrigin: null,
      },
    ]);
    const config: TFAFConfig = {
      faf: {
        common: {
          externalDependencies: [
            { from: ['app/main.ts'], to: ['legacy/client.ts'] },
          ],
          foreignDomains: ['app/docs'],
          treeDependencies: [{ from: ['app'], to: ['lib'] }],
        },
        locals: [
          { rootFragments: [{ path: 'app', rootNodes: [['main.ts']] }] },
          localLayer('lib'),
        ],
      },
    };
    expect(
      validateConfigReferences(config, createDeclarations(), inventory)
    ).toEqual([]);
  });

  it('rejects a common reference that exists only outside this configuration trees', () => {
    const inventory = createInventory([
      { kind: 'directory', parentId: null, path: 'app', treeOrigin: 'app' },
      {
        kind: 'directory',
        parentId: null,
        path: 'foreign-config',
        treeOrigin: 'foreign-config',
      },
      {
        kind: 'directory',
        parentId: 1,
        path: 'foreign-config/docs',
        treeOrigin: 'foreign-config',
      },
    ]);
    const config: TFAFConfig = {
      faf: {
        common: { foreignDomains: ['foreign-config/docs'] },
        locals: [localLayer('app')],
      },
    };
    expect(constraintsOf(config, inventory)).toEqual([
      'faf.common.foreignDomains[0]|configuration/reference-outside-trees|foreign-config/docs',
    ]);
  });

  it('validates common aliases references against the inventory', () => {
    const inventory = createInventory([
      { kind: 'directory', parentId: null, path: 'src', treeOrigin: 'src' },
      {
        kind: 'directory',
        parentId: 0,
        path: 'src/_shared',
        treeOrigin: 'src',
      },
      { kind: 'file', parentId: 0, path: 'src/main.ts', treeOrigin: 'src' },
    ]);
    const validConfig: TFAFConfig = {
      faf: {
        common: {
          aliases: {
            '#shared': 'src/_shared',
          },
        },
        locals: [localLayer('src')],
      },
    };
    expect(constraintsOf(validConfig, inventory)).toEqual([]);

    const invalidConfig: TFAFConfig = {
      faf: {
        common: {
          aliases: {
            '#file': 'src/main.ts',
            '#missing': 'src/missing',
          },
        },
        locals: [localLayer('src')],
      },
    };
    expect(constraintsOf(invalidConfig, inventory)).toEqual([
      'faf.common.aliases.#file|configuration/expected-directory|src/main.ts',
      'faf.common.aliases.#missing|configuration/non-existent-path|src/missing',
    ]);
  });
});
