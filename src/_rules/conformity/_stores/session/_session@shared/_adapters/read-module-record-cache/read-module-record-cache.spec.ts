import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import v8 from 'node:v8';
import { describe, expect, it } from 'vitest';

import type { TModuleRecord } from '../../_types/module-record.type.js';

import { MODULE_RECORD_CACHE_SCHEMA_VERSION } from '../../_constants/module-record-cache.constant.js';
import { readModuleRecordCache } from './read-module-record-cache.adapter.js';

const CACHE_RELATIVE_DIR = 'node_modules/.cache/eslint-plugin-faf';
const CACHE_FILE_NAME = 'records.cache';

describe('readModuleRecordCache', () => {
  const sampleRecord: TModuleRecord = {
    exports: [
      {
        exportedName: 'foo',
        isTypeOnly: false,
        origin: { symbolName: 'foo', type: 'local-symbol' },
        position: { column: 1, line: 1 },
      },
    ],
    imports: [],
    language: 'script',
    symbols: [
      {
        name: 'foo',
        position: { column: 1, line: 1 },
        space: 'value',
      },
    ],
    unsupportedSyntaxes: [],
  };

  it('returns empty map when cache file does not exist', async () => {
    const fixture = await createFixture({});
    try {
      const result = readModuleRecordCache({
        baseDirectory: fixture.path,
        packageVersion: '0.5.0',
      });
      expect(result.size).toBe(0);
    } finally {
      await fixture.rm();
    }
  });

  it('reads and deserializes valid cache entries', async () => {
    const fixture = await createFixture({});
    try {
      const cacheDirectory = nodePath.join(fixture.path, CACHE_RELATIVE_DIR);
      nodeFs.mkdirSync(cacheDirectory, { recursive: true });

      const payload = {
        entries: [['key1', sampleRecord]],
        packageVersion: '0.5.0',
        schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
      };
      nodeFs.writeFileSync(
        nodePath.join(cacheDirectory, CACHE_FILE_NAME),
        v8.serialize(payload)
      );

      const result = readModuleRecordCache({
        baseDirectory: fixture.path,
        packageVersion: '0.5.0',
      });
      expect(result.size).toBe(1);
      expect(result.get('key1')).toEqual(sampleRecord);
    } finally {
      await fixture.rm();
    }
  });

  it('ignores cache when schema version differs', async () => {
    const fixture = await createFixture({});
    try {
      const cacheDirectory = nodePath.join(fixture.path, CACHE_RELATIVE_DIR);
      nodeFs.mkdirSync(cacheDirectory, { recursive: true });

      const payload = {
        entries: [['key1', sampleRecord]],
        packageVersion: '0.5.0',
        schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION + 99,
      };
      nodeFs.writeFileSync(
        nodePath.join(cacheDirectory, CACHE_FILE_NAME),
        v8.serialize(payload)
      );

      const result = readModuleRecordCache({
        baseDirectory: fixture.path,
        packageVersion: '0.5.0',
      });
      expect(result.size).toBe(0);
    } finally {
      await fixture.rm();
    }
  });

  it('ignores cache when package version differs', async () => {
    const fixture = await createFixture({});
    try {
      const cacheDirectory = nodePath.join(fixture.path, CACHE_RELATIVE_DIR);
      nodeFs.mkdirSync(cacheDirectory, { recursive: true });

      const payload = {
        entries: [['key1', sampleRecord]],
        packageVersion: '0.4.0',
        schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
      };
      nodeFs.writeFileSync(
        nodePath.join(cacheDirectory, CACHE_FILE_NAME),
        v8.serialize(payload)
      );

      const result = readModuleRecordCache({
        baseDirectory: fixture.path,
        packageVersion: '0.5.0',
      });
      expect(result.size).toBe(0);
    } finally {
      await fixture.rm();
    }
  });

  it('ignores corrupted or truncated cache file', async () => {
    const fixture = await createFixture({});
    try {
      const cacheDirectory = nodePath.join(fixture.path, CACHE_RELATIVE_DIR);
      nodeFs.mkdirSync(cacheDirectory, { recursive: true });

      const targetPath = nodePath.join(cacheDirectory, CACHE_FILE_NAME);

      nodeFs.writeFileSync(targetPath, Buffer.from('corrupted binary data'));
      const corruptedResult = readModuleRecordCache({
        baseDirectory: fixture.path,
        packageVersion: '0.5.0',
      });
      expect(corruptedResult.size).toBe(0);

      const validPayload = {
        entries: [['key1', sampleRecord]],
        packageVersion: '0.5.0',
        schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
      };
      const validBuffer = v8.serialize(validPayload);
      const truncatedBuffer = validBuffer.subarray(
        0,
        Math.floor(validBuffer.length / 2)
      );
      nodeFs.writeFileSync(targetPath, truncatedBuffer);

      const truncatedResult = readModuleRecordCache({
        baseDirectory: fixture.path,
        packageVersion: '0.5.0',
      });
      expect(truncatedResult.size).toBe(0);
    } finally {
      await fixture.rm();
    }
  });

  it('ignores an unreadable cache file without throwing', async () => {
    const fixture = await createFixture({});
    try {
      const cacheDirectory = nodePath.join(fixture.path, CACHE_RELATIVE_DIR);
      nodeFs.mkdirSync(cacheDirectory, { recursive: true });
      const targetPath = nodePath.join(cacheDirectory, CACHE_FILE_NAME);
      nodeFs.writeFileSync(targetPath, Buffer.from('secret'));
      nodeFs.chmodSync(targetPath, 0);

      expect(
        readModuleRecordCache({
          baseDirectory: fixture.path,
          packageVersion: '0.5.0',
        }).size
      ).toBe(0);
    } finally {
      const targetPath = nodePath.join(
        fixture.path,
        CACHE_RELATIVE_DIR,
        CACHE_FILE_NAME
      );
      nodeFs.chmodSync(targetPath, 0o600);
      await fixture.rm();
    }
  });

  it('ignores cache when payload is not an object or lacks entries array', async () => {
    const fixture = await createFixture({});
    try {
      const cacheDirectory = nodePath.join(fixture.path, CACHE_RELATIVE_DIR);
      nodeFs.mkdirSync(cacheDirectory, { recursive: true });

      const targetPath = nodePath.join(cacheDirectory, CACHE_FILE_NAME);

      nodeFs.writeFileSync(targetPath, v8.serialize(123));
      expect(
        readModuleRecordCache({
          baseDirectory: fixture.path,
          packageVersion: '0.5.0',
        }).size
      ).toBe(0);

      nodeFs.writeFileSync(
        targetPath,
        v8.serialize({
          packageVersion: '0.5.0',
          schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
        })
      );
      expect(
        readModuleRecordCache({
          baseDirectory: fixture.path,
          packageVersion: '0.5.0',
        }).size
      ).toBe(0);
    } finally {
      await fixture.rm();
    }
  });

  it('ignores cache when entry shapes are malformed or invalid', async () => {
    const fixture = await createFixture({});
    try {
      const cacheDirectory = nodePath.join(fixture.path, CACHE_RELATIVE_DIR);
      nodeFs.mkdirSync(cacheDirectory, { recursive: true });

      const targetPath = nodePath.join(cacheDirectory, CACHE_FILE_NAME);

      nodeFs.writeFileSync(
        targetPath,
        v8.serialize({
          entries: ['not-a-tuple'],
          packageVersion: '0.5.0',
          schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
        })
      );
      expect(
        readModuleRecordCache({
          baseDirectory: fixture.path,
          packageVersion: '0.5.0',
        }).size
      ).toBe(0);

      nodeFs.writeFileSync(
        targetPath,
        v8.serialize({
          entries: [[123, sampleRecord]],
          packageVersion: '0.5.0',
          schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
        })
      );
      expect(
        readModuleRecordCache({
          baseDirectory: fixture.path,
          packageVersion: '0.5.0',
        }).size
      ).toBe(0);

      nodeFs.writeFileSync(
        targetPath,
        v8.serialize({
          entries: [['key1', { language: 'unknown' }]],
          packageVersion: '0.5.0',
          schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
        })
      );
      expect(
        readModuleRecordCache({
          baseDirectory: fixture.path,
          packageVersion: '0.5.0',
        }).size
      ).toBe(0);

      nodeFs.writeFileSync(
        targetPath,
        v8.serialize({
          entries: [
            ['key1', sampleRecord],
            ['key2', { language: 'unknown' }],
          ],
          packageVersion: '0.5.0',
          schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
        })
      );
      expect(
        readModuleRecordCache({
          baseDirectory: fixture.path,
          packageVersion: '0.5.0',
        }).size
      ).toBe(0);

      nodeFs.writeFileSync(
        targetPath,
        v8.serialize({
          entries: [['only-key'], ['key1', sampleRecord, 'extra']],
          packageVersion: '0.5.0',
          schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
        })
      );
      expect(
        readModuleRecordCache({
          baseDirectory: fixture.path,
          packageVersion: '0.5.0',
        }).size
      ).toBe(0);
    } finally {
      await fixture.rm();
    }
  });
});
