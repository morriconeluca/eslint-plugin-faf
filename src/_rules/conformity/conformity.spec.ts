import { Linter } from 'eslint';
import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { parser as tsParser } from 'typescript-eslint';
import { beforeEach, describe, expect, it } from 'vitest';

import { session } from './_stores/session/index.js';
import { createConformity } from './conformity.rule.js';

const configSource = `export default {
  faf: {
    locals: [
      {
        roles: [{ name: 'util', category: '_utils' }],
        rootLayers: ['src'],
      },
    ],
  },
};
`;

const runLint = (
  cwd: string,
  filePath: string,
  code: string,
  configFile?: string
): Linter.LintMessage[] => {
  const linter = new Linter({ cwd });
  const rule = createConformity('0.5.0');
  return linter.verify(
    code,
    {
      files: ['**/*.ts'],
      languageOptions: { parser: tsParser },
      plugins: { faf: { rules: { conformity: rule } } },
      rules: { 'faf/conformity': 'error' },
      ...(configFile !== undefined && { settings: { faf: { configFile } } }),
    },
    filePath
  );
};

const countCacheWrites = (directory: string, action: () => void): number => {
  const cachePath = nodePath.join(
    nodeFs.realpathSync(directory),
    'node_modules/.cache/eslint-plugin-faf/records.cache'
  );
  const originalRename = nodeFs.renameSync;
  let writes = 0;
  nodeFs.renameSync = (from, to) => {
    if (to === cachePath) {
      writes += 1;
    }
    originalRename(from, to);
  };
  try {
    action();
  } finally {
    nodeFs.renameSync = originalRename;
  }
  return writes;
};

describe('conformity', () => {
  beforeEach(() => {
    session.clear();
  });

  it('exposes one message per outcome family and no autofix or options', () => {
    const rule = createConformity('0.5.0');
    expect(rule.meta?.type).toBe('problem');
    expect(rule.meta?.schema).toEqual([]);
    expect(rule.meta?.docs?.description).toBe(
      'Verify that the project conforms to the Fractal Architecture Framework.'
    );
    expect(Object.hasOwn(rule.meta ?? {}, 'fix')).toBe(false);
    expect(rule.meta?.messages).toEqual({
      acyclicity: '{{constraint}}: {{message}} ({{reference}}).',
      classification: '{{constraint}}: {{message}} ({{reference}}).',
      configuration: '{{constraint}}: {{message}} ({{reference}}).',
      dependency: '{{constraint}}: {{message}} ({{reference}}).',
      symbol: '{{constraint}}: {{message}} ({{reference}}).',
      unverified: '{{constraint}}: {{message}} ({{reference}}).',
    });
  });

  it('reports configuration discovery failure when faf.config.ts is missing', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const app = 1;\n',
    });
    try {
      const messages = runLint(
        fixture.path,
        nodePath.join(fixture.path, 'src/app.ts'),
        'export const app = 1;\n'
      );
      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toContain(
        'configuration/missing-config-file'
      );
      expect(messages[0]?.line).toBe(1);
      expect(messages[0]?.column).toBe(1);
    } finally {
      await fixture.rm();
    }
  });

  it('verifies once across multiple conforming files via session memo and invalidates on unsaved edit', async () => {
    const fixture = await createFixture({
      'custom/faf.config.ts': configSource,
      'custom/package.json': JSON.stringify({ type: 'module' }),
      'custom/src/_utils/widget/index.ts':
        "export { widget } from './widget.util.js';\n",
      'custom/src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
    });

    try {
      const indexFile = nodePath.join(
        fixture.path,
        'custom/src/_utils/widget/index.ts'
      );
      const utilFile = nodePath.join(
        fixture.path,
        'custom/src/_utils/widget/widget.util.ts'
      );

      const configDirectory = nodePath.join(fixture.path, 'custom');
      const firstRunWrites = countCacheWrites(configDirectory, () => {
        expect(
          runLint(
            fixture.path,
            indexFile,
            nodeFs.readFileSync(indexFile, 'utf8'),
            'custom/faf.config.ts'
          )
        ).toEqual([]);
        expect(
          runLint(
            fixture.path,
            utilFile,
            nodeFs.readFileSync(utilFile, 'utf8'),
            'custom/faf.config.ts'
          )
        ).toEqual([]);
      });
      expect(firstRunWrites).toBe(1);

      let editedMessages: Linter.LintMessage[] = [];
      const secondRunWrites = countCacheWrites(configDirectory, () => {
        editedMessages = runLint(
          fixture.path,
          indexFile,
          "import { missing } from './missing.js';\nexport { widget } from './widget.util.js';\n",
          'custom/faf.config.ts'
        );
      });
      expect(secondRunWrites).toBe(1);
      expect(editedMessages).toHaveLength(1);
      expect(editedMessages[0]?.message).toContain(
        'unverified/unresolved-import'
      );
      expect(editedMessages[0]?.line).toBe(1);
      expect(editedMessages[0]?.column).toBe(1);
    } finally {
      await fixture.rm();
    }
  });
});
