import type { TFAFRootFragment } from '../../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TEnumeratedRootNode } from '../../../../../../_types/reference-context.type.js';

export function collectFragmentRootNodes(
  fragment: TFAFRootFragment,
  treeOrigin: string
): ReadonlyMap<string, TEnumeratedRootNode> {
  const directEntries = fragment.rootNodes.flatMap((tier) =>
    tier.map((name) => {
      const fullPath =
        fragment.path === '.' ? name : `${fragment.path}/${name}`;
      const location: TEnumeratedRootNode = {
        rootFragmentPath: fragment.path,
        treeOrigin,
      };
      return [fullPath, location] as const;
    })
  );
  const children = fragment.subRootFragments ?? [];
  const nestedEntries = children.flatMap((child) => [
    ...collectFragmentRootNodes(child, treeOrigin),
  ]);
  return new Map([...directEntries, ...nestedEntries]);
}
