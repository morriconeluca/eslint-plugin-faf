import { describe, expect, it } from 'vitest';

import { convertCommonAliases } from './convert-common-aliases.util.js';

describe('convertCommonAliases', () => {
  it('returns an empty array when common aliases record is empty', () => {
    expect(convertCommonAliases({})).toEqual([]);
  });

  it('converts each entry to an effective alias with common.aliases source', () => {
    const input = {
      '#api': 'src/_src@shared/_apis',
      '#shared': 'src/_src@shared',
    };

    const result = convertCommonAliases(input);

    expect(result).toEqual([
      {
        prefix: '#api',
        source: 'common.aliases',
        targets: ['src/_src@shared/_apis'],
      },
      {
        prefix: '#shared',
        source: 'common.aliases',
        targets: ['src/_src@shared'],
      },
    ]);
  });

  it('normalizes base paths by stripping leading ./ and trailing slashes', () => {
    const input = {
      '#trailing': 'src/_src@shared/',
      '#with-both': './src/_src@shared/',
      '#with-dot': './src/_src@shared',
    };

    const result = convertCommonAliases(input);

    expect(result).toEqual([
      {
        prefix: '#trailing',
        source: 'common.aliases',
        targets: ['src/_src@shared'],
      },
      {
        prefix: '#with-both',
        source: 'common.aliases',
        targets: ['src/_src@shared'],
      },
      {
        prefix: '#with-dot',
        source: 'common.aliases',
        targets: ['src/_src@shared'],
      },
    ]);
  });

  it('normalizes dot and dot-slash paths to a single dot', () => {
    const input = {
      '#dot': '.',
      '#dot-slash': './',
    };

    const result = convertCommonAliases(input);

    expect(result).toEqual([
      {
        prefix: '#dot',
        source: 'common.aliases',
        targets: ['.'],
      },
      {
        prefix: '#dot-slash',
        source: 'common.aliases',
        targets: ['.'],
      },
    ]);
  });
});
