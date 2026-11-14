import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  createProject,
  lintProject,
  lintScenario,
  warmupESLint,
} from '../support/acceptance-project.js';

const config = {
  faf: {
    locals: [
      {
        roles: [{ category: '_utils', name: 'util' }],
        rootLayers: ['src'],
        subGraphRoles: [{ name: 'spec' }],
      },
    ],
  },
};

const conformingTree = {
  'src/_utils/widget/index.ts': "export { widget } from './widget.util.js';\n",
  'src/_utils/widget/widget.util.ts':
    "export function widget() {\n  return 'ok';\n}\n",
};

describe('acceptance: faf/conformity', () => {
  const WARMUP_TIMEOUT_MS = 120_000;

  beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

  it('reports zero outcomes for a conforming project', async () => {
    const fixture = await createProject(conformingTree, config);

    try {
      const results = await lintProject(fixture.path, ['.']);
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const otherMessages = results
        .filter((result) => result.filePath !== configPath)
        .flatMap((result) => result.messages);
      const configMessages =
        results.find((result) => result.filePath === configPath)?.messages ??
        [];
      expect(otherMessages).toEqual([]);
      expect(configMessages).toEqual([]);
    } finally {
      await fixture.rm();
    }
  });

  it('verifies a conforming project once when linting several files', async () => {
    const fixture = await createProject(conformingTree, config);
    const cachePath = nodePath.join(
      fixture.path,
      'node_modules/.cache/eslint-plugin-faf/records.cache'
    );
    const originalRename = nodeFs.renameSync;
    let verifications = 0;
    nodeFs.renameSync = (from, to) => {
      if (to === cachePath) {
        verifications += 1;
      }
      originalRename(from, to);
    };

    try {
      const results = await lintProject(fixture.path, [
        'faf.config.ts',
        'src/_utils/widget/index.ts',
        'src/_utils/widget/widget.util.ts',
      ]);
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const otherMessages = results
        .filter((result) => result.filePath !== configPath)
        .flatMap((result) => result.messages);
      const configMessages =
        results.find((result) => result.filePath === configPath)?.messages ??
        [];
      expect(otherMessages).toEqual([]);
      expect(configMessages).toEqual([]);
      expect(verifications).toBe(1);
    } finally {
      nodeFs.renameSync = originalRename;
      await fixture.rm();
    }
  });

  it('reports an unknown property as configuration on faf.config.ts', async () => {
    const fixture = await createProject(conformingTree, {
      ...config,
      extra: true,
    });

    try {
      const results = await lintProject(fixture.path, ['faf.config.ts']);
      const messages = results.flatMap((result) => result.messages);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.ruleId).toBe('faf/conformity');
      expect(messages[0]?.messageId).toBe('configuration');
      expect(messages[0]?.message).toContain('configuration/unknown-property');
      expect(results[0]?.filePath).toBe(
        nodePath.join(fixture.path, 'faf.config.ts')
      );
      expect(messages[0]?.line).toBe(1);
    } finally {
      await fixture.rm();
    }
  });

  it('anchors an unclassifiable directory to the first lintable child', async () => {
    const fixture = await createProject(
      {
        ...conformingTree,
        'src/mystery/a.ts': 'export const earlier = 1;\n',
        'src/mystery/b.ts': 'export const later = 2;\n',
      },
      config
    );

    try {
      const results = await lintProject(fixture.path, [
        'src/mystery/b.ts',
        'src/mystery/a.ts',
      ]);
      const byFile = new Map(
        results.map((result) => [result.filePath, result.messages])
      );
      const earlier = nodePath.join(fixture.path, 'src/mystery/a.ts');
      const later = nodePath.join(fixture.path, 'src/mystery/b.ts');
      const earlierMessages = byFile.get(earlier) ?? [];
      const laterMessages = byFile.get(later) ?? [];
      expect(
        earlierMessages.some(
          (message) =>
            message.ruleId === 'faf/conformity' &&
            message.messageId === 'classification' &&
            message.message.includes("'src/mystery'")
        )
      ).toBe(true);
      expect(
        laterMessages.some((message) =>
          message.message.includes("'src/mystery'")
        )
      ).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('reports an unresolved import as unverified on the import line', async () => {
    const fixture = await createProject(
      {
        ...conformingTree,
        'src/_utils/widget/index.ts':
          "import { widget } from './widget.util.js';\nimport { missing } from './missing.js';\nexport { widget };\n",
      },
      config
    );

    try {
      const filePath = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const results = await lintProject(fixture.path, [filePath]);
      const message = results
        .flatMap((result) => result.messages)
        .find((item) => item.messageId === 'unverified');
      expect(message?.ruleId).toBe('faf/conformity');
      expect(message?.message).toContain('unverified/unresolved-import');
      expect(message?.line).toBe(2);
      expect(results[0]?.filePath).toBe(filePath);
    } finally {
      await fixture.rm();
    }
  });

  it('reports a missing faf.config.ts on every linted file', async () => {
    const fixture = await createFixture({
      'src/a.ts': 'export const a = 1;\n',
      'src/b.ts': 'export const b = 2;\n',
    });

    try {
      const results = await lintProject(fixture.path, ['src/a.ts', 'src/b.ts']);
      expect(results).toHaveLength(2);
      for (const result of results) {
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0]?.ruleId).toBe('faf/conformity');
        expect(result.messages[0]?.messageId).toBe('configuration');
        expect(result.messages[0]?.message).toContain(
          'configuration/missing-config-file'
        );
        expect(result.messages[0]?.line).toBe(1);
      }
    } finally {
      await fixture.rm();
    }
  });

  it('produces the same outcomes when the same project is linted in two file orders', async () => {
    const fixture = await createProject(
      {
        ...conformingTree,
        'src/mystery/a.ts': 'export const earlier = 1;\n',
        'src/mystery/b.ts': 'export const later = 2;\n',
      },
      config
    );

    try {
      const earlier = nodePath.join(fixture.path, 'src/mystery/a.ts');
      const later = nodePath.join(fixture.path, 'src/mystery/b.ts');
      const forward = await lintProject(fixture.path, [earlier, later]);
      const reverse = await lintProject(fixture.path, [later, earlier]);
      expect(reverse).toEqual(forward);
      expect(
        forward.flatMap((result) => result.messages).length
      ).toBeGreaterThan(0);
    } finally {
      await fixture.rm();
    }
  });

  it('produces zero conformity outcomes for this repository', async () => {
    const repository = nodePath.resolve(import.meta.dirname, '../..');
    const results = await lintProject(repository, [
      'faf.config.ts',
      'src/main.ts',
    ]);
    const messages = results.flatMap((result) => result.messages);
    expect(messages).toEqual([]);
  }, 30_000);

  describe('structural and frontier cache invalidation', () => {
    describe('structural filesystem and configuration changes invalidate cached outcomes', () => {
      it('detects deletion of an Access Node', async () => {
        const fixture = await createProject(
          {
            'src/_utils/widget/index.ts':
              "export { widget } from './widget.util.js';\n",
            'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
          },
          config
        );

        try {
          const initial = await lintScenario(fixture.path, [
            'src/_utils/widget/widget.util.ts',
          ]);
          expect(initial).toEqual([]);

          nodeFs.rmSync(
            nodePath.join(fixture.path, 'src/_utils/widget/index.ts')
          );

          const after = await lintScenario(fixture.path, [
            'src/_utils/widget/widget.util.ts',
          ]);
          expect(
            after.some(
              (message) =>
                message.constraint === 'classification/missing-access-node'
            )
          ).toBe(true);
        } finally {
          await fixture.rm();
        }
      });

      it('detects moving a Fragment into a Private Category', async () => {
        const hierarchyConfig = {
          faf: {
            locals: [
              {
                horizontalHierarchies: [[['_utils'], ['_services']]],
                roles: [
                  { category: '_utils', name: 'util' },
                  { category: '_services', name: 'service' },
                ],
                rootLayers: ['src'],
                subGraphRoles: [{ name: 'spec' }],
              },
            ],
          },
        };

        const fixture = await createProject(
          {
            'src/_services/auth/auth.service.ts': 'export const auth = 1;\n',
            'src/_services/auth/index.ts':
              "export { auth } from './auth.service.js';\n",
            'src/_services/worker/index.ts':
              "export { worker } from './worker.service.js';\n",
            'src/_services/worker/worker.service.ts':
              "import { helper } from '../../_utils/helper/index.js';\nexport const worker = helper;\n",
            'src/_utils/helper/helper.util.ts': 'export const helper = 1;\n',
            'src/_utils/helper/index.ts':
              "export { helper } from './helper.util.js';\n",
          },
          hierarchyConfig
        );

        try {
          const initial = await lintScenario(fixture.path, [
            'src/_services/worker/worker.service.ts',
          ]);
          expect(initial).toEqual([]);

          nodeFs.rmSync(nodePath.join(fixture.path, 'src/_utils/helper'), {
            recursive: true,
          });
          nodeFs.mkdirSync(
            nodePath.join(fixture.path, 'src/_services/auth/_utils/helper'),
            { recursive: true }
          );
          nodeFs.writeFileSync(
            nodePath.join(
              fixture.path,
              'src/_services/auth/_utils/helper/helper.util.ts'
            ),
            'export const helper = 1;\n'
          );
          nodeFs.writeFileSync(
            nodePath.join(
              fixture.path,
              'src/_services/auth/_utils/helper/index.ts'
            ),
            "export { helper } from './helper.util.js';\n"
          );
          nodeFs.writeFileSync(
            nodePath.join(
              fixture.path,
              'src/_services/worker/worker.service.ts'
            ),
            "import { helper } from '../auth/_utils/helper/index.js';\nexport const worker = helper;\n"
          );

          const after = await lintScenario(fixture.path, [
            'src/_services/worker/worker.service.ts',
          ]);
          expect(
            after.some(
              (message) =>
                message.constraint === 'dependency/private-category-visibility'
            )
          ).toBe(true);
        } finally {
          await fixture.rm();
        }
      });

      it('detects inversion of a Horizontal Hierarchy Rank', async () => {
        const hierarchyConfig = {
          faf: {
            locals: [
              {
                horizontalHierarchies: [[['_utils'], ['_services']]],
                roles: [
                  { category: '_utils', name: 'util' },
                  { category: '_services', name: 'service' },
                ],
                rootLayers: ['src'],
                subGraphRoles: [{ name: 'spec' }],
              },
            ],
          },
        };

        const fixture = await createProject(
          {
            'src/_services/worker/index.ts':
              "export { worker } from './worker.service.js';\n",
            'src/_services/worker/worker.service.ts':
              "import { helper } from '../../_utils/helper/index.js';\nexport const worker = helper;\n",
            'src/_utils/helper/helper.util.ts': 'export const helper = 1;\n',
            'src/_utils/helper/index.ts':
              "export { helper } from './helper.util.js';\n",
          },
          hierarchyConfig
        );

        try {
          const initial = await lintScenario(fixture.path, [
            'src/_services/worker/worker.service.ts',
          ]);
          expect(initial).toEqual([]);

          const invertedConfig = {
            faf: {
              locals: [
                {
                  horizontalHierarchies: [[['_services'], ['_utils']]],
                  roles: [
                    { category: '_utils', name: 'util' },
                    { category: '_services', name: 'service' },
                  ],
                  rootLayers: ['src'],
                  subGraphRoles: [{ name: 'spec' }],
                },
              ],
            },
          };

          nodeFs.writeFileSync(
            nodePath.join(fixture.path, 'faf.config.ts'),
            `export default ${JSON.stringify(invertedConfig)};\n`
          );

          const after = await lintScenario(fixture.path, [
            'src/_services/worker/worker.service.ts',
          ]);
          expect(
            after.some(
              (message) => message.constraint === 'dependency/peer-separation'
            )
          ).toBe(true);
        } finally {
          await fixture.rm();
        }
      });
    });

    describe('updated frontier declarations invalidate previously authorized dependencies', () => {
      it('detects removal of a Root Node from publicRootNodes', async () => {
        const initialConfig = {
          faf: {
            locals: [
              {
                publicRootNodes: ['a/main.ts'],
                roles: [{ category: '_utils', name: 'util' }],
                rootFragments: [{ path: 'a', rootNodes: [['main.ts']] }],
                rootLayers: ['b'],
                subGraphRoles: [{ name: 'spec' }],
                treeDependencies: [{ from: ['b'], to: ['a'] }],
              },
            ],
          },
        };

        const fixture = await createProject(
          {
            'a/main.ts': 'export const main = 1;\n',
            'b/_utils/client/client.util.ts':
              "import { main } from '../../../a/main.js';\nexport const client = main;\n",
            'b/_utils/client/index.ts':
              "export { client } from './client.util.js';\n",
          },
          initialConfig
        );

        try {
          const initial = await lintScenario(fixture.path, [
            'b/_utils/client/client.util.ts',
          ]);
          expect(initial).toEqual([]);

          const updatedConfig = {
            faf: {
              locals: [
                {
                  publicRootNodes: [],
                  roles: [{ category: '_utils', name: 'util' }],
                  rootFragments: [{ path: 'a', rootNodes: [['main.ts']] }],
                  rootLayers: ['b'],
                  subGraphRoles: [{ name: 'spec' }],
                  treeDependencies: [{ from: ['b'], to: ['a'] }],
                },
              ],
            },
          };
          nodeFs.writeFileSync(
            nodePath.join(fixture.path, 'faf.config.ts'),
            `export default ${JSON.stringify(updatedConfig)};\n`
          );

          const after = await lintScenario(fixture.path, [
            'b/_utils/client/client.util.ts',
          ]);
          expect(
            after.some(
              (message) => message.constraint === 'dependency/tree-opacity'
            )
          ).toBe(true);
        } finally {
          await fixture.rm();
        }
      });

      it('detects moving an exposed Root Layer unit into a Fractal Branch', async () => {
        const initialConfig = {
          faf: {
            locals: [
              {
                roles: [{ category: '_utils', name: 'util' }],
                rootLayers: ['a', 'b'],
                subGraphRoles: [{ name: 'spec' }],
                treeDependencies: [{ from: ['b'], to: ['a'] }],
              },
            ],
          },
        };

        const fixture = await createProject(
          {
            'a/_utils/exposed/exposed.util.ts': 'export const exposed = 1;\n',
            'a/_utils/exposed/index.ts':
              "export { exposed } from './exposed.util.js';\n",
            'b/_utils/client/client.util.ts':
              "import { exposed } from '../../../a/_utils/exposed/index.js';\nexport const client = exposed;\n",
            'b/_utils/client/index.ts':
              "export { client } from './client.util.js';\n",
          },
          initialConfig
        );

        try {
          const initial = await lintScenario(fixture.path, [
            'b/_utils/client/client.util.ts',
          ]);
          expect(initial).toEqual([]);

          nodeFs.rmSync(nodePath.join(fixture.path, 'a/_utils/exposed'), {
            recursive: true,
          });
          nodeFs.mkdirSync(
            nodePath.join(fixture.path, 'a/_a@shared/_utils/exposed'),
            { recursive: true }
          );
          nodeFs.writeFileSync(
            nodePath.join(
              fixture.path,
              'a/_a@shared/_utils/exposed/exposed.util.ts'
            ),
            'export const exposed = 1;\n'
          );
          nodeFs.writeFileSync(
            nodePath.join(fixture.path, 'a/_a@shared/_utils/exposed/index.ts'),
            "export { exposed } from './exposed.util.js';\n"
          );
          nodeFs.writeFileSync(
            nodePath.join(fixture.path, 'b/_utils/client/client.util.ts'),
            "import { exposed } from '../../../a/_a@shared/_utils/exposed/index.js';\nexport const client = exposed;\n"
          );

          const after = await lintScenario(fixture.path, [
            'b/_utils/client/client.util.ts',
          ]);
          expect(
            after.some(
              (message) => message.constraint === 'dependency/tree-opacity'
            )
          ).toBe(true);
        } finally {
          await fixture.rm();
        }
      });

      it('detects revocation of an oriented treeDependencies authorization', async () => {
        const initialConfig = {
          faf: {
            locals: [
              {
                publicRootNodes: ['a/main.ts'],
                roles: [{ category: '_utils', name: 'util' }],
                rootFragments: [
                  { path: 'a', rootNodes: [['main.ts']] },
                  { path: 'b', rootNodes: [['main.ts']] },
                ],
                subGraphRoles: [{ name: 'spec' }],
                treeDependencies: [{ from: ['b'], to: ['a'] }],
              },
            ],
          },
        };

        const fixture = await createProject(
          {
            'a/main.ts': 'export const main = 1;\n',
            'b/main.ts':
              "import { main } from '../a/main.js';\nexport const b = main;\n",
          },
          initialConfig
        );

        try {
          const initial = await lintScenario(fixture.path, ['b/main.ts']);
          expect(initial).toEqual([]);

          const updatedConfig = {
            faf: {
              locals: [
                {
                  publicRootNodes: ['a/main.ts'],
                  roles: [{ category: '_utils', name: 'util' }],
                  rootFragments: [
                    { path: 'a', rootNodes: [['main.ts']] },
                    { path: 'b', rootNodes: [['main.ts']] },
                  ],
                  subGraphRoles: [{ name: 'spec' }],
                  treeDependencies: [],
                },
              ],
            },
          };
          nodeFs.writeFileSync(
            nodePath.join(fixture.path, 'faf.config.ts'),
            `export default ${JSON.stringify(updatedConfig)};\n`
          );

          const after = await lintScenario(fixture.path, ['b/main.ts']);
          expect(
            after.some(
              (message) =>
                message.constraint === 'dependency/tree-authorization'
            )
          ).toBe(true);
        } finally {
          await fixture.rm();
        }
      });

      it('detects removal of the consumer file from externalDependencies.from', async () => {
        const initialConfig = {
          faf: {
            locals: [
              {
                externalDependencies: [
                  {
                    from: ['src/main.ts'],
                    to: ['outside.ts'],
                  },
                ],
                roles: [{ category: '_utils', name: 'util' }],
                rootFragments: [
                  { path: 'src', rootNodes: [['main.ts'], ['other.ts']] },
                ],
                subGraphRoles: [{ name: 'spec' }],
              },
            ],
          },
        };

        const fixture = await createProject(
          {
            'outside.ts': 'export const outside = 1;\n',
            'src/main.ts': "import '../outside.js';\nexport const main = 1;\n",
            'src/other.ts': 'export const other = 1;\n',
          },
          initialConfig
        );

        try {
          const initial = await lintScenario(fixture.path, ['src/main.ts']);
          expect(initial).toEqual([]);

          const updatedConfig = {
            faf: {
              locals: [
                {
                  externalDependencies: [
                    {
                      from: ['src/other.ts'],
                      to: ['outside.ts'],
                    },
                  ],
                  roles: [{ category: '_utils', name: 'util' }],
                  rootFragments: [
                    { path: 'src', rootNodes: [['main.ts'], ['other.ts']] },
                  ],
                  subGraphRoles: [{ name: 'spec' }],
                },
              ],
            },
          };
          nodeFs.writeFileSync(
            nodePath.join(fixture.path, 'faf.config.ts'),
            `export default ${JSON.stringify(updatedConfig)};\n`
          );

          const after = await lintScenario(fixture.path, ['src/main.ts']);
          expect(
            after.some(
              (message) =>
                message.constraint === 'dependency/external-dependencies'
            )
          ).toBe(true);
        } finally {
          await fixture.rm();
        }
      });

      it('detects changing a Path Alias base from a Fractal Branch to a Category', async () => {
        const initialConfig = {
          faf: {
            locals: [
              {
                roles: [{ category: '_utils', name: 'util' }],
                rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
                subGraphRoles: [{ name: 'spec' }],
              },
            ],
          },
        };

        const fixture = await createProject(
          {
            'package.json': JSON.stringify({
              imports: { '#shared/*': './src/_src@shared/*' },
              type: 'module',
            }),
            'src/_src@shared/shared.ts': 'export const shared = 1;\n',
            'src/_utils/widget/index.ts':
              "export { widget } from './widget.util.js';\n",
            'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
            'src/main.ts':
              "import { shared } from '#shared/shared.js';\nexport const main = shared;\n",
          },
          initialConfig
        );

        try {
          const initial = await lintScenario(fixture.path, ['src/main.ts']);
          expect(initial).toEqual([]);

          nodeFs.writeFileSync(
            nodePath.join(fixture.path, 'package.json'),
            JSON.stringify({
              imports: { '#shared/*': './src/_utils/*' },
              type: 'module',
            })
          );
          nodeFs.writeFileSync(
            nodePath.join(fixture.path, 'src/main.ts'),
            "import { widget } from '#shared/widget/index.js';\nexport const main = widget;\n"
          );

          const after = await lintScenario(fixture.path, ['src/main.ts']);
          expect(
            after.some(
              (message) =>
                message.constraint === 'dependency/path-alias-anchoring'
            )
          ).toBe(true);
        } finally {
          await fixture.rm();
        }
      });
    });
  });
});
