import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import type { TAnchoredOutcome } from '../../_conformity@shared/_types/anchored-outcome.type.js';

import { createOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import { session } from './session.store.js';

const configSource = `export default { faf: { locals: [{ roles: [{ name: "util", category: "_utils" }], rootLayers: ["src"] }] } };`;

const conformingTree = {
  'external/helper.ts': 'export const helper = 1;\n',
  'faf.config.ts': configSource,
  'package.json': JSON.stringify({ type: 'module' }),
  'shared.js': 'export const shared = 1;\n',
  'src/_utils/widget/index.ts': "export { widget } from './widget.util.js';\n",
  'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
};

describe('session', () => {
  beforeEach(() => {
    session.clear();
  });

  it('returns a miss before saving and a hit afterwards for matching files', async () => {
    const fixture = await createFixture(conformingTree);

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const indexFile = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const widgetFile = nodePath.join(
        fixture.path,
        'src/_utils/widget/widget.util.ts'
      );
      const indexText = "export { widget } from './widget.util.js';\n";

      const initial = session.lookup({
        configPath: 'faf.config.ts',
        filename: indexFile,
        sourceText: indexText,
        workingDirectory: fixture.path,
      });
      expect(initial).toEqual({
        configPath,
        hit: false,
        overlayKey: '',
        overlayText: null,
      });
      if (initial.hit) {
        return;
      }

      const anchored: readonly TAnchoredOutcome[] = [
        {
          anchorPath: indexFile,
          outcome: createOutcome('unverified/unresolved-import', {
            element: 'src/_utils/widget/index.ts',
            reason: 'missing',
          }),
          position: { column: 1, line: 1 },
        },
      ];
      session.save({
        baseDirectory: fixture.path,
        byFile: new Map([[indexFile, anchored]]),
        configPath: initial.configPath,
        externalFiles: [nodePath.join(fixture.path, 'external/helper.ts')],
        loadedFiles: [nodePath.join(fixture.path, 'shared.js')],
        overrideKey: initial.overlayKey,
        treeOrigins: [nodePath.join(fixture.path, 'src')],
      });

      const hitOnIndex = session.lookup({
        configPath,
        filename: indexFile,
        sourceText: indexText,
        workingDirectory: fixture.path,
      });
      expect(hitOnIndex).toEqual({ hit: true, outcomes: anchored });

      const hitOnWidget = session.lookup({
        configPath,
        filename: widgetFile,
        sourceText: 'export const widget = 1;\n',
        workingDirectory: fixture.path,
      });
      expect(hitOnWidget).toEqual({ hit: true, outcomes: [] });
    } finally {
      await fixture.rm();
    }
  });

  it('invalidates the memo when the linted source overlay changes', async () => {
    const fixture = await createFixture(conformingTree);

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const filename = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const diskText = "export { widget } from './widget.util.js';\n";

      session.save({
        baseDirectory: fixture.path,
        byFile: new Map(),
        configPath,
        externalFiles: [],
        loadedFiles: [],
        overrideKey: '',
        treeOrigins: [nodePath.join(fixture.path, 'src')],
      });

      const unsavedText = 'export const edited = 2;\n';
      const miss = session.lookup({
        configPath,
        filename,
        sourceText: unsavedText,
        workingDirectory: fixture.path,
      });
      expect(miss).toEqual({
        configPath,
        hit: false,
        overlayKey: `${nodePath.resolve(filename)}\0${unsavedText}`,
        overlayText: unsavedText,
      });

      if (!miss.hit) {
        session.save({
          baseDirectory: fixture.path,
          byFile: new Map(),
          configPath: miss.configPath,
          externalFiles: [],
          loadedFiles: [],
          overrideKey: miss.overlayKey,
          treeOrigins: [nodePath.join(fixture.path, 'src')],
        });
      }

      expect(
        session.lookup({
          configPath,
          filename,
          sourceText: unsavedText,
          workingDirectory: fixture.path,
        }).hit
      ).toBe(true);
      expect(
        session.lookup({
          configPath,
          filename,
          sourceText: diskText,
          workingDirectory: fixture.path,
        }).hit
      ).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('invalidates the memo when watched configuration, loaded, package, or external files change', async () => {
    const fixture = await createFixture(conformingTree);

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const filename = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const query = {
        configPath,
        filename,
        sourceText: "export { widget } from './widget.util.js';\n",
        workingDirectory: fixture.path,
      };
      const saveSnapshot = (): void => {
        session.save({
          baseDirectory: fixture.path,
          byFile: new Map(),
          configPath,
          externalFiles: [nodePath.join(fixture.path, 'external/helper.ts')],
          loadedFiles: [nodePath.join(fixture.path, 'shared.js')],
          overrideKey: '',
          treeOrigins: [nodePath.join(fixture.path, 'src')],
        });
      };

      saveSnapshot();
      expect(session.lookup(query).hit).toBe(true);

      nodeFs.writeFileSync(
        nodePath.join(fixture.path, 'shared.js'),
        'export const shared = 2;\n'
      );
      expect(session.lookup(query).hit).toBe(false);

      saveSnapshot();
      nodeFs.writeFileSync(
        nodePath.join(fixture.path, 'package.json'),
        JSON.stringify({ description: 'updated', type: 'module' })
      );
      expect(session.lookup(query).hit).toBe(false);

      saveSnapshot();
      nodeFs.writeFileSync(
        nodePath.join(fixture.path, 'external/helper.ts'),
        'export const helper = 2;\n'
      );
      expect(session.lookup(query).hit).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('invalidates the memo when a tree file is added, modified, or removed and when cleared', async () => {
    const fixture = await createFixture(conformingTree);

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const filename = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const query = {
        configPath,
        filename,
        sourceText: "export { widget } from './widget.util.js';\n",
        workingDirectory: fixture.path,
      };
      const saveSnapshot = (): void => {
        session.save({
          baseDirectory: fixture.path,
          byFile: new Map(),
          configPath,
          externalFiles: [],
          loadedFiles: [],
          overrideKey: '',
          treeOrigins: [nodePath.join(fixture.path, 'src')],
        });
      };

      saveSnapshot();
      const extraFile = nodePath.join(
        fixture.path,
        'src/_utils/widget/extra.ts'
      );
      nodeFs.writeFileSync(extraFile, 'export const extra = 1;\n');
      expect(session.lookup(query).hit).toBe(false);

      saveSnapshot();
      nodeFs.writeFileSync(
        nodePath.join(fixture.path, 'src/_utils/widget/widget.util.ts'),
        'export const widget = 2;\n'
      );
      expect(session.lookup(query).hit).toBe(false);

      saveSnapshot();
      nodeFs.rmSync(extraFile);
      expect(session.lookup(query).hit).toBe(false);

      saveSnapshot();
      expect(session.lookup(query).hit).toBe(true);
      session.clear();
      expect(session.lookup(query).hit).toBe(false);
    } finally {
      await fixture.rm();
    }
  });
});
