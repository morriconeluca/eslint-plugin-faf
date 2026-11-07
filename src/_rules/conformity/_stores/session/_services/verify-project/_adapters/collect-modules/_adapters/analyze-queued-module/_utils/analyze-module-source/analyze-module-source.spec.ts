import { describe, expect, it } from 'vitest';

import type { TModuleRecord } from '../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TInventory } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TReadModuleTextResult } from '../../../../_collect-modules@shared/_types/_aggregates/collect-modules.type.js';

import { analyzeModuleSource } from './analyze-module-source.util.js';

const inventory: TInventory = {
  items: [
    {
      depth: 1,
      id: 0,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: 'src/file.ts',
      preorderEnd: 1,
      preorderStart: 0,
      realPath: 'src/file.ts',
      treeOrigin: 'src',
    },
  ],
  pathToId: new Map([['src/file.ts', 0]]),
  realPathToId: new Map([['src/file.ts', 0]]),
};

const binaryRecord = (): TModuleRecord => ({
  exports: [],
  imports: [],
  language: 'binary',
  symbols: [],
  unsupportedSyntaxes: [],
});

const scriptRecord = (): TModuleRecord => ({
  exports: [],
  imports: [
    {
      isTypeOnly: false,
      kind: 'named-import',
      position: { column: 1, line: 1 },
      specifier: './missing.ts',
    },
  ],
  language: 'script',
  symbols: [],
  unsupportedSyntaxes: [],
});

describe('analyzeModuleSource', () => {
  it('does not produce a record when a Tree file is missing', () => {
    const readResult: TReadModuleTextResult = {
      reason: 'File is missing',
      status: 'missing',
    };
    const analysis = analyzeModuleSource({
      inventory,
      producer: binaryRecord,
      readResult,
      relativePath: 'src/file.ts',
      resolver: () => [],
    });
    expect(analysis.record).toBeNull();
    expect(analysis.outcomes[0]?.constraint).toBe(
      'unverified/unreadable-entry'
    );
    expect(analysis.outcomes[0]?.message).toBe(
      "'src/file.ts' could not be inspected: File is missing"
    );
  });

  it('keeps a binary record when the bytes are not valid UTF-8', () => {
    const readResult: TReadModuleTextResult = {
      reason: 'Text is not valid UTF-8',
      status: 'undecodable',
    };
    const analysis = analyzeModuleSource({
      inventory,
      producer: (_path, text) => {
        expect(text).toBe('');
        return binaryRecord();
      },
      readResult,
      relativePath: 'src/asset.png',
      resolver: () => [],
    });
    expect(analysis.record?.language).toBe('binary');
    expect(analysis.outcomes).toEqual([]);
  });

  it('does not keep a script record when the text is undecodable', () => {
    const readResult: TReadModuleTextResult = {
      reason: 'Text is not valid UTF-8',
      status: 'undecodable',
    };
    const analysis = analyzeModuleSource({
      inventory,
      producer: scriptRecord,
      readResult,
      relativePath: 'src/file.ts',
      resolver: () => [],
    });
    expect(analysis.record).toBeNull();
    expect(analysis.outcomes[0]?.constraint).toBe(
      'unverified/unreadable-entry'
    );
    expect(analysis.outcomes[0]?.message).toBe(
      "'src/file.ts' could not be inspected: Text is not valid UTF-8"
    );
  });

  it('returns resolutions and unresolved outcomes for a decoded script', () => {
    const analysis = analyzeModuleSource({
      inventory,
      producer: scriptRecord,
      readResult: { status: 'text', text: 'const marker = 1;' },
      relativePath: 'src/file.ts',
      resolver: () => [
        {
          aliasAlternatives: [],
          aliasUsed: null,
          importIndex: 0,
          sourcePath: 'src/file.ts',
          target: { reason: 'missing', type: 'unresolved' },
        },
      ],
    });
    expect(analysis.record?.language).toBe('script');
    expect(analysis.resolutions).toHaveLength(1);
    expect(analysis.outcomes[0]?.constraint).toBe(
      'unverified/unresolved-import'
    );
  });
});
