import { describe, expect, it } from 'vitest';

import type { TEffectivePathAlias } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { matchPathAlias } from './match-path-alias.util.js';

describe('matchPathAlias', () => {
  const sharedAlias: TEffectivePathAlias = {
    prefix: '#shared',
    source: 'package.json#imports',
    targets: ['src/_src@shared'],
  };

  const sharedApisAlias: TEffectivePathAlias = {
    prefix: '#shared/apis',
    source: 'package.json#imports',
    targets: ['src/_src@shared/_apis'],
  };

  const aliases: readonly TEffectivePathAlias[] = [
    sharedAlias,
    sharedApisAlias,
  ];

  it('selects the alias on segment boundary when single match exists', () => {
    const result = matchPathAlias('#shared/unit', aliases);

    expect(result).not.toBeNull();
    expect(result?.alias.prefix).toBe('#shared');
    expect(result?.suffix).toBe('unit');
    expect(result?.targets).toEqual(['src/_src@shared/unit']);
  });

  it('selects the longest prefix match when multiple aliases match', () => {
    const result = matchPathAlias('#shared/apis/client', aliases);

    expect(result).not.toBeNull();
    expect(result?.alias.prefix).toBe('#shared/apis');
    expect(result?.suffix).toBe('client');
    expect(result?.targets).toEqual(['src/_src@shared/_apis/client']);
  });

  it('returns null when specifier shares characters but fails segment boundary check', () => {
    const result = matchPathAlias('#sharedness/unit', aliases);

    expect(result).toBeNull();
  });

  it('matches exact alias prefix with empty suffix without modifying targets', () => {
    const result = matchPathAlias('#shared', aliases);

    expect(result).not.toBeNull();
    expect(result?.alias.prefix).toBe('#shared');
    expect(result?.suffix).toBe('');
    expect(result?.targets).toEqual(['src/_src@shared']);
  });

  it('returns null for an empty specifier', () => {
    expect(matchPathAlias('', aliases)).toBeNull();
  });

  it('returns null when aliases array is empty', () => {
    expect(matchPathAlias('#shared/unit', [])).toBeNull();
  });

  it('applies suffix to all alternative targets when alias has multiple targets', () => {
    const multiTargetAlias: TEffectivePathAlias = {
      prefix: '#shared',
      source: 'package.json#imports',
      targets: ['src/_src@shared', 'dist/_src@shared'],
    };

    const result = matchPathAlias('#shared/feature', [multiTargetAlias]);

    expect(result).not.toBeNull();
    expect(result?.targets).toEqual([
      'src/_src@shared/feature',
      'dist/_src@shared/feature',
    ]);
  });

  it('handles alias with root dot base correctly when suffix is applied', () => {
    const rootAlias: TEffectivePathAlias = {
      prefix: '#root',
      source: 'common.aliases',
      targets: ['.'],
    };

    const result = matchPathAlias('#root/src/main.ts', [rootAlias]);

    expect(result).not.toBeNull();
    expect(result?.targets).toEqual(['src/main.ts']);
  });

  it('selects the longest prefix regardless of alias declaration order', () => {
    const reversedAliases: readonly TEffectivePathAlias[] = [
      sharedApisAlias,
      sharedAlias,
    ];

    const result = matchPathAlias('#shared/apis/client', reversedAliases);

    expect(result).not.toBeNull();
    expect(result?.alias.prefix).toBe('#shared/apis');
  });

  it('retains the earlier match when a subsequent matching alias has identical length', () => {
    const firstAlias: TEffectivePathAlias = {
      prefix: '#alias',
      source: 'common.aliases',
      targets: ['first/target'],
    };
    const secondAlias: TEffectivePathAlias = {
      prefix: '#alias',
      source: 'package.json#imports',
      targets: ['second/target'],
    };

    const result = matchPathAlias('#alias/path', [firstAlias, secondAlias]);

    expect(result).not.toBeNull();
    expect(result?.alias.targets).toEqual(['first/target']);
  });
});
