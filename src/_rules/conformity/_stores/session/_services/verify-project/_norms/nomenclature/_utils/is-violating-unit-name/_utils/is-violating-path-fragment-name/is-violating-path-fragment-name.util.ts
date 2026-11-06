import type { TEffectiveMimeticStructure } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

export function isViolatingPathFragmentName(
  name: string,
  lookupPath: string,
  mimeticStructures: readonly TEffectiveMimeticStructure[]
): boolean {
  const isKebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name);
  const matched = mimeticStructures.find((structure) =>
    structure.paths.some(
      (prefix) => lookupPath === prefix || lookupPath.startsWith(`${prefix}/`)
    )
  );

  const actions = matched?.actions ?? [];
  if (actions.length === 0) {
    return !isKebab;
  }

  const matchingActions = actions.filter((action) =>
    name.startsWith(`${action}-`)
  );
  matchingActions.sort((left, right) => right.length - left.length);
  const longestAction = matchingActions[0];
  if (longestAction === undefined) {
    return true;
  }

  const target = name.slice(longestAction.length + 1);
  return !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(target);
}
