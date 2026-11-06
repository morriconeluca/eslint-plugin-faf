import type {
  TEffectiveDeclarations,
  TEffectiveRootFragment,
} from '../../../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

export function isAuthorizedRootDependency(
  sourcePath: string,
  destinationPath: string,
  sourceParentPath: string,
  treeOrigin: string,
  declarations: TEffectiveDeclarations
): boolean {
  const tree = declarations.trees.find(
    (candidate) => candidate.originPath === treeOrigin
  );
  if (tree === undefined) {
    return false;
  }

  const fragments: TEffectiveRootFragment[] = [...tree.rootFragments];
  let current = fragments.shift();
  while (current !== undefined) {
    if (current.path === sourceParentPath) {
      return current.dependencyPairs.some(
        (pair) => pair.from === sourcePath && pair.to === destinationPath
      );
    }
    fragments.push(...current.subRootFragments);
    current = fragments.shift();
  }

  return false;
}
