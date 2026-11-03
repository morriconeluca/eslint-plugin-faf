import { describe, expect, it } from 'vitest';

import type { TModuleRecord } from '../../../../../_syntax/_types/module-record.type.js';

import { MODULE_RECORD_CACHE_SCHEMA_VERSION } from '../../../../_runtime@shared/_constants/module-record-cache.constant.js';
import { parseModuleRecordCache } from './parse-module-record-cache.schema.js';

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
    const parsed = parseModuleRecordCache(
      payload([['key1', sampleRecord]]),
      '0.5.0'
    );
    expect(parsed?.get('key1')).toEqual(sampleRecord);
  });

  it('returns an empty map for an empty entry list', () => {
    expect(parseModuleRecordCache(payload([]), '0.5.0')?.size).toBe(0);
  });

  it('rejects non-objects, wrong versions, and non-array entries', () => {
    expect(parseModuleRecordCache(null, '0.5.0')).toBeUndefined();
    expect(parseModuleRecordCache(123, '0.5.0')).toBeUndefined();
    expect(
      parseModuleRecordCache(['key1', sampleRecord], '0.5.0')
    ).toBeUndefined();
    expect(
      parseModuleRecordCache(
        payload([['key1', sampleRecord]], '0.5.0', 99),
        '0.5.0'
      )
    ).toBeUndefined();
    expect(
      parseModuleRecordCache(
        payload([['key1', sampleRecord]], '0.4.0'),
        '0.5.0'
      )
    ).toBeUndefined();
    expect(
      parseModuleRecordCache(
        {
          packageVersion: '0.5.0',
          schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
        },
        '0.5.0'
      )
    ).toBeUndefined();
  });

  it('rejects a file when any entry is malformed', () => {
    expect(
      parseModuleRecordCache(payload(['not-a-tuple']), '0.5.0')
    ).toBeUndefined();
    expect(
      parseModuleRecordCache(payload([['only-key']]), '0.5.0')
    ).toBeUndefined();
    expect(
      parseModuleRecordCache(
        payload([['key1', sampleRecord, 'extra']]),
        '0.5.0'
      )
    ).toBeUndefined();
    expect(
      parseModuleRecordCache(payload([[123, sampleRecord]]), '0.5.0')
    ).toBeUndefined();
    expect(
      parseModuleRecordCache(
        payload([
          ['key1', sampleRecord],
          ['key2', { language: 'unknown' }],
        ]),
        '0.5.0'
      )
    ).toBeUndefined();
  });
});
