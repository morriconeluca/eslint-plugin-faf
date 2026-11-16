import { describe, expect, it } from 'vitest';

import { produceBinaryModuleRecord } from './produce-binary-module-record.util.js';

describe('produceBinaryModuleRecord', () => {
  it('produces empty module record with binary language classification', () => {
    const result = produceBinaryModuleRecord(
      'src/assets/font.woff2',
      'binary-content'
    );

    expect(result.language).toBe('binary');
    expect(result.exports).toEqual([]);
    expect(result.imports).toEqual([]);
    expect(result.symbols).toEqual([]);
    expect(result.unsupportedSyntaxes).toEqual([]);
  });

  it('ignores path and text parameters and maintains identical structure', () => {
    const firstResult = produceBinaryModuleRecord('image.png', '');
    const secondResult = produceBinaryModuleRecord('icon.svg', '<svg></svg>');

    expect(firstResult).toEqual(secondResult);
    expect(firstResult.language).toBe('binary');
    expect(firstResult.exports).toHaveLength(0);
    expect(firstResult.imports).toHaveLength(0);
    expect(firstResult.symbols).toHaveLength(0);
    expect(firstResult.unsupportedSyntaxes).toHaveLength(0);
  });
});
