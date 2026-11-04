import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import v8 from 'node:v8';
import { describe, expect, it, vi } from 'vitest';

import type { TModuleRecord } from '../../_types/module-record.type.js';
import type { TModuleRecordCachePayload } from './write-module-record-cache.type.js';

import { MODULE_RECORD_CACHE_SCHEMA_VERSION } from '../../_constants/module-record-cache.constant.js';
import { writeModuleRecordCache } from './write-module-record-cache.adapter.js';

const CACHE_RELATIVE_DIR = 'node_modules/.cache/eslint-plugin-faf';
const CACHE_FILE_NAME = 'records.cache';

const sampleRecord: TModuleRecord = {
  exports: [
    {
      exportedName: 'bar',
      isTypeOnly: false,
      origin: { symbolName: 'bar', type: 'local-symbol' },
      position: { column: 1, line: 1 },
    },
  ],
  imports: [],
  language: 'script',
  symbols: [
    {
      name: 'bar',
      position: { column: 1, line: 1 },
      space: 'value',
    },
  ],
  unsupportedSyntaxes: [],
};

const cacheFilePath = (baseDirectory: string): string =>
  nodePath.join(baseDirectory, CACHE_RELATIVE_DIR, CACHE_FILE_NAME);

const payloadFor = (
  entries: ReadonlyMap<string, TModuleRecord>
): TModuleRecordCachePayload => ({
  entries: [...entries],
  packageVersion: '0.5.0',
  schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
});

describe('writeModuleRecordCache', () => {
  it('creates directory and atomically writes valid cache file', async () => {
    const fixture = await createFixture({});
    try {
      const entries = new Map<string, TModuleRecord>([['key1', sampleRecord]]);
      writeModuleRecordCache({
        baseDirectory: fixture.path,
        entries,
        packageVersion: '0.5.0',
      });

      const targetPath = cacheFilePath(fixture.path);
      expect(nodeFs.existsSync(targetPath)).toBe(true);
      expect(nodeFs.readFileSync(targetPath)).toEqual(
        v8.serialize(payloadFor(entries))
      );

      const cacheDirectory = nodePath.join(fixture.path, CACHE_RELATIVE_DIR);
      const temporaryFiles = nodeFs
        .readdirSync(cacheDirectory)
        .filter((fileName) => fileName.endsWith('.tmp'));
      expect(temporaryFiles).toHaveLength(0);
    } finally {
      await fixture.rm();
    }
  });

  it('overwrites existing cache file atomically', async () => {
    const fixture = await createFixture({});
    try {
      const initialEntries = new Map<string, TModuleRecord>([
        ['k1', sampleRecord],
      ]);
      writeModuleRecordCache({
        baseDirectory: fixture.path,
        entries: initialEntries,
        packageVersion: '0.5.0',
      });

      const updatedRecord: TModuleRecord = {
        ...sampleRecord,
        language: 'binary',
      };
      const updatedEntries = new Map<string, TModuleRecord>([
        ['k1', updatedRecord],
        ['k2', sampleRecord],
      ]);
      writeModuleRecordCache({
        baseDirectory: fixture.path,
        entries: updatedEntries,
        packageVersion: '0.5.0',
      });

      expect(nodeFs.readFileSync(cacheFilePath(fixture.path))).toEqual(
        v8.serialize(payloadFor(updatedEntries))
      );
    } finally {
      await fixture.rm();
    }
  });

  it('simulates consecutive saves on distinct temporary files and leaves a valid file', async () => {
    const fixture = await createFixture({});
    const spy = vi.spyOn(nodeFs, 'writeFileSync');
    try {
      const entries1 = new Map<string, TModuleRecord>([
        ['file1', sampleRecord],
      ]);
      const entries2 = new Map<string, TModuleRecord>([
        ['file2', sampleRecord],
      ]);

      writeModuleRecordCache({
        baseDirectory: fixture.path,
        entries: entries1,
        packageVersion: '0.5.0',
      });
      writeModuleRecordCache({
        baseDirectory: fixture.path,
        entries: entries2,
        packageVersion: '0.5.0',
      });

      const temporaryPaths = spy.mock.calls
        .map((call) => String(call[0]))
        .filter((filePath) => filePath.endsWith('.tmp'));
      expect(temporaryPaths).toHaveLength(2);
      expect(temporaryPaths[0]).not.toBe(temporaryPaths[1]);
      expect(nodeFs.readFileSync(cacheFilePath(fixture.path))).toEqual(
        v8.serialize(payloadFor(entries2))
      );
    } finally {
      spy.mockRestore();
      await fixture.rm();
    }
  });

  it('does not throw when the cache directory is not writable', async () => {
    const fixture = await createFixture({});
    const cacheDirectory = nodePath.join(fixture.path, CACHE_RELATIVE_DIR);
    nodeFs.mkdirSync(cacheDirectory, { recursive: true });
    nodeFs.chmodSync(cacheDirectory, 0);
    try {
      const entries = new Map<string, TModuleRecord>([['k', sampleRecord]]);
      expect(() => {
        writeModuleRecordCache({
          baseDirectory: fixture.path,
          entries,
          packageVersion: '0.5.0',
        });
      }).not.toThrow();
      expect(nodeFs.existsSync(cacheFilePath(fixture.path))).toBe(false);
    } finally {
      nodeFs.chmodSync(cacheDirectory, 0o700);
      await fixture.rm();
    }
  });

  it('does not throw when the base directory cannot receive the cache directory', async () => {
    const fixture = await createFixture({});
    nodeFs.chmodSync(fixture.path, 0);
    try {
      expect(() => {
        writeModuleRecordCache({
          baseDirectory: fixture.path,
          entries: new Map<string, TModuleRecord>([['k', sampleRecord]]),
          packageVersion: '0.5.0',
        });
      }).not.toThrow();
    } finally {
      nodeFs.chmodSync(fixture.path, 0o700);
      await fixture.rm();
    }
  });

  it('removes the temporary file and does not throw when rename cannot replace the cache path', async () => {
    const fixture = await createFixture({});
    try {
      const cacheDirectory = nodePath.join(fixture.path, CACHE_RELATIVE_DIR);
      nodeFs.mkdirSync(cacheDirectory, { recursive: true });

      const targetPath = nodePath.join(cacheDirectory, CACHE_FILE_NAME);
      nodeFs.mkdirSync(targetPath);

      const entries = new Map<string, TModuleRecord>([['k', sampleRecord]]);
      expect(() => {
        writeModuleRecordCache({
          baseDirectory: fixture.path,
          entries,
          packageVersion: '0.5.0',
        });
      }).not.toThrow();
      expect(nodeFs.statSync(targetPath).isDirectory()).toBe(true);
      const temporaryFiles = nodeFs
        .readdirSync(cacheDirectory)
        .filter((fileName) => fileName.endsWith('.tmp'));
      expect(temporaryFiles).toHaveLength(0);
    } finally {
      await fixture.rm();
    }
  });
});
