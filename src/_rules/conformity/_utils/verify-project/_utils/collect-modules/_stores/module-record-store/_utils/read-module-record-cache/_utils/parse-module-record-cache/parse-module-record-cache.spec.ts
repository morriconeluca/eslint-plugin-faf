import { describe, expect, it } from 'vitest';

import type { TModuleRecord } from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';

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
  schemaVersion: unknown = 1
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
      schemaVersion: 1,
    });
    expect(parsed?.get('key1')).toEqual(sampleRecord);
  });

  it('returns an empty map for an empty entry list', () => {
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([]),
        schemaVersion: 1,
      })?.size
    ).toBe(0);
  });

  it('rejects non-objects, wrong versions, and non-array entries', () => {
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: null,
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: 123,
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: ['key1', sampleRecord],
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['key1', sampleRecord]], '0.5.0', 99),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['key1', sampleRecord]], '0.4.0'),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: {
          packageVersion: '0.5.0',
          schemaVersion: 1,
        },
        schemaVersion: 1,
      })
    ).toBeUndefined();
  });

  it('rejects a file when any entry is malformed', () => {
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload(['not-a-tuple']),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['only-key']]),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['key1', sampleRecord, 'extra']]),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([[123, sampleRecord]]),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([
          ['key1', sampleRecord],
          ['key2', { language: 'unknown' }],
        ]),
        schemaVersion: 1,
      })
    ).toBeUndefined();
  });
});
