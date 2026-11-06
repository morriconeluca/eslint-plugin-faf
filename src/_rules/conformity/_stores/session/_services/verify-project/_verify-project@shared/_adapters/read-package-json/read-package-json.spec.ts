import { createFixture } from 'fs-fixture';
import { describe, expect, it } from 'vitest';

import { readPackageJson } from './read-package-json.adapter.js';

describe('readPackageJson', () => {
  it('returns present false when package.json is absent', async () => {
    const fixture = await createFixture({});

    try {
      const result = readPackageJson({
        directory: fixture.path,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.present).toBe(false);
        expect(result.value.packageJson).toBeUndefined();
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns parsed package.json object when present and valid', async () => {
    const fixture = await createFixture({
      'package.json': JSON.stringify({
        name: 'test-package',
        type: 'module',
        version: '1.0.0',
      }),
    });

    try {
      const result = readPackageJson({
        directory: fixture.path,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.present).toBe(true);
        expect(result.value.packageJson).toEqual({
          name: 'test-package',
          type: 'module',
          version: '1.0.0',
        });
      }
    } finally {
      await fixture.rm();
    }
  });

  it('parses package.json declaring type commonjs successfully', async () => {
    const fixture = await createFixture({
      'package.json': JSON.stringify({
        type: 'commonjs',
      }),
    });

    try {
      const result = readPackageJson({
        directory: fixture.path,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.present).toBe(true);
        expect(result.value.packageJson).toEqual({
          type: 'commonjs',
        });
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when package.json contains invalid JSON syntax', async () => {
    const fixture = await createFixture({
      'package.json': '{ "unclosed": ',
    });

    try {
      const result = readPackageJson({
        directory: fixture.path,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/invalid-package-json');
          expect(outcome.normativeReference).toBe('D-09');
          expect(outcome.propertyPath).toBe('');
          expect(outcome.message).toContain('Failed to parse package.json');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when package.json is a JSON array', async () => {
    const fixture = await createFixture({
      'package.json': JSON.stringify(['item1', 'item2']),
    });

    try {
      const result = readPackageJson({
        directory: fixture.path,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/invalid-package-json');
          expect(outcome.normativeReference).toBe('D-09');
          expect(outcome.propertyPath).toBe('');
          expect(outcome.message).toContain('does not contain a JSON object');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when package.json is a JSON primitive or null', async () => {
    const fixture = await createFixture({
      'package.json': 'null',
    });

    try {
      const result = readPackageJson({
        directory: fixture.path,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/invalid-package-json');
          expect(outcome.normativeReference).toBe('D-09');
          expect(outcome.propertyPath).toBe('');
          expect(outcome.message).toContain('does not contain a JSON object');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when package.json is a directory', async () => {
    const fixture = await createFixture({
      'package.json': {},
    });

    try {
      const result = readPackageJson({
        directory: fixture.path,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/invalid-package-json');
          expect(outcome.normativeReference).toBe('D-09');
          expect(outcome.propertyPath).toBe('');
          expect(outcome.message).toContain('is not a regular file');
        }
      }
    } finally {
      await fixture.rm();
    }
  });
});
