import { describe, expect, it } from 'vitest';

import type { TFAFRole } from '../../../../_src@shared/_types/faf-config.type.js';
import type {
  TEffectiveCatalog,
  TEffectiveTree,
  TInventory,
  TRawInventoryEntry,
  TRoleAttribution,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_conformity@shared/_utils/compare-ordinal/index.js';
import { inventoryFromEntries } from './_classify-taxonomy@shared/_mocks/inventory-from-entries.mock.js';
import { classifyTaxonomy } from './classify-taxonomy.stage.js';
import { compareConfigOutcomes } from './classify-taxonomy.util.js';

const DOT = '.';

const sortText = (values: readonly string[]): string[] => {
  const copy = [...values];
  copy.sort(compareOrdinal);
  return copy;
};

const catalogOf = (
  roles: readonly (readonly TFAFRole[] | TFAFRole)[],
  subGraphRoles: readonly string[] = ['spec', 'story']
): TEffectiveCatalog => {
  const effectiveRoles = roles.flatMap((tier, rank) => {
    const tierRoles = 'category' in tier ? [tier] : tier;
    return tierRoles.map((role) => ({
      allowMultipleSymbols: role.allowMultipleSymbols === true,
      category: role.category,
      form:
        role.isCategoryNode === true ||
        role.implicitRoleExtensions !== undefined
          ? ('category-nodes' as const)
          : ('fragments' as const),
      implicitExtensions: role.implicitRoleExtensions ?? [],
      name: role.name,
      rank,
    }));
  });
  return {
    categoryToRole: new Map(
      effectiveRoles.map((role) => [role.category, role])
    ),
    extensionToRole: new Map(
      effectiveRoles.flatMap((role) =>
        role.implicitExtensions.map((extension) => [extension, role])
      )
    ),
    roles: effectiveRoles,
    subGraphRoles,
    topRank: roles.length,
  };
};

const standardCatalog = catalogOf([
  { category: '_components', name: 'component' },
  { category: '_hooks', name: 'hook' },
  { category: '_utils', name: 'util' },
  { category: '_types', isCategoryNode: true, name: 'type' },
  { category: '_styles', implicitRoleExtensions: ['.css'], name: 'style' },
  { category: '_fonts', implicitRoleExtensions: ['.woff2'], name: 'font' },
  { category: '_apis', name: 'api' },
  { category: '_pages', name: 'page' },
  { category: '_contexts', name: 'context' },
  { category: '_recipes', name: 'recipe' },
  { category: '_configs', name: 'config' },
]);

const treeOf = (
  originPath: string,
  overrides: Partial<TEffectiveTree> = {}
): TEffectiveTree => ({
  catalog: overrides.catalog ?? standardCatalog,
  externalDependencyPairs: overrides.externalDependencyPairs ?? [],
  foreignDomains: overrides.foreignDomains ?? [],
  foreignNodes: overrides.foreignNodes ?? {
    families: [],
    individualPaths: [],
  },
  horizontalHierarchies: [],
  horizontalHierarchyModels: [],
  mimeticPathStructures: overrides.mimeticPathStructures ?? [],
  originKind: overrides.originKind ?? 'root-fragment',
  originPath,
  publicRootNodes: overrides.publicRootNodes ?? [],
  rootFragments: overrides.rootFragments ?? [
    {
      dependencyPairs: [],
      path: originPath,
      rootNodes: [],
      subRootFragments: [],
    },
  ],
  treeDependencyPairs: [],
});

const entry = (
  path: string,
  kind: 'directory' | 'file'
): TRawInventoryEntry => ({
  isSymlink: false,
  kind,
  path,
  realPath: path,
});

const withDirectories = (
  paths: readonly string[]
): readonly TRawInventoryEntry[] => {
  const directories = new Set<string>();
  const files: TRawInventoryEntry[] = [];
  for (const path of paths) {
    const segments = path.split('/');
    const isFile = segments.at(-1)?.includes(DOT) === true;
    const directorySegments = isFile ? segments.slice(0, -1) : segments;
    for (let index = 1; index <= directorySegments.length; index += 1) {
      directories.add(directorySegments.slice(0, index).join('/'));
    }
    if (isFile) {
      files.push(entry(path, 'file'));
    }
  }
  return [
    ...sortText([...directories]).map((path) => entry(path, 'directory')),
    ...files,
  ];
};

const classify = (
  paths: readonly string[],
  trees: readonly TEffectiveTree[]
) => {
  const origins = trees.map((tree) => tree.originPath);
  const inventory = inventoryFromEntries(withDirectories(paths), origins);
  return classifyTaxonomy({
    declarations: {
      aliases: [],
      baseDirectory: '/repo',
      trees,
    },
    inventory,
  });
};

const projectClassification = (result: ReturnType<typeof classifyTaxonomy>) => {
  const projected = [];
  const paths = sortText(
    [...result.model.byPath].map(([itemPath]) => itemPath)
  );
  for (const path of paths) {
    const classification = result.model.byPath.get(path);
    if (classification !== undefined) {
      projected.push({
        domainKind: classification.domainKind,
        nodeKind: classification.nodeKind,
        path,
        qualifications: classification.relationalQualifications,
        rank: classification.fragmentInternalRank,
        role: classification.role,
      });
    }
  }
  return projected;
};

const kindOf = (
  result: ReturnType<typeof classify>,
  path: string
): {
  domainKind: null | string;
  nodeKind: null | string;
  role: TRoleAttribution;
} => {
  const classification = result.model.byPath.get(path);
  expect(classification).toBeDefined();
  return {
    domainKind: classification?.domainKind ?? null,
    nodeKind: classification?.nodeKind ?? null,
    role: classification?.role ?? { kind: 'absent', roleName: null },
  };
};

describe('classifyTaxonomy', () => {
  it('omits files outside every tree and does not emit outcomes for them', () => {
    const built = inventoryFromEntries(
      [entry('src', 'directory'), entry('src/main.ts', 'file')],
      ['src']
    );
    const outside: TInventory['items'][number] = {
      depth: 0,
      id: 99,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'scripts/Build.Tool.ts',
      preorderEnd: -1,
      preorderStart: -1,
      realPath: 'scripts/Build.Tool.ts',
      treeOrigin: null,
    };
    const inventory: TInventory = {
      items: [...built.items, outside],
      pathToId: new Map([...built.pathToId, ['scripts/Build.Tool.ts', 99]]),
      realPathToId: built.realPathToId,
    };
    const result = classifyTaxonomy({
      declarations: {
        aliases: [],
        baseDirectory: '/repo',
        trees: [
          treeOf('src', {
            rootFragments: [
              {
                dependencyPairs: [],
                path: 'src',
                rootNodes: [{ name: 'main.ts', rank: 0 }],
                subRootFragments: [],
              },
            ],
          }),
        ],
      },
      inventory,
    });
    expect(result.model.byPath.has('scripts/Build.Tool.ts')).toBe(false);
    expect(
      result.outcomes.some(
        (outcome) => outcome.element === 'scripts/Build.Tool.ts'
      )
    ).toBe(false);
  });

  describe('FAF perimeter consists of autonomous and disjoint Fractal Trees', () => {
    it('analyzes multiple independent Fractal Trees', () => {
      const clientCatalog = catalogOf([
        { category: '_components', name: 'widget' },
      ]);
      const serverCatalog = catalogOf([
        { category: '_components', name: 'handler' },
      ]);
      const result = classify(
        [
          'client/src/main.ts',
          'client/src/_components/button/button.widget.ts',
          'client/src/_components/button/index.ts',
          'server/src/_components/button/button.handler.ts',
          'server/src/_components/button/index.ts',
        ],
        [
          treeOf('client/src', {
            catalog: clientCatalog,
            rootFragments: [
              {
                dependencyPairs: [],
                path: 'client/src',
                rootNodes: [{ name: 'main.ts', rank: 0 }],
                subRootFragments: [],
              },
            ],
          }),
          treeOf('server/src', {
            catalog: serverCatalog,
            horizontalHierarchyModels: [],
            originKind: 'root-layer',
            rootFragments: [],
          }),
        ]
      );
      expect(kindOf(result, 'client/src').domainKind).toBe('root-fragment');
      expect(kindOf(result, 'server/src').domainKind).toBe('root-layer');
      expect(
        result.model.byPath.get('client/src/_components')?.imposedRoleName
      ).toBe('widget');
      expect(
        result.model.byPath.get('server/src/_components')?.imposedRoleName
      ).toBe('handler');
    });

    it('classifies a nested route as a Root Fragment of the same Fractal Tree, not a new origin', () => {
      const result = classify(
        ['app/page.tsx', 'app/blog/page.tsx', 'app/blog/article/page.tsx'],
        [
          treeOf('app', {
            rootFragments: [
              {
                dependencyPairs: [],
                path: 'app',
                rootNodes: [{ name: 'page.tsx', rank: 0 }],
                subRootFragments: [
                  {
                    dependencyPairs: [],
                    path: 'app/blog',
                    rootNodes: [{ name: 'page.tsx', rank: 0 }],
                    subRootFragments: [
                      {
                        dependencyPairs: [],
                        path: 'app/blog/article',
                        rootNodes: [{ name: 'page.tsx', rank: 0 }],
                        subRootFragments: [],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        ]
      );
      expect(kindOf(result, 'app').domainKind).toBe('root-fragment');
      expect(kindOf(result, 'app/blog').domainKind).toBe('root-fragment');
      expect(kindOf(result, 'app/blog/article').domainKind).toBe(
        'root-fragment'
      );
      expect(kindOf(result, 'app/blog/page.tsx').nodeKind).toBe('root-node');
    });

    it('requires a Root Fragment designation', () => {
      const result = classify(
        ['src/blog/page.tsx', 'src/blog/layout.tsx'],
        [
          treeOf('src', {
            rootFragments: [
              {
                dependencyPairs: [],
                path: 'src',
                rootNodes: [],
                subRootFragments: [],
              },
            ],
          }),
        ]
      );
      expect(kindOf(result, 'src/blog').domainKind).toBeNull();
      expect(kindOf(result, 'src/blog/page.tsx').nodeKind).not.toBe(
        'root-node'
      );
      expect(
        result.outcomes.some(
          (outcome) =>
            outcome.constraint === 'configuration/undeclared-sub-root-fragment'
        )
      ).toBe(true);
    });
  });

  describe('a file named after a Role retains its Root Node qualification', () => {
    it('classifies named root files as Root Nodes with absent Role and null rank', () => {
      const result = classify(
        [
          'src/app.component.tsx',
          'src/app.spec.tsx',
          'src/index.ts',
          'src/main.css',
        ],
        [
          treeOf('src', {
            rootFragments: [
              {
                dependencyPairs: [],
                path: 'src',
                rootNodes: [
                  { name: 'app.component.tsx', rank: 0 },
                  { name: 'app.spec.tsx', rank: 0 },
                  { name: 'index.ts', rank: 0 },
                  { name: 'main.css', rank: 0 },
                ],
                subRootFragments: [],
              },
            ],
          }),
        ]
      );
      for (const path of [
        'src/app.component.tsx',
        'src/app.spec.tsx',
        'src/index.ts',
        'src/main.css',
      ]) {
        const classification = result.model.byPath.get(path);
        expect(classification?.nodeKind).toBe('root-node');
        expect(classification?.role).toEqual({
          kind: 'absent',
          roleName: null,
        });
        expect(classification?.fragmentInternalRank).toBeNull();
      }
    });
  });

  describe('restricts implicit Roles to Asset Category Nodes', () => {
    it.each([
      [
        'theme.css',
        'src/_styles/theme.css',
        'category-node',
        'implicit',
        'style',
      ],
      [
        'theme.css',
        'src/_styles/_tokens/theme.css',
        'category-node',
        'implicit',
        'style',
      ],
      [
        'theme.css',
        'src/_fonts/theme.css',
        'unauthorized-logical-node',
        'implicit',
        'style',
      ],
      [
        'theme.css',
        'src/_components/button/theme.css',
        'unauthorized-logical-node',
        'implicit',
        'style',
      ],
      ['main.css', 'src/main.css', 'root-node', 'absent', null],
    ] as const)(
      '%s in %s produces %s',
      (_file, path, nodeKind, roleKind, roleName) => {
        const result = classify(
          [
            'src/main.css',
            'src/_styles/theme.css',
            'src/_styles/_tokens/theme.css',
            'src/_fonts/theme.css',
            'src/_components/button/button.component.tsx',
            'src/_components/button/index.ts',
            'src/_components/button/theme.css',
          ],
          [
            treeOf('src', {
              rootFragments: [
                {
                  dependencyPairs: [],
                  path: 'src',
                  rootNodes: [{ name: 'main.css', rank: 0 }],
                  subRootFragments: [],
                },
              ],
            }),
          ]
        );
        const classification = result.model.byPath.get(path);
        expect(classification?.nodeKind).toBe(nodeKind);
        expect(classification?.role.kind).toBe(roleKind);
        expect(classification?.role.roleName).toBe(roleName);
      }
    );
  });

  describe('derives the Master Node from classification without separate per-Fragment choice', () => {
    it.each([
      ['src/_components/button/button.component.tsx', 'component'],
      ['src/_components/button/_utils/normalize/normalize.util.ts', 'util'],
      ['src/_components/_atoms/button/button.component.tsx', 'component'],
      [
        'src/_components/_atoms/_controls/button/button.component.tsx',
        'component',
      ],
      ['src/_pages/home/home.page.tsx', 'page'],
      ['src/_apis/_todos/get-todos/get-todos.api.ts', 'api'],
      ['src/_apis/_todos/_[todo-id]/get-todo/get-todo.api.ts', 'api'],
    ])('%s is the Master for %s', (path, roleName) => {
      const result = classify(
        [
          'src/_components/button/button.component.tsx',
          'src/_components/button/index.ts',
          'src/_components/button/_utils/normalize/normalize.util.ts',
          'src/_components/button/_utils/normalize/index.ts',
          'src/_components/_atoms/button/button.component.tsx',
          'src/_components/_atoms/button/index.ts',
          'src/_components/_atoms/_controls/button/button.component.tsx',
          'src/_components/_atoms/_controls/button/index.ts',
          'src/_pages/home/home.page.tsx',
          'src/_pages/home/index.ts',
          'src/_apis/_todos/get-todos/get-todos.api.ts',
          'src/_apis/_todos/get-todos/index.ts',
          'src/_apis/_todos/_[todo-id]/get-todo/get-todo.api.ts',
          'src/_apis/_todos/_[todo-id]/get-todo/index.ts',
        ],
        [
          treeOf('src', {
            horizontalHierarchyModels: [],
            mimeticPathStructures: [
              { actions: null, paths: ['src/_pages'] },
              { actions: ['get'], paths: ['src/_apis'] },
            ],
            originKind: 'root-layer',
            rootFragments: [],
          }),
        ]
      );
      const classification = result.model.byPath.get(path);
      expect(classification?.nodeKind).toBe('master-node');
      expect(classification?.role).toEqual({ kind: 'explicit', roleName });
      expect(classification?.imposedRoleName).toBe(roleName);
      if (path.includes('_controls')) {
        expect(
          result.model.byPath.get('src/_components/_atoms/_controls')
            ?.domainKind
        ).toBe('sub-category');
      }
    });
  });

  it('does not inherit the Parent Fragment Role when classifying a Sub-Fragment', () => {
    const result = classify(
      [
        'src/_components/button/button.component.tsx',
        'src/_components/button/index.ts',
        'src/_components/button/_utils/normalize/normalize.util.ts',
        'src/_components/button/_utils/normalize/normalize.type.ts',
        'src/_components/button/_utils/normalize/index.ts',
      ],
      [treeOf('src', { originKind: 'root-layer', rootFragments: [] })]
    );
    expect(
      result.model.byPath.get(
        'src/_components/button/_utils/normalize/normalize.util.ts'
      )?.nodeKind
    ).toBe('master-node');
    expect(
      result.model.byPath.get('src/_components/button/_utils/normalize')
        ?.imposedRoleName
    ).toBe('util');
  });

  it('recognizes the complete anatomy of a Fragment', () => {
    const result = classify(
      [
        'src/_components/button/button.component.tsx',
        'src/_components/button/button.hook.ts',
        'src/_components/button/button.type.ts',
        'src/_components/button/button.module.css',
        'src/_components/button/button.spec.tsx',
        'src/_components/button/button.story.tsx',
        'src/_components/button/index.ts',
        'src/_components/button/README.md',
      ],
      [
        treeOf('src', {
          foreignNodes: {
            families: [{ paths: ['src'], patterns: ['*.md'] }],
            individualPaths: [],
          },
          horizontalHierarchyModels: [],
          originKind: 'root-layer',
          rootFragments: [],
        }),
      ]
    );
    expect(
      result.model.byPath.get('src/_components/button')?.imposedRoleName
    ).toBe('component');
    expect(
      kindOf(result, 'src/_components/button/button.component.tsx').nodeKind
    ).toBe('master-node');
    expect(
      kindOf(result, 'src/_components/button/button.hook.ts').nodeKind
    ).toBe('fragment-node');
    expect(
      kindOf(result, 'src/_components/button/button.type.ts').nodeKind
    ).toBe('fragment-node');
    expect(
      kindOf(result, 'src/_components/button/button.spec.tsx').nodeKind
    ).toBe('sub-graph-node');
    expect(kindOf(result, 'src/_components/button/index.ts').nodeKind).toBe(
      'access-node'
    );
    expect(kindOf(result, 'src/_components/button/README.md').nodeKind).toBe(
      'foreign-node'
    );
    expect(
      result.model.byPath.get('src/_components/button/index.ts')
        ?.fragmentInternalRank
    ).toBe(standardCatalog.topRank);
  });

  it('computes Sub-Fragment relation without conflating it with the direct container', () => {
    const result = classify(
      [
        'src/_components/a/a.component.tsx',
        'src/_components/a/index.ts',
        'src/_components/a/_components/b/b.component.tsx',
        'src/_components/a/_components/b/index.ts',
        'src/_components/a/_components/b/_utils/c/c.util.ts',
        'src/_components/a/_components/b/_utils/c/index.ts',
      ],
      [treeOf('src', { originKind: 'root-layer', rootFragments: [] })]
    );
    const fragmentB = result.model.byPath.get(
      'src/_components/a/_components/b'
    );
    const fragmentC = result.model.byPath.get(
      'src/_components/a/_components/b/_utils/c'
    );
    expect(fragmentB?.relationalQualifications.isSubFragment).toBe(true);
    expect(fragmentB?.relationalQualifications.parentFragmentPath).toBe(
      'src/_components/a'
    );
    expect(fragmentC?.relationalQualifications.parentFragmentPath).toBe(
      'src/_components/a/_components/b'
    );
    expect(fragmentC?.relationalQualifications.parentFragmentPath).not.toBe(
      'src/_components/a'
    );
  });

  it('does not treat the name _tooling alone as a Foreign designation', () => {
    const result = classify(
      ['src/_tooling/setup.ts', 'src/_components/button/_tooling/setup.ts'],
      [treeOf('src', { originKind: 'root-layer', rootFragments: [] })]
    );
    expect(kindOf(result, 'src/_tooling').domainKind).toBe('layer');
    expect(kindOf(result, 'src/_tooling/setup.ts').nodeKind).not.toBe(
      'foreign-node'
    );
    expect(
      kindOf(result, 'src/_components/button/_tooling').domainKind
    ).toBeNull();
  });

  it('prioritizes a punctual Foreign Domain over a Category name', () => {
    const result = classify(
      [
        'src/_configs/secret.ts',
        'src/_components/_configs/local.config.ts',
        'src/_components/_configs/index.ts',
      ],
      [
        treeOf('src', {
          foreignDomains: ['src/_configs'],
          horizontalHierarchyModels: [],
          mimeticPathStructures: [{ actions: null, paths: ['src/_configs'] }],
          originKind: 'root-layer',
          rootFragments: [],
        }),
      ]
    );
    expect(kindOf(result, 'src/_configs').domainKind).toBe('foreign-domain');
    expect(kindOf(result, 'src/_configs/secret.ts').nodeKind).toBe(
      'foreign-node'
    );
    expect(kindOf(result, 'src/_components/_configs').domainKind).toBe(
      'category'
    );
    expect(
      result.outcomes.some(
        (outcome) =>
          outcome.constraint ===
            'configuration/incompatible-mimetic-designation' &&
          outcome.element === 'src/_configs'
      )
    ).toBe(true);
  });

  it('prioritizes the mimetic segment over the nominal Category association', () => {
    const result = classify(
      [
        'src/_apis/_pages/get-pages/get-pages.api.ts',
        'src/_apis/_pages/get-pages/index.ts',
      ],
      [
        treeOf('src', {
          horizontalHierarchyModels: [],
          mimeticPathStructures: [{ actions: ['get'], paths: ['src/_apis'] }],
          originKind: 'root-layer',
          rootFragments: [],
        }),
      ]
    );
    expect(kindOf(result, 'src/_apis/_pages').domainKind).toBe(
      'path-sub-category'
    );
    expect(result.model.byPath.get('src/_apis/_pages')?.imposedRoleName).toBe(
      'api'
    );
  });

  it('recognizes Layers by exclusion within eligible containers', () => {
    const result = classify(
      [
        'src/_domain/readme.ts',
        'src/_src@shared/_domain/readme.ts',
        'src/_network/_domain/readme.ts',
        'src/_components/button/_domain/readme.ts',
      ],
      [treeOf('src', { originKind: 'root-layer', rootFragments: [] })]
    );
    expect(kindOf(result, 'src/_domain').domainKind).toBe('layer');
    expect(kindOf(result, 'src/_src@shared').domainKind).toBe('fractal-branch');
    expect(kindOf(result, 'src/_src@shared/_domain').domainKind).toBe('layer');
    expect(kindOf(result, 'src/_network/_domain').domainKind).toBe('layer');
    expect(
      result.model.byPath.get('src/_network/_domain')?.relationalQualifications
        .isSubLayer
    ).toBe(true);
    expect(
      kindOf(result, 'src/_components/button/_domain').domainKind
    ).toBeNull();
  });

  it('recognizes Sub-Categories and Path Sub-Categories by exclusion and placement', () => {
    const result = classify(
      ['src/_components/_atoms/readme.ts', 'src/_apis/_todos/readme.ts'],
      [
        treeOf('src', {
          horizontalHierarchyModels: [],
          mimeticPathStructures: [{ actions: ['get'], paths: ['src/_apis'] }],
          originKind: 'root-layer',
          rootFragments: [],
        }),
      ]
    );
    expect(kindOf(result, 'src/_components/_atoms').domainKind).toBe(
      'sub-category'
    );
    expect(kindOf(result, 'src/_apis/_todos').domainKind).toBe(
      'path-sub-category'
    );
  });

  it('recognizes a Fractal Branch from its reserved name', () => {
    const result = classify(
      ['src/_apis/_apis@shared/readme.ts', 'src/_apis/_wrong@shared/readme.ts'],
      [treeOf('src', { originKind: 'root-layer', rootFragments: [] })]
    );
    expect(kindOf(result, 'src/_apis/_apis@shared').domainKind).toBe(
      'fractal-branch'
    );
    expect(kindOf(result, 'src/_apis/_wrong@shared').domainKind).toBeNull();
  });

  it('classifies files even when they have no imports', () => {
    const result = classify(
      ['src/notes/orphan.ts'],
      [
        treeOf('src', {
          rootFragments: [
            {
              dependencyPairs: [],
              path: 'src',
              rootNodes: [],
              subRootFragments: [],
            },
          ],
        }),
      ]
    );
    expect(kindOf(result, 'src/notes/orphan.ts').nodeKind).toBeNull();
    expect(kindOf(result, 'src/notes/orphan.ts').nodeKind).not.toBe(
      'foreign-node'
    );
  });

  it('rejects a Root Node that is also Foreign and an unenumerated direct file', () => {
    const result = classify(
      ['src/main.ts', 'src/readme.md', 'src/extra.ts'],
      [
        treeOf('src', {
          foreignNodes: {
            families: [],
            individualPaths: ['src/main.ts', 'src/readme.md'],
          },
          rootFragments: [
            {
              dependencyPairs: [],
              path: 'src',
              rootNodes: [{ name: 'main.ts', rank: 0 }],
              subRootFragments: [],
            },
          ],
        }),
      ]
    );
    expect(kindOf(result, 'src/main.ts').nodeKind).toBeNull();
    expect(kindOf(result, 'src/readme.md').nodeKind).toBe('foreign-node');
    expect(kindOf(result, 'src/extra.ts').nodeKind).toBeNull();
    expect(result.outcomes).toContainEqual({
      constraint: 'configuration/contradictory-root-foreign',
      element: 'src/main.ts',
      family: 'configuration',
      message:
        "'src/main.ts' cannot be declared as both a Root Node and a Foreign Node",
      normativeReference: 'FAF §6.7',
      propertyPath: 'trees[0].rootFragments[0].rootNodes',
    });
    expect(result.outcomes).toContainEqual({
      constraint: 'configuration/unenumerated-root-file',
      element: 'src/extra.ts',
      family: 'configuration',
      message:
        "'src/extra.ts' must be either enumerated as a Root Node or designated as a Foreign Node",
      normativeReference: 'FAF §6.2.1',
      propertyPath: 'trees[0].rootFragments[0]',
    });
  });

  it('rejects mimetic paths that are not Categories of Fragments', () => {
    const result = classify(
      [
        'src/_types/user.type.ts',
        'src/_components/_atoms/readme.ts',
        'src/_apis/_todos/readme.ts',
      ],
      [
        treeOf('src', {
          horizontalHierarchyModels: [],
          mimeticPathStructures: [
            { actions: null, paths: ['src/_types'] },
            { actions: null, paths: ['src/_components/_atoms'] },
            { actions: ['get'], paths: ['src/_apis/_todos'] },
          ],
          originKind: 'root-layer',
          rootFragments: [],
        }),
      ]
    );
    const rejected = result.outcomes
      .filter(
        (outcome) =>
          outcome.constraint ===
          'configuration/incompatible-mimetic-designation'
      )
      .map((outcome) => outcome.element);
    expect(sortText(rejected)).toEqual([
      'src/_apis/_todos',
      'src/_components/_atoms',
      'src/_types',
    ]);
    expect(
      result.outcomes.every((outcome) => outcome.propertyPath.length > 0)
    ).toBe(true);
  });

  it('rejects externalDependency sources that are Access Nodes, Foreign Nodes, or Foreign Domains while allowing Logical Domains', () => {
    const result = classify(
      [
        'src/_components/button/button.component.tsx',
        'src/_components/button/index.ts',
        'src/_components/button/README.md',
        'src/_tooling/gen.ts',
      ],
      [
        treeOf('src', {
          externalDependencyPairs: [
            { from: 'src/_components/button/index.ts', to: 'legacy/a.ts' },
            { from: 'src/_components/button/README.md', to: 'legacy/a.ts' },
            { from: 'src/_components', to: 'legacy/a.ts' },
            { from: 'src/_tooling', to: 'legacy/a.ts' },
          ],
          foreignDomains: ['src/_tooling'],
          foreignNodes: {
            families: [],
            individualPaths: ['src/_components/button/README.md'],
          },
          horizontalHierarchyModels: [],
          originKind: 'root-layer',
          rootFragments: [],
        }),
      ]
    );
    expect(
      result.outcomes.filter(
        (outcome) =>
          outcome.constraint ===
          'configuration/invalid-external-dependency-source'
      )
    ).toEqual([
      {
        constraint: 'configuration/invalid-external-dependency-source',
        element: 'src/_components/button/README.md',
        family: 'configuration',
        message:
          "'src/_components/button/README.md' must be an authorized Logical Node or Logical Domain in externalDependencies",
        normativeReference: 'FAF §7.3',
        propertyPath: 'trees[0].externalDependencyPairs[1].from',
      },
      {
        constraint: 'configuration/invalid-external-dependency-source',
        element: 'src/_components/button/index.ts',
        family: 'configuration',
        message:
          "'src/_components/button/index.ts' must be an authorized Logical Node or Logical Domain in externalDependencies",
        normativeReference: 'FAF §7.3',
        propertyPath: 'trees[0].externalDependencyPairs[0].from',
      },
      {
        constraint: 'configuration/invalid-external-dependency-source',
        element: 'src/_tooling',
        family: 'configuration',
        message:
          "'src/_tooling' must be an authorized Logical Node or Logical Domain in externalDependencies",
        normativeReference: 'FAF §7.3',
        propertyPath: 'trees[0].externalDependencyPairs[3].from',
      },
    ]);
  });

  it('rejects publicRootNodes that identify Access Nodes or Category Nodes', () => {
    const result = classify(
      [
        'src/main.ts',
        'src/_components/button/index.ts',
        'src/_components/button/button.component.tsx',
        'src/_types/user.type.ts',
      ],
      [
        treeOf('src', {
          publicRootNodes: [
            'src/main.ts',
            'src/_components/button/index.ts',
            'src/_types/user.type.ts',
          ],
          rootFragments: [
            {
              dependencyPairs: [],
              path: 'src',
              rootNodes: [{ name: 'main.ts', rank: 0 }],
              subRootFragments: [],
            },
          ],
        }),
      ]
    );
    expect(
      result.outcomes.filter(
        (outcome) =>
          outcome.constraint === 'configuration/invalid-public-root-node'
      )
    ).toEqual([
      {
        constraint: 'configuration/invalid-public-root-node',
        element: 'src/_components/button/index.ts',
        family: 'configuration',
        message:
          "'src/_components/button/index.ts' must identify an enumerated Root Node in publicRootNodes",
        normativeReference: 'FAF §7.1',
        propertyPath: 'trees[0].publicRootNodes[1]',
      },
      {
        constraint: 'configuration/invalid-public-root-node',
        element: 'src/_types/user.type.ts',
        family: 'configuration',
        message:
          "'src/_types/user.type.ts' must identify an enumerated Root Node in publicRootNodes",
        normativeReference: 'FAF §7.1',
        propertyPath: 'trees[0].publicRootNodes[2]',
      },
    ]);
  });

  it('propagates Role through Path Sub-Categories without creating autonomous Categories', () => {
    const result = classify(
      [
        'src/_apis/_todos/_[todo-id]/_status/patch-todo-status/patch-todo-status.api.ts',
        'src/_apis/_todos/_[todo-id]/_status/patch-todo-status/index.ts',
      ],
      [
        treeOf('src', {
          horizontalHierarchyModels: [],
          mimeticPathStructures: [{ actions: ['patch'], paths: ['src/_apis'] }],
          originKind: 'root-layer',
          rootFragments: [],
        }),
      ]
    );
    expect(
      result.model.byPath.get('src/_apis/_todos/_[todo-id]/_status')
        ?.imposedRoleName
    ).toBe('api');
    expect(
      kindOf(
        result,
        'src/_apis/_todos/_[todo-id]/_status/patch-todo-status/patch-todo-status.api.ts'
      ).nodeKind
    ).toBe('master-node');
  });

  it('terminates mimetic rules at the boundary of units and organized Branches', () => {
    const result = classify(
      [
        'src/_apis/_todos/_todos@shared/_utils/normalize/normalize.util.ts',
        'src/_apis/_todos/_todos@shared/_utils/normalize/index.ts',
        'src/_apis/_todos/get-todos/_utils/parse/parse.util.ts',
        'src/_apis/_todos/get-todos/_utils/parse/index.ts',
        'src/_apis/_todos/get-todos/get-todos.api.ts',
        'src/_apis/_todos/get-todos/index.ts',
      ],
      [
        treeOf('src', {
          horizontalHierarchyModels: [],
          mimeticPathStructures: [{ actions: ['get'], paths: ['src/_apis'] }],
          originKind: 'root-layer',
          rootFragments: [],
        }),
      ]
    );
    expect(
      result.model.byPath.get('src/_apis/_todos/_todos@shared')?.domainKind
    ).toBe('fractal-branch');
    expect(
      result.model.byPath.get('src/_apis/_todos/_todos@shared/_utils/normalize')
        ?.imposedRoleName
    ).toBe('util');
    expect(
      result.model.byPath.get('src/_apis/_todos/get-todos/_utils/parse')
        ?.imposedRoleName
    ).toBe('util');
  });

  it('distinguishes programmatic routing from contracts scanned by the framework', () => {
    const result = classify(
      [
        'src/_pages/home/home.page.tsx',
        'src/_pages/home/index.ts',
        'app/page.tsx',
      ],
      [
        treeOf('src', {
          horizontalHierarchyModels: [],
          mimeticPathStructures: [{ actions: null, paths: ['src/_pages'] }],
          originKind: 'root-layer',
          rootFragments: [],
        }),
        treeOf('app', {
          catalog: standardCatalog,
          rootFragments: [
            {
              dependencyPairs: [],
              path: 'app',
              rootNodes: [{ name: 'page.tsx', rank: 0 }],
              subRootFragments: [],
            },
          ],
        }),
      ]
    );
    expect(kindOf(result, 'src/_pages/home').domainKind).toBe('fragment');
    expect(kindOf(result, 'src/_pages/home/home.page.tsx').nodeKind).toBe(
      'master-node'
    );
    expect(kindOf(result, 'app/page.tsx').nodeKind).toBe('root-node');
    expect(kindOf(result, 'app/page.tsx').role.kind).toBe('absent');
  });

  it('does not promote two Masters when the imposed Role is duplicated', () => {
    const result = classify(
      [
        'src/_components/button/button.component.tsx',
        'src/_components/button/button.component.ts',
        'src/_components/button/index.ts',
      ],
      [treeOf('src', { originKind: 'root-layer', rootFragments: [] })]
    );
    expect(
      kindOf(result, 'src/_components/button/button.component.tsx').nodeKind
    ).toBe('fragment-node');
    expect(
      kindOf(result, 'src/_components/button/button.component.ts').nodeKind
    ).toBe('fragment-node');
  });

  it('produces the same model and outcomes when inventory order changes', () => {
    const paths = [
      'src/main.ts',
      'src/_components/button/button.component.tsx',
      'src/_components/button/index.ts',
      'src/_types/user.type.ts',
    ];
    const tree = treeOf('src', {
      rootFragments: [
        {
          dependencyPairs: [],
          path: 'src',
          rootNodes: [{ name: 'main.ts', rank: 0 }],
          subRootFragments: [],
        },
      ],
    });
    const entries = withDirectories(paths);
    const project = (
      rawEntries: readonly TRawInventoryEntry[]
    ): ReturnType<typeof classifyTaxonomy> =>
      classifyTaxonomy({
        declarations: { aliases: [], baseDirectory: '/repo', trees: [tree] },
        inventory: inventoryFromEntries(rawEntries, ['src']),
      });
    const first = project(entries);
    const reversedEntries = [...entries];
    reversedEntries.reverse();
    const second = project(reversedEntries);
    expect(projectClassification(second)).toEqual(projectClassification(first));
    expect(second.outcomes).toEqual(first.outcomes);
  });

  it('classifies the compound component table of FAF §6.6.3.4', () => {
    const paths = [
      'src/_components/table/index.ts',
      'src/_components/table/table.component.tsx',
      'src/_components/table/table.hook.ts',
      'src/_components/table/table.recipe.ts',
      'src/_components/table/table.spec.tsx',
      'src/_components/table/table.type.ts',
      'src/_components/table/_components/_components@shared/_hooks/use-table-context/index.ts',
      'src/_components/table/_components/_components@shared/_hooks/use-table-context/use-table-context.hook.ts',
      'src/_components/table/_components/table-body/index.ts',
      'src/_components/table/_components/table-body/table-body.component.tsx',
      'src/_components/table/_components/table-cell/index.ts',
      'src/_components/table/_components/table-cell/table-cell.component.tsx',
      'src/_components/table/_components/table-head/index.ts',
      'src/_components/table/_components/table-head/table-head.component.tsx',
      'src/_components/table/_components/table-header-cell/index.ts',
      'src/_components/table/_components/table-header-cell/table-header-cell.component.tsx',
      'src/_components/table/_components/table-row/index.ts',
      'src/_components/table/_components/table-row/table-row.component.tsx',
      'src/_components/table/_table@shared/_contexts/table-context/index.ts',
      'src/_components/table/_table@shared/_contexts/table-context/table-context.context.ts',
      'src/_components/table/_table@shared/_types/table-sort.type.ts',
      'src/_components/table/_utils/sort-table-rows/index.ts',
      'src/_components/table/_utils/sort-table-rows/sort-table-rows.spec.ts',
      'src/_components/table/_utils/sort-table-rows/sort-table-rows.util.ts',
    ];
    const result = classify(paths, [
      treeOf('src', { originKind: 'root-layer', rootFragments: [] }),
    ]);
    const expected: Readonly<Record<string, string>> = {
      'src/_components': 'category',
      'src/_components/table': 'fragment',
      'src/_components/table/_components': 'category',
      'src/_components/table/_components/_components@shared': 'fractal-branch',
      'src/_components/table/_components/_components@shared/_hooks': 'category',
      'src/_components/table/_components/_components@shared/_hooks/use-table-context':
        'fragment',
      'src/_components/table/_components/table-body': 'fragment',
      'src/_components/table/_table@shared': 'fractal-branch',
      'src/_components/table/_table@shared/_contexts': 'category',
      'src/_components/table/_table@shared/_contexts/table-context': 'fragment',
      'src/_components/table/_table@shared/_types': 'category',
      'src/_components/table/_utils': 'category',
      'src/_components/table/_utils/sort-table-rows': 'fragment',
    };
    for (const [path, domainKind] of Object.entries(expected)) {
      expect(kindOf(result, path).domainKind).toBe(domainKind);
    }
    expect(
      result.model.byPath.get('src/_components/table/_components')
        ?.relationalQualifications.isPrivateCategory
    ).toBe(true);
    expect(
      result.model.byPath.get(
        'src/_components/table/_table@shared/_types/table-sort.type.ts'
      )?.nodeKind
    ).toBe('category-node');
    expect(
      result.model.byPath.get(
        'src/_components/table/_utils/sort-table-rows/sort-table-rows.util.ts'
      )?.nodeKind
    ).toBe('master-node');
    expect(
      result.model.byPath.get('src/_components/table/_utils/sort-table-rows')
        ?.relationalQualifications.parentFragmentPath
    ).toBe('src/_components/table');
  });

  it('classifies the plugin repository Root Fragment architecture', () => {
    const repositoryCatalog = catalogOf(
      [
        { category: '_constants', isCategoryNode: true, name: 'constant' },
        { category: '_schemas', isCategoryNode: true, name: 'schema' },
        { category: '_types', isCategoryNode: true, name: 'type' },
        { category: '_mocks', isCategoryNode: true, name: 'mock' },
        { category: '_configs', isCategoryNode: true, name: 'config' },
        { category: '_utils', name: 'util' },
        { category: '_norms', name: 'norm' },
        { category: '_stores', name: 'store' },
        { category: '_rules', name: 'rule' },
      ],
      ['spec']
    );
    const paths = [
      'src/main.ts',
      'src/_src@shared/_domain/_utils/to-posix-path/to-posix-path.util.ts',
      'src/_src@shared/_domain/_utils/to-posix-path/index.ts',
      'src/_src@shared/_taxonomy/_types/classification.type.ts',
      'src/_src@shared/_taxonomy/_utils/get-role-from-name/get-role-from-name.util.ts',
      'src/_src@shared/_taxonomy/_utils/get-role-from-name/index.ts',
      'src/_src@shared/_runtime/_utils/load-config/load-config.util.ts',
      'src/_src@shared/_runtime/_utils/load-config/index.ts',
    ];
    const result = classify(paths, [
      treeOf('src', {
        catalog: repositoryCatalog,
        publicRootNodes: ['src/main.ts'],
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [],
          },
        ],
      }),
    ]);
    expect(kindOf(result, 'src').domainKind).toBe('root-fragment');
    expect(kindOf(result, 'src/main.ts').nodeKind).toBe('root-node');
    expect(kindOf(result, 'src/_src@shared').domainKind).toBe('fractal-branch');
    expect(kindOf(result, 'src/_src@shared/_domain').domainKind).toBe('layer');
    expect(kindOf(result, 'src/_src@shared/_domain/_utils').domainKind).toBe(
      'category'
    );
    expect(
      kindOf(result, 'src/_src@shared/_domain/_utils/to-posix-path').domainKind
    ).toBe('fragment');
    expect(
      kindOf(
        result,
        'src/_src@shared/_domain/_utils/to-posix-path/to-posix-path.util.ts'
      ).nodeKind
    ).toBe('master-node');
    expect(
      kindOf(result, 'src/_src@shared/_taxonomy/_types/classification.type.ts')
        .nodeKind
    ).toBe('category-node');
    expect(
      kindOf(
        result,
        'src/_src@shared/_runtime/_utils/load-config/load-config.util.ts'
      ).nodeKind
    ).toBe('master-node');
  });

  it('covers declaration conflicts, dot origin, and files without a role stem', () => {
    const dotInventory = inventoryFromEntries(
      [entry('.', 'directory'), entry('main.ts', 'file')],
      ['.']
    );
    const dotResult = classifyTaxonomy({
      declarations: {
        aliases: [],
        baseDirectory: '/repo',
        trees: [
          treeOf('.', {
            rootFragments: [
              {
                dependencyPairs: [],
                path: '.',
                rootNodes: [{ name: 'main.ts', rank: 0 }],
                subRootFragments: [],
              },
            ],
          }),
        ],
      },
      inventory: dotInventory,
    });
    expect(kindOf(dotResult, 'main.ts').nodeKind).toBe('root-node');

    const conflicted = classify(
      [
        'src/_tooling/page.tsx',
        'src/_pages/home/home.page.tsx',
        'src/_pages/home/index.ts',
      ],
      [
        treeOf('src', {
          foreignDomains: ['src', 'src/_tooling'],
          mimeticPathStructures: [
            { actions: null, paths: ['src/_pages', 'missing/path'] },
            { actions: ['get'], paths: ['src/_pages'] },
          ],
          originKind: 'root-layer',
          rootFragments: [
            {
              dependencyPairs: [],
              path: 'src/_tooling',
              rootNodes: [{ name: 'page.tsx', rank: 0 }],
              subRootFragments: [],
            },
          ],
        }),
      ]
    );
    const detailed = classify(
      [
        'src/_components/button/button.component.tsx',
        'src/_components/button/index.ts',
        'src/_types/orphan/note.ts',
        'src/_domain/notes/note.ts',
      ],
      [
        treeOf('src', {
          externalDependencyPairs: [
            {
              from: 'src/_components/button/button.component.tsx',
              to: 'legacy/a.ts',
            },
            { from: 'missing.ts', to: 'legacy/a.ts' },
          ],
          horizontalHierarchyModels: [],
          originKind: 'root-layer',
          publicRootNodes: ['absent.ts'],
          rootFragments: [],
        }),
      ]
    );
    expect(
      conflicted.outcomes.some(
        (outcome) =>
          outcome.constraint === 'configuration/incompatible-foreign-origin'
      )
    ).toBe(true);
    expect(
      conflicted.outcomes.some(
        (outcome) =>
          outcome.constraint ===
          'configuration/incompatible-root-in-foreign-domain'
      )
    ).toBe(true);
    expect(
      conflicted.outcomes.filter(
        (outcome) =>
          outcome.constraint === 'configuration/duplicate-mimetic-path'
      ).length
    ).toBeGreaterThan(0);
    expect(
      detailed.outcomes.some(
        (outcome) =>
          outcome.constraint ===
            'configuration/invalid-external-dependency-source' &&
          outcome.element === 'src/_components/button/button.component.tsx'
      )
    ).toBe(false);
    const stemInventory = inventoryFromEntries(
      [
        entry('src', 'directory'),
        entry('src/_components', 'directory'),
        entry('src/_components/button', 'directory'),
        entry('src/_components/button/button.component.tsx', 'file'),
        entry('src/_components/button/index.ts', 'file'),
        entry('src/_components/button/button', 'file'),
      ],
      ['src']
    );
    const stemResult = classifyTaxonomy({
      declarations: {
        aliases: [],
        baseDirectory: '/repo',
        trees: [treeOf('src', { originKind: 'root-layer', rootFragments: [] })],
      },
      inventory: stemInventory,
    });
    expect(kindOf(stemResult, 'src/_components/button/button').nodeKind).toBe(
      'unauthorized-logical-node'
    );
    expect(kindOf(detailed, 'src/_domain/notes').domainKind).toBeNull();
    expect(kindOf(detailed, 'src/_types/orphan').domainKind).toBeNull();

    const missingOrigin = classifyTaxonomy({
      declarations: {
        aliases: [],
        baseDirectory: '/repo',
        trees: [
          treeOf('absent'),
          treeOf('src', { originKind: 'root-layer', rootFragments: [] }),
        ],
      },
      inventory: inventoryFromEntries([entry('src', 'file')], ['src']),
    });
    expect(missingOrigin.model.classifications).toEqual([]);

    const nestedForeign = classify(
      ['src/_tooling/nested/page.tsx'],
      [
        treeOf('src', {
          foreignDomains: ['src/_tooling'],
          mimeticPathStructures: [
            { actions: null, paths: ['src/_pages'] },
            { actions: null, paths: ['src/_pages'] },
            { actions: ['get'], paths: ['src/_pages'] },
          ],
          rootFragments: [
            {
              dependencyPairs: [],
              path: 'src/_tooling/nested',
              rootNodes: [{ name: 'page.tsx', rank: 0 }],
              subRootFragments: [],
            },
          ],
        }),
      ]
    );
    expect(
      nestedForeign.outcomes.filter(
        (outcome) =>
          outcome.constraint === 'configuration/duplicate-mimetic-path' &&
          outcome.element === 'src/_pages'
      )
    ).toHaveLength(2);
  });
});

describe('observable classification contract', () => {
  it('emits no outcomes for an enumerated root node and records origin qualifications', () => {
    const result = classify(
      ['src/main.ts'],
      [
        treeOf('src', {
          rootFragments: [
            {
              dependencyPairs: [],
              path: 'src',
              rootNodes: [{ name: 'main.ts', rank: 0 }],
              subRootFragments: [],
            },
          ],
        }),
      ]
    );
    expect(result.outcomes).toEqual([]);
    expect(result.model.byPath.get('src')?.relationalQualifications).toEqual({
      isParentCategory: false,
      isPathFragment: false,
      isPrivateCategory: false,
      isSubFragment: false,
      isSubLayer: false,
      parentFragmentPath: null,
    });
    const origin = result.model.classifications.find(
      (classification) => classification.path === 'src'
    );
    expect(origin).toBeDefined();
    expect(result.model.byItemId.get(origin?.itemId ?? -1)).toBe(origin);
  });

  it('fixes the undeclared frontier outcome, qualifications, and catalog child', () => {
    const result = classify(
      ['src/blog/page.tsx', 'src/blog/_components/button/button.component.tsx'],
      [
        treeOf('src', {
          rootFragments: [
            {
              dependencyPairs: [],
              path: 'src',
              rootNodes: [],
              subRootFragments: [],
            },
          ],
        }),
      ]
    );
    expect(result.outcomes).toEqual([
      {
        constraint: 'configuration/undeclared-sub-root-fragment',
        element: 'src/blog',
        family: 'configuration',
        message: "'src/blog' must be declared in subRootFragments",
        normativeReference: 'FAF §6.2',
        propertyPath: 'trees[0].rootFragments[0].subRootFragments',
      },
    ]);
    expect(
      result.model.byPath.get('src/blog')?.relationalQualifications
    ).toEqual({
      isParentCategory: false,
      isPathFragment: false,
      isPrivateCategory: false,
      isSubFragment: false,
      isSubLayer: false,
      parentFragmentPath: null,
    });
    expect(kindOf(result, 'src/blog/_components').domainKind).toBe('category');
  });

  it('uses the rootFragments fallback when the origin is not indexed as a root fragment', () => {
    const result = classify(
      ['src/blog/page.tsx', 'src/main.ts'],
      [treeOf('src', { rootFragments: [] })]
    );
    expect(result.outcomes).toEqual([
      {
        constraint: 'configuration/undeclared-sub-root-fragment',
        element: 'src/blog',
        family: 'configuration',
        message: "'src/blog' must be declared in subRootFragments",
        normativeReference: 'FAF §6.2',
        propertyPath: 'trees[0].rootFragments.subRootFragments',
      },
      {
        constraint: 'configuration/unenumerated-root-file',
        element: 'src/main.ts',
        family: 'configuration',
        message:
          "'src/main.ts' must be either enumerated as a Root Node or designated as a Foreign Node",
        normativeReference: 'FAF §6.2.1',
        propertyPath: 'trees[0].rootFragments',
      },
    ]);
  });

  it('sets parentFragmentPath of a nested file to the fragment, not its container', () => {
    const result = classify(
      [
        'src/_components/button/button.component.tsx',
        'src/_components/button/_utils/format.util.ts',
      ],
      [treeOf('src', { originKind: 'root-layer', rootFragments: [] })]
    );
    expect(
      result.model.byPath.get('src/_components/button/_utils/format.util.ts')
        ?.relationalQualifications.parentFragmentPath
    ).toBe('src/_components/button');
  });

  it('orders outcomes by element even when the higher path has the lower item id', () => {
    const built = inventoryFromEntries(
      withDirectories(['src/a.ts', 'src/z.ts']),
      ['src']
    );
    const aId = built.pathToId.get('src/a.ts');
    const zId = built.pathToId.get('src/z.ts');
    expect(aId).toBeDefined();
    expect(zId).toBeDefined();
    if (aId === undefined || zId === undefined) {
      return;
    }
    const items = [...built.items];
    const aItem = items[aId];
    const zItem = items[zId];
    expect(aItem).toBeDefined();
    expect(zItem).toBeDefined();
    if (aItem === undefined || zItem === undefined) {
      return;
    }
    items[aId] = { ...zItem, id: aId };
    items[zId] = { ...aItem, id: zId };
    const pathToId = new Map(built.pathToId);
    pathToId.set('src/z.ts', aId);
    pathToId.set('src/a.ts', zId);
    const result = classifyTaxonomy({
      declarations: {
        aliases: [],
        baseDirectory: '/repo',
        trees: [
          treeOf('src', {
            rootFragments: [
              {
                dependencyPairs: [],
                path: 'src',
                rootNodes: [],
                subRootFragments: [],
              },
            ],
          }),
        ],
      },
      inventory: { ...built, items, pathToId },
    });
    expect(result.outcomes.map((outcome) => outcome.element)).toEqual([
      'src/a.ts',
      'src/z.ts',
    ]);
    expect(result.outcomes.map((outcome) => outcome.constraint)).toEqual([
      'configuration/unenumerated-root-file',
      'configuration/unenumerated-root-file',
    ]);
  });

  it('orders configuration outcomes by constraint, element, and propertyPath', () => {
    const byConstraintA = createOutcome.configuration(
      'configuration/duplicate-mimetic-path',
      { element: 'z', propertyPath: 'z.path' }
    );
    const byConstraintB = createOutcome.configuration(
      'configuration/incompatible-foreign-origin',
      { element: 'a', propertyPath: 'a.path' }
    );
    expect(compareConfigOutcomes(byConstraintA, byConstraintB)).toBeLessThan(0);
    expect(compareConfigOutcomes(byConstraintB, byConstraintA)).toBeGreaterThan(
      0
    );

    const byElementA = createOutcome.configuration(
      'configuration/duplicate-mimetic-path',
      { element: 'a', propertyPath: 'z.path' }
    );
    const byElementB = createOutcome.configuration(
      'configuration/duplicate-mimetic-path',
      { element: 'b', propertyPath: 'a.path' }
    );
    expect(compareConfigOutcomes(byElementA, byElementB)).toBeLessThan(0);
    expect(compareConfigOutcomes(byElementB, byElementA)).toBeGreaterThan(0);

    const byPropertyA = createOutcome.configuration(
      'configuration/duplicate-mimetic-path',
      { element: 'a', propertyPath: 'a.path' }
    );
    const byPropertyB = createOutcome.configuration(
      'configuration/duplicate-mimetic-path',
      { element: 'a', propertyPath: 'b.path' }
    );
    expect(compareConfigOutcomes(byPropertyA, byPropertyB)).toBeLessThan(0);
    expect(compareConfigOutcomes(byPropertyB, byPropertyA)).toBeGreaterThan(0);
    expect(compareConfigOutcomes(byPropertyA, byPropertyA)).toBe(0);
  });
});
