import { describe, expect, it } from 'vitest';

import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TRawInventoryEntry } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { inventoryFromEntries } from '../../_classify-taxonomy@shared/_mocks/inventory-from-entries.mock.js';
import { selectForeignNodes } from './select-foreign-nodes.util.js';

const createRawEntry = (
  path: string,
  kind: 'directory' | 'file'
): TRawInventoryEntry => ({
  isSymlink: false,
  kind,
  path,
  realPath: path,
});

const createMinimalTree = (
  originPath: string,
  overrides?: Partial<TEffectiveTree>
): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 1,
  },
  externalDependencyPairs: [],
  foreignDomains: overrides?.foreignDomains ?? [],
  foreignNodes: overrides?.foreignNodes ?? {
    families: [],
    individualPaths: [],
  },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-fragment',
  originPath,
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
  ...overrides,
});

describe('selectForeignNodes', () => {
  it('returns empty selection when tree origin does not exist in inventory', () => {
    const raw: TRawInventoryEntry[] = [createRawEntry('other', 'directory')];
    const buildResult = inventoryFromEntries(raw, ['other']);
    const tree = createMinimalTree('src');
    const result = selectForeignNodes(buildResult, tree);
    expect(result.foreignDomainItemIds.size).toBe(0);
    expect(result.foreignNodeItemIds.size).toBe(0);
  });

  it('returns empty selection when the origin is a file', () => {
    const raw: TRawInventoryEntry[] = [createRawEntry('src', 'file')];
    const buildResult = inventoryFromEntries(raw, ['src']);
    const result = selectForeignNodes(
      buildResult,
      createMinimalTree('src', {
        foreignDomains: ['src'],
        foreignNodes: {
          families: [],
          individualPaths: ['src'],
        },
      })
    );
    expect(result.foreignNodePaths.size).toBe(0);
    expect(result.foreignDomainPaths.size).toBe(0);
  });

  describe('applies patterns to files within the src scope', () => {
    const rawEntries: TRawInventoryEntry[] = [
      createRawEntry('src', 'directory'),
      createRawEntry('src/README.md', 'file'),
      createRawEntry('src/app', 'directory'),
      createRawEntry('src/app/README.md', 'file'),
      createRawEntry('src/.notes.md', 'file'),
      createRawEntry('src/.md', 'file'),
      createRawEntry('src/README.MD', 'file'),
      createRawEntry('other', 'directory'),
      createRawEntry('other/README.md', 'file'),
      createRawEntry('src/types', 'directory'),
      createRawEntry('src/types/globals.d.ts', 'file'),
      createRawEntry('src/docs', 'directory'),
      createRawEntry('src/docs/a.md', 'file'),
      createRawEntry('src/docs/deep', 'directory'),
      createRawEntry('src/docs/deep/a.md', 'file'),
      createRawEntry('src/a.md', 'file'),
      createRawEntry('src/ab.md', 'file'),
      createRawEntry('src/report[1].md', 'file'),
      createRawEntry('src/report1.md', 'file'),
      createRawEntry('src/_[todo-id]', 'directory'),
      createRawEntry('src/_[todo-id]/README.md', 'file'),
    ];

    const testCases: readonly {
      expected: boolean;
      file: string;
      pattern: string;
    }[] = [
      { expected: true, file: 'src/README.md', pattern: '*.md' },
      { expected: true, file: 'src/app/README.md', pattern: '*.md' },
      { expected: true, file: 'src/.notes.md', pattern: '*.md' },
      { expected: true, file: 'src/.md', pattern: '*.md' },
      { expected: false, file: 'src/README.MD', pattern: '*.md' },
      { expected: false, file: 'other/README.md', pattern: '*.md' },
      { expected: true, file: 'src/types/globals.d.ts', pattern: '*.d.ts' },
      { expected: true, file: 'src/docs/a.md', pattern: 'docs/*.md' },
      { expected: false, file: 'src/docs/deep/a.md', pattern: 'docs/*.md' },
      { expected: true, file: 'src/README.md', pattern: '**/*.md' },
      { expected: true, file: 'src/docs/a.md', pattern: 'docs/**/*.md' },
      { expected: true, file: 'src/docs/deep/a.md', pattern: 'docs/**/*.md' },
      { expected: true, file: 'src/a.md', pattern: '?.md' },
      { expected: false, file: 'src/ab.md', pattern: '?.md' },
      { expected: true, file: 'src/report[1].md', pattern: 'report[1].md' },
      { expected: false, file: 'src/report1.md', pattern: 'report[1].md' },
      {
        expected: true,
        file: 'src/_[todo-id]/README.md',
        pattern: '_[todo-id]/*.md',
      },
    ];

    for (const testCase of testCases) {
      it(`pattern "${testCase.pattern}" on file "${testCase.file}" -> ${testCase.expected ? 'select' : 'not select'}`, () => {
        const buildResult = inventoryFromEntries(rawEntries, ['src']);
        const tree = createMinimalTree('src', {
          foreignNodes: {
            families: [
              {
                paths: ['src'],
                patterns: [testCase.pattern],
              },
            ],
            individualPaths: [],
          },
        });

        const result = selectForeignNodes(buildResult, tree);
        expect(result.foreignNodePaths.has(testCase.file)).toBe(
          testCase.expected
        );
      });
    }
  });

  describe('unions Foreign selections without introducing new classifications', () => {
    it('unifies foreign domains, individual files, and families without duplicating', () => {
      const rawEntries: TRawInventoryEntry[] = [
        createRawEntry('src', 'directory'),
        createRawEntry('src/_tooling', 'directory'),
        createRawEntry('src/_tooling/nested', 'directory'),
        createRawEntry('src/_tooling/nested/config.json', 'file'),
        createRawEntry('src/_tooling/tool.ts', 'file'),
        createRawEntry('src/vite-env.d.ts', 'file'),
        createRawEntry('src/README.md', 'file'),
      ];

      const buildResult = inventoryFromEntries(rawEntries, ['src']);
      const tree = createMinimalTree('src', {
        foreignDomains: ['src/_tooling'],
        foreignNodes: {
          families: [
            {
              paths: ['src'],
              patterns: ['*.md', '*.d.ts'],
            },
          ],
          individualPaths: ['src/vite-env.d.ts'],
        },
      });

      const result = selectForeignNodes(buildResult, tree);

      expect(result.foreignDomainPaths.has('src/_tooling')).toBe(true);
      expect(result.foreignDomainPaths.has('src/_tooling/nested')).toBe(true);

      expect(result.foreignNodePaths.has('src/_tooling/tool.ts')).toBe(true);
      expect(
        result.foreignNodePaths.has('src/_tooling/nested/config.json')
      ).toBe(true);
      expect(result.foreignNodePaths.has('src/vite-env.d.ts')).toBe(true);
      expect(result.foreignNodePaths.has('src/README.md')).toBe(true);

      expect(result.foreignDomainItemIds.size).toBe(2);
      expect(result.foreignNodeItemIds.size).toBe(4);
    });

    it('ignores foreign domain paths or individual files outside tree origin or nonexistent', () => {
      const rawEntries: TRawInventoryEntry[] = [
        createRawEntry('src', 'directory'),
        createRawEntry('src/file.ts', 'file'),
        createRawEntry('other', 'directory'),
        createRawEntry('other/file.ts', 'file'),
      ];

      const buildResult = inventoryFromEntries(rawEntries, ['src', 'other']);
      const tree = createMinimalTree('src', {
        foreignDomains: ['nonexistent', 'other/outside-dir', 'src/file.ts'],
        foreignNodes: {
          families: [
            {
              paths: ['src/file.ts', 'nonexistent', 'other'],
              patterns: ['*'],
            },
            {
              paths: ['src'],
              patterns: ['[invalid-globstar***'],
            },
          ],
          individualPaths: ['nonexistent.ts', 'other/file.ts', 'src'],
        },
      });

      const result = selectForeignNodes(buildResult, tree);
      expect(result.foreignDomainItemIds.size).toBe(0);
      expect(result.foreignNodeItemIds.size).toBe(0);
    });
  });

  describe('repeats the local Markdown family to preserve it after replacement', () => {
    it('selects markdown files when family is present and deselects when family is absent', () => {
      const rawEntries: TRawInventoryEntry[] = [
        createRawEntry('src', 'directory'),
        createRawEntry('src/app', 'directory'),
        createRawEntry('src/app/README.md', 'file'),
        createRawEntry('src/vite-env.d.ts', 'file'),
      ];

      const buildResult = inventoryFromEntries(rawEntries, ['src']);
      const treeWithMarkdown = createMinimalTree('src', {
        foreignNodes: {
          families: [
            {
              paths: ['src'],
              patterns: ['*.md'],
            },
          ],
          individualPaths: ['src/vite-env.d.ts'],
        },
      });

      const resultWithMarkdown = selectForeignNodes(
        buildResult,
        treeWithMarkdown
      );
      expect(resultWithMarkdown.foreignNodePaths.has('src/app/README.md')).toBe(
        true
      );
      expect(resultWithMarkdown.foreignNodePaths.has('src/vite-env.d.ts')).toBe(
        true
      );

      const treeWithoutMarkdown = createMinimalTree('src', {
        foreignNodes: {
          families: [],
          individualPaths: ['src/vite-env.d.ts'],
        },
      });

      const resultWithoutMarkdown = selectForeignNodes(
        buildResult,
        treeWithoutMarkdown
      );
      expect(
        resultWithoutMarkdown.foreignNodePaths.has('src/app/README.md')
      ).toBe(false);
      expect(
        resultWithoutMarkdown.foreignNodePaths.has('src/vite-env.d.ts')
      ).toBe(true);
    });
  });

  it('handles root scope "." when tree is at root', () => {
    const rawEntries: TRawInventoryEntry[] = [
      createRawEntry('.', 'directory'),
      createRawEntry('README.md', 'file'),
    ];

    const buildResult = inventoryFromEntries(rawEntries, ['.']);
    const tree = createMinimalTree('.', {
      foreignNodes: {
        families: [
          {
            paths: ['.'],
            patterns: ['*.md'],
          },
        ],
        individualPaths: [],
      },
    });

    const result = selectForeignNodes(buildResult, tree);
    expect(result.foreignNodePaths.has('README.md')).toBe(true);
  });
});
