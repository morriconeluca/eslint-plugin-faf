import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { discoverConfig } from './discover-config.adapter.js';

describe('discoverConfig', () => {
  it('discovers fafconfig.ts in the current working directory', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default {};',
    });

    try {
      const result = discoverConfig({
        workingDirectory: fixture.path,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.configDirectory).toBe(fixture.path);
        expect(result.value.configPath).toBe(
          nodePath.join(fixture.path, 'fafconfig.ts')
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('discovers fafconfig.ts by upward traversal from a nested directory', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default {};',
      'src/nested/sub': {},
    });

    try {
      const nestedWorkingDirectory = nodePath.join(
        fixture.path,
        'src',
        'nested',
        'sub'
      );
      const result = discoverConfig({
        workingDirectory: nestedWorkingDirectory,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.configDirectory).toBe(fixture.path);
        expect(result.value.configPath).toBe(
          nodePath.join(fixture.path, 'fafconfig.ts')
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when upward search finds no fafconfig.ts', async () => {
    const fixture = await createFixture({
      'src/sub': {},
    });

    try {
      const result = discoverConfig({
        workingDirectory: fixture.path,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/missing-config-file');
          expect(outcome.propertyPath).toBe('faf');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('discovers fafconfig.ts using an explicit relative path', async () => {
    const fixture = await createFixture({
      'configs/custom-faf.ts': 'export default {};',
    });

    try {
      const result = discoverConfig({
        configFile: 'configs/custom-faf.ts',
        workingDirectory: fixture.path,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.configDirectory).toBe(
          nodePath.join(fixture.path, 'configs')
        );
        expect(result.value.configPath).toBe(
          nodePath.join(fixture.path, 'configs', 'custom-faf.ts')
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('discovers fafconfig.ts using an explicit absolute path', async () => {
    const fixture = await createFixture({
      'custom-faf.ts': 'export default {};',
    });

    try {
      const absolutePath = nodePath.join(fixture.path, 'custom-faf.ts');
      const result = discoverConfig({
        configFile: absolutePath,
        workingDirectory: fixture.path,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.configDirectory).toBe(fixture.path);
        expect(result.value.configPath).toBe(absolutePath);
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when explicit path does not exist', async () => {
    const fixture = await createFixture({});

    try {
      const nonExistentPath = 'missing-faf.ts';
      const result = discoverConfig({
        configFile: nonExistentPath,
        workingDirectory: fixture.path,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/missing-config-file');
          expect(outcome.propertyPath).toBe('settings.faf.configFile');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when explicit path points to a directory', async () => {
    const fixture = await createFixture({
      'not-a-file': {},
    });

    try {
      const result = discoverConfig({
        configFile: 'not-a-file',
        workingDirectory: fixture.path,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/missing-config-file');
          expect(outcome.normativeReference).toBe('D-09');
          expect(outcome.propertyPath).toBe('settings.faf.configFile');
          expect(outcome.message).toContain('was not found');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('skips directories named fafconfig.ts during upward traversal', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': {},
      'parent/child': {},
      'parent/fafconfig.ts': 'export default {};',
    });

    try {
      const childDirectory = nodePath.join(fixture.path, 'parent', 'child');
      const result = discoverConfig({
        workingDirectory: childDirectory,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.configDirectory).toBe(
          nodePath.join(fixture.path, 'parent')
        );
      }
    } finally {
      await fixture.rm();
    }
  });
});
