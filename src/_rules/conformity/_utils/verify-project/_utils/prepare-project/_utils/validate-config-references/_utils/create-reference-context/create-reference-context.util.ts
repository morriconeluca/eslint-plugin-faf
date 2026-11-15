import type {
  TFAFConfig,
  TFAFRootFragment,
} from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TEffectiveDeclarations,
  TInventory,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TEnumeratedRootNode,
  TOwnedOrigin,
  TReferenceContext,
} from '../../_validate-config-references@shared/_utils/reject-reference-scope/index.js';

import { toPosixPath } from '../../../../../../../../../../_src@shared/_utils/to-posix-path/index.js';

export function createReferenceContext(
  config: TFAFConfig,
  declarations: TEffectiveDeclarations,
  inventory: TInventory
): TReferenceContext {
  const UNASSIGNED_LOCAL_INDEX = -1;

  const collectFragmentRootNodes = (
    rootFragment: TFAFRootFragment,
    treeOrigin: string
  ): ReadonlyMap<string, TEnumeratedRootNode> => {
    const directEntries = rootFragment.rootNodes.flatMap((tier) =>
      tier.map((name) => {
        const fullPath =
          rootFragment.path === '.' ? name : `${rootFragment.path}/${name}`;
        const location: TEnumeratedRootNode = {
          rootFragmentPath: rootFragment.path,
          treeOrigin,
        };
        return [fullPath, location] as const;
      })
    );
    const children = rootFragment.subRootFragments ?? [];
    const nestedEntries = children.flatMap((child) => [
      ...collectFragmentRootNodes(child, treeOrigin),
    ]);
    return new Map([...directEntries, ...nestedEntries]);
  };

  const collectEnumeratedRootNodes = (): ReadonlyMap<
    string,
    TEnumeratedRootNode
  > => {
    const maps = config.faf.locals.flatMap((local) => {
      const rootFragments = local.rootFragments ?? [];
      return rootFragments.map((rootFragment) =>
        collectFragmentRootNodes(rootFragment, rootFragment.path)
      );
    });
    const entries = maps.flatMap((nodes) => [...nodes]);
    return new Map(entries);
  };

  const collectOwnedOrigins = (): ReadonlyMap<string, TOwnedOrigin> => {
    const entries: [string, TOwnedOrigin][] = [];
    for (const [localIndex, local] of config.faf.locals.entries()) {
      const layers = local.rootLayers ?? [];
      for (const path of layers) {
        entries.push([path, { localIndex, originKind: 'root-layer' }]);
      }
      const rootFragments = local.rootFragments ?? [];
      for (const rootFragment of rootFragments) {
        entries.push([
          rootFragment.path,
          { localIndex, originKind: 'root-fragment' },
        ]);
      }
    }

    for (const tree of declarations.trees) {
      const isAlreadyOwned = entries.some(([path]) => path === tree.originPath);
      if (!isAlreadyOwned) {
        entries.push([
          tree.originPath,
          {
            localIndex: UNASSIGNED_LOCAL_INDEX,
            originKind: tree.originKind,
          },
        ]);
      }
    }

    return new Map(entries);
  };

  return {
    aliasPrefixes: declarations.aliases.map((alias) => alias.prefix),
    baseDirectory: toPosixPath(declarations.baseDirectory),
    enumeratedRootNodes: collectEnumeratedRootNodes(),
    inventory,
    ownedOrigins: collectOwnedOrigins(),
  };
}
