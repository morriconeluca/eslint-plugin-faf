import { describe, expect, it } from 'vitest';

import type { TModuleRecord } from '../../../../_types/module-record.type.js';

import { MODULE_RECORD_CACHE_SCHEMA_VERSION } from '../../../../_constants/module-record-cache.constant.js';
import { parseModuleRecordCache } from './parse-module-record-cache.util.js';

const sampleRecord: TModuleRecord = {
  exports: [],
  imports: [],
  language: 'script',
  symbols: [],
  unsupportedSyntaxes: [],
};

const payload = (
  entries: readonly unknown[],
  packageVersion = '0.5.0',
  schemaVersion: unknown = MODULE_RECORD_CACHE_SCHEMA_VERSION
): Record<string, unknown> => ({
  entries,
  packageVersion,
  schemaVersion,
});

describe('parseModuleRecordCache', () => {
  it('returns entries when the payload and records are valid', () => {
    const parsed = parseModuleRecordCache({
      packageVersion: '0.5.0',
      raw: payload([['key1', sampleRecord]]),
    });
    expect(parsed?.get('key1')).toEqual(sampleRecord);
  });

  it('returns an empty map for an empty entry list', () => {
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([]),
      })?.size
    ).toBe(0);
  });

  it('rejects non-objects, wrong versions, and non-array entries', () => {
    expect(
      parseModuleRecordCache({ packageVersion: '0.5.0', raw: null })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({ packageVersion: '0.5.0', raw: 123 })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: ['key1', sampleRecord],
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['key1', sampleRecord]], '0.5.0', 99),
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['key1', sampleRecord]], '0.4.0'),
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: {
          packageVersion: '0.5.0',
          schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
        },
      })
    ).toBeUndefined();
  });

  it('rejects a file when any entry is malformed', () => {
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload(['not-a-tuple']),
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['only-key']]),
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['key1', sampleRecord, 'extra']]),
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([[123, sampleRecord]]),
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([
          ['key1', sampleRecord],
          ['key2', { language: 'unknown' }],
        ]),
      })
    ).toBeUndefined();
  });
});
