import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  createProject,
  lintProject,
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

const unimplementedParts = ['acyclicity'];

describe('acceptance: faf/conformity', () => {
  const WARMUP_TIMEOUT_MS = 120_000;

  beforeAll(warmupESLint, WARMUP_TIMEOUT_MS);

  it('reports one not-implemented outcome for every unbuilt part, anchored to fafconfig.ts', async () => {
    const fixture = await createProject(conformingTree, config);

    try {
      const results = await lintProject(fixture.path, ['.']);
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const otherMessages = results
        .filter((result) => result.filePath !== configPath)
        .flatMap((result) => result.messages);
      const configMessages =
        results.find((result) => result.filePath === configPath)?.messages ??
        [];
      expect(otherMessages).toEqual([]);
      expect(configMessages).toHaveLength(unimplementedParts.length);
      const names = configMessages.map((message) => {
        expect(message.ruleId).toBe('faf/conformity');
        expect(message.messageId).toBe('unverified');
        expect(message.line).toBe(1);
        expect(message.message).toContain('unverified/not-implemented');
        const matched = /'([^']+)' is not implemented \(D-03\)\./.exec(
          message.message
        );
        return matched?.[1];
      });
      const ordered = names.filter(
        (name): name is string => name !== undefined
      );
      expect(ordered).toEqual(unimplementedParts);
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
        'fafconfig.ts',
        'src/_utils/widget/index.ts',
        'src/_utils/widget/widget.util.ts',
      ]);
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const otherMessages = results
        .filter((result) => result.filePath !== configPath)
        .flatMap((result) => result.messages);
      const configMessages =
        results.find((result) => result.filePath === configPath)?.messages ??
        [];
      expect(otherMessages).toEqual([]);
      expect(configMessages).toHaveLength(unimplementedParts.length);
      expect(
        configMessages.every(
          (message) =>
            message.messageId === 'unverified' &&
            message.message.includes('unverified/not-implemented')
        )
      ).toBe(true);
      expect(verifications).toBe(1);
    } finally {
      nodeFs.renameSync = originalRename;
      await fixture.rm();
    }
  });

  it('reports an unknown property as configuration on fafconfig.ts', async () => {
    const fixture = await createProject(conformingTree, {
      ...config,
      extra: true,
    });

    try {
      const results = await lintProject(fixture.path, ['fafconfig.ts']);
      const messages = results.flatMap((result) => result.messages);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.ruleId).toBe('faf/conformity');
      expect(messages[0]?.messageId).toBe('configuration');
      expect(messages[0]?.message).toContain('configuration/unknown-property');
      expect(results[0]?.filePath).toBe(
        nodePath.join(fixture.path, 'fafconfig.ts')
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

  it('reports a missing fafconfig.ts on every linted file', async () => {
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

  it('produces no configuration outcomes for this repository', async () => {
    const repository = nodePath.resolve(import.meta.dirname, '../..');
    const results = await lintProject(repository, [
      'fafconfig.ts',
      'src/main.ts',
    ]);
    const config = results.flatMap((result) =>
      result.messages.filter((message) => message.messageId === 'configuration')
    );
    expect(config).toEqual([]);
    const otherFamilies = results.flatMap((result) =>
      result.messages
        .filter((message) => message.messageId !== 'configuration')
        .map((message) => ({
          filePath: result.filePath,
          message: message.message,
          messageId: message.messageId,
        }))
    );
    if (otherFamilies.length > 0) {
      console.log(JSON.stringify(otherFamilies));
    }
  }, 30_000);
});
