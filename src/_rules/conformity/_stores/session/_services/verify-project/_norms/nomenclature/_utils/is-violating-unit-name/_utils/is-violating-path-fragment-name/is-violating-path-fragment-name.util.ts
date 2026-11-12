import type { TEffectiveMimeticStructure } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

export function isViolatingPathFragmentName(
  name: string,
  lookupPath: string,
  mimeticStructures: readonly TEffectiveMimeticStructure[]
): boolean {
  const isKebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name);
  const matchingCandidates = mimeticStructures.flatMap((structure) =>
    structure.paths
      .filter(
        (prefix) => lookupPath === prefix || lookupPath.startsWith(`${prefix}/`)
      )
      .map((prefix) => ({
        prefixLength: prefix.length,
        structure,
      }))
  );
  matchingCandidates.sort(
    (left, right) => right.prefixLength - left.prefixLength
  );
  const matched = matchingCandidates[0]?.structure;

  const actions = matched?.actions ?? [];
  if (actions.length === 0) {
    return !isKebab;
  }

  const matchingActions = actions.filter(
    (action) => name === action || name.startsWith(`${action}-`)
  );
  matchingActions.sort((left, right) => right.length - left.length);
  const longestAction = matchingActions[0];
  if (longestAction === undefined || name === longestAction) {
    return true;
  }

  const target = name.slice(longestAction.length + 1);
  return !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(target);
}
