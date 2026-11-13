import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { loadConfig } from './load-config.adapter.js';

describe('loadConfig', () => {
  it('loads valid fafconfig.ts without package.json using default timeout', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default { faf: { locals: [] } };',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.config).toEqual({ faf: { locals: [] } });
        expect(result.value.configDirectory).toBe(fixture.path);
        expect(result.value.configPath).toBe(configPath);
        expect(result.value.loadedFiles).toContain(configPath);
      }
    } finally {
      await fixture.rm();
    }
  });

  it('loads a composite object with comments, constants, imports and spread', async () => {
    const fixture = await createFixture({
      'constants.ts': 'export const sharedLocals = [{ name: "local-tree" }];',
      'fafconfig.ts': `
        import { sharedLocals } from "./constants.ts";
        const extra = { verified: true };
        export default {
          faf: {
            locals: [...sharedLocals],
            ...extra,
          },
        };
      `,
      'package.json': JSON.stringify({ type: 'module' }),
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const constantsPath = nodePath.join(fixture.path, 'constants.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.config).toEqual({
          faf: {
            locals: [{ name: 'local-tree' }],
            verified: true,
          },
        });
        expect(result.value.loadedFiles).toContain(configPath);
        expect(result.value.loadedFiles).toContain(constantsPath);
      }
    } finally {
      await fixture.rm();
    }
  });

  it('loads configuration with top-level await', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': `
        const asyncValue = await Promise.resolve({ dynamic: true });
        export default { faf: asyncValue };
      `,
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.config).toEqual({
          faf: { dynamic: true },
        });
      }
    } finally {
      await fixture.rm();
    }
  });

  it('loads configuration with type-only import without extension', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': `
        import type { TExtra } from "./types";
        const value = { typed: true };
        export default { faf: value };
      `,
      'types.ts': 'export type TExtra = { readonly typed: boolean };',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.config).toEqual({
          faf: { typed: true },
        });
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome for relative import without extension', async () => {
    const fixture = await createFixture({
      'dep.ts': 'export const item = 10;',
      'fafconfig.ts': 'import { item } from "./dep"; export default { item };',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe(
            'configuration/unresolved-relative-import'
          );
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('default');
          expect(outcome.message).toContain(
            'Relative import without explicit file extension violates configuration constraints'
          );
          expect(outcome.message).toContain('ERR_MODULE_NOT_FOUND');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when fafconfig uses non-strippable typescript enum', async () => {
    const fixture = await createFixture({
      'fafconfig.ts':
        'export enum InvalidEnum { A, B }; export default { InvalidEnum };',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe(
            'configuration/unsupported-typescript-syntax'
          );
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('default');
          expect(outcome.message).toContain(
            'Non-strippable TypeScript syntax violates configuration constraints'
          );
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when nearest package.json declares type commonjs', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default { ok: true };',
      'package.json': JSON.stringify({ type: 'commonjs' }),
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe(
            'configuration/commonjs-package-type'
          );
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('default');
          expect(outcome.message).toContain(
            'Package configuration declaring "type": "commonjs" violates configuration constraints'
          );
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when export default is missing', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export const namedOnly = 42;',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe(
            'configuration/missing-default-export'
          );
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('default');
          expect(outcome.message).toContain('must declare a default export');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when export default is a function', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default function getConfig() { return {}; };',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe(
            'configuration/invalid-default-export-function'
          );
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('default');
          expect(outcome.message).toContain(
            'cannot export a function as its default export'
          );
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when export default is a Promise', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default Promise.resolve({ async: true });',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe(
            'configuration/invalid-default-export-promise'
          );
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('default');
          expect(outcome.message).toContain(
            'cannot export a Promise as its default export'
          );
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when default export contains a nested function', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default { faf: { transform: () => 123 } };',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe(
            'configuration/unclonable-config-value'
          );
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('default');
          expect(outcome.message).toContain(
            'Exported configuration default value could not be cloned via structured clone'
          );
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('reloads configuration with updated value after imported module is modified', async () => {
    const fixture = await createFixture({
      'dep.ts': 'export const version = 1;',
      'fafconfig.ts':
        'import { version } from "./dep.ts"; export default { version };',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const dependencyPath = nodePath.join(fixture.path, 'dep.ts');

      const initialResult = loadConfig({ configPath });
      expect(initialResult.ok).toBe(true);
      if (initialResult.ok) {
        expect(initialResult.value.config).toEqual({ version: 1 });
      }

      nodeFs.writeFileSync(dependencyPath, 'export const version = 2;');

      const reloadedResult = loadConfig({ configPath });
      expect(reloadedResult.ok).toBe(true);
      if (reloadedResult.ok) {
        expect(reloadedResult.value.config).toEqual({ version: 2 });
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns unverified outcome when worker execution times out', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': `
        await new Promise((resolve) => setTimeout(resolve, 5000));
        export default { ok: true };
      `,
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({
        configPath,
        timeoutMs: 50,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('unverified');
        if (outcome?.family === 'unverified') {
          expect(outcome.constraint).toBe('unverified/config-loading-timeout');
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.message).toContain(
            'timed out during configuration loading'
          );
          expect(outcome.reason).toBe(
            'Worker execution exceeded timeout budget of 50ms'
          );
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when configuration path is a directory', async () => {
    const fixture = await createFixture({
      'not-a-file': {},
    });

    try {
      const directoryPath = nodePath.join(fixture.path, 'not-a-file');
      const result = loadConfig({ configPath: directoryPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/missing-config-file');
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('faf');
          expect(outcome.message).toContain('was not found');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when configuration file does not exist', async () => {
    const fixture = await createFixture({});

    try {
      const missingConfigPath = nodePath.join(fixture.path, 'missing.ts');
      const result = loadConfig({ configPath: missingConfigPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/missing-config-file');
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('faf');
          expect(outcome.message).toContain('was not found');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('returns configuration outcome when syntax error occurs in configuration file', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': 'export default { unclosed: ',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/config-load-failure');
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('default');
          expect(outcome.message).toContain('Failed to load fafconfig.ts');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('handles unexpected non-standard payload from worker gracefully', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': `
        const { workerData } = await import("node:worker_threads");
        workerData.port.postMessage({ unrecognized: true });
        export default {};
      `,
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/config-load-failure');
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('default');
          expect(outcome.message).toContain(
            'Worker terminated without transmitting a valid configuration payload'
          );
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('handles closed port without transmitting a payload gracefully', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': `
        const { workerData } = await import("node:worker_threads");
        workerData.port.close();
        export default {};
      `,
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/config-load-failure');
          expect(outcome.normativeReference).toBe('FAF §1.2');
          expect(outcome.propertyPath).toBe('default');
          expect(outcome.message).toContain(
            'Worker terminated without transmitting a valid configuration payload'
          );
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('handles worker success payload with non-string elements in loadedFiles', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': `
        const { workerData } = await import("node:worker_threads");
        workerData.port.postMessage({
          defaultExport: { valid: true },
          loadedFiles: [123, 456],
          ok: true,
        });
        export default {};
      `,
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/config-load-failure');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('handles worker failure payload with non-configuration constraint', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': `
        const { workerData } = await import("node:worker_threads");
        workerData.port.postMessage({
          constraint: "other/unexpected-prefix",
          message: "Failure with non-configuration prefix",
          ok: false,
        });
        export default {};
      `,
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/config-load-failure');
        }
      }
    } finally {
      await fixture.rm();
    }
  });

  it('handles worker payload with non-boolean ok flag', async () => {
    const fixture = await createFixture({
      'fafconfig.ts': `
        const { workerData } = await import("node:worker_threads");
        workerData.port.postMessage({
          defaultExport: { valid: true },
          loadedFiles: [],
          ok: "truthy-string",
        });
        export default {};
      `,
    });

    try {
      const configPath = nodePath.join(fixture.path, 'fafconfig.ts');
      const result = loadConfig({ configPath });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes).toHaveLength(1);
        const outcome = result.outcomes[0];
        expect(outcome?.family).toBe('configuration');
        if (outcome?.family === 'configuration') {
          expect(outcome.constraint).toBe('configuration/config-load-failure');
        }
      }
    } finally {
      await fixture.rm();
    }
  });
});
