import type { TEffectiveRootFragment } from '../../../../../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

export function flattenRootFragments(
  fragments: readonly TEffectiveRootFragment[]
): readonly TEffectiveRootFragment[] {
  const all: TEffectiveRootFragment[] = [];
  const queue = [...fragments];
  let current = queue.shift();
  while (current !== undefined) {
    all.push(current);
    for (const sub of current.subRootFragments) {
      queue.push(sub);
    }
    current = queue.shift();
  }
  return all;
}
