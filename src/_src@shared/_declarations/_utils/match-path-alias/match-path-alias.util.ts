import type { TEffectivePathAlias } from '../../_types/declarations.type.js';
import type {
  TCandidateMatch,
  TMatchedPathAlias,
} from './match-path-alias.type.js';

import { applyPathAliasSuffix } from './_utils/apply-path-alias-suffix/index.js';

export function matchPathAlias(
  specifier: string,
  aliases: readonly TEffectivePathAlias[]
): null | TMatchedPathAlias {
  let bestMatch: null | TCandidateMatch = null;

  for (const alias of aliases) {
    const isExactMatch = specifier === alias.prefix;
    const isPrefixMatch = specifier.startsWith(`${alias.prefix}/`);

    if (!isExactMatch && !isPrefixMatch) {
      continue;
    }

    const currentSuffix = isExactMatch
      ? ''
      : specifier.slice(alias.prefix.length + 1);

    const isLongerThanBest =
      bestMatch === null || alias.prefix.length > bestMatch.alias.prefix.length;

    if (isLongerThanBest) {
      bestMatch = {
        alias,
        suffix: currentSuffix,
      };
    }
  }

  if (bestMatch === null) {
    return null;
  }

  const resolvedTargets = bestMatch.alias.targets.map((target) =>
    applyPathAliasSuffix(target, bestMatch.suffix)
  );

  return {
    alias: bestMatch.alias,
    suffix: bestMatch.suffix,
    targets: resolvedTargets,
  };
}
