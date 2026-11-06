import type { TConfigOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TGetRoleFromName,
  TTreeBuild,
} from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { joinPosixPath } from './_utils/join-posix-path/index.js';
import { isPathInside } from './_utils/path-is-inside/index.js';

export function buildTreeContext(
  tree: TEffectiveTree,
  treeIndex: number,
  getRoleFromName: TGetRoleFromName,
  selection: {
    readonly foreignDomainPaths: ReadonlySet<string>;
    readonly foreignNodePaths: ReadonlySet<string>;
  }
): TTreeBuild {
  const outcomes: TConfigOutcome[] = [];
  const foreignDomainPaths = new Set(selection.foreignDomainPaths);
  if (foreignDomainPaths.has(tree.originPath)) {
    foreignDomainPaths.delete(tree.originPath);
    outcomes.push(
      createOutcome('configuration/incompatible-foreign-origin', {
        element: tree.originPath,
        propertyPath: `trees[${treeIndex}].foreignDomains`,
      })
    );
  }

  const rootFragmentPropertyPaths = new Map<string, string>();
  const rootNodePropertyPaths = new Map<string, string>();
  const rootNodePaths = new Set<string>();

  const indexFragments = (
    fragments: TEffectiveTree['rootFragments'],
    propertyPath: string
  ): void => {
    for (const [index, fragment] of fragments.entries()) {
      const fragmentPropertyPath = `${propertyPath}[${index}]`;
      rootFragmentPropertyPaths.set(fragment.path, fragmentPropertyPath);
      for (const node of fragment.rootNodes) {
        const nodePath = joinPosixPath(fragment.path, node.name);
        rootNodePaths.add(nodePath);
        rootNodePropertyPaths.set(
          nodePath,
          `${fragmentPropertyPath}.rootNodes`
        );
      }
      indexFragments(
        fragment.subRootFragments,
        `${fragmentPropertyPath}.subRootFragments`
      );
    }
  };

  indexFragments(tree.rootFragments, `trees[${treeIndex}].rootFragments`);

  for (const [fragmentPath, propertyPath] of rootFragmentPropertyPaths) {
    if (isPathInside(fragmentPath, selection.foreignDomainPaths)) {
      outcomes.push(
        createOutcome('configuration/incompatible-root-in-foreign-domain', {
          element: fragmentPath,
          propertyPath,
        })
      );
    }
  }

  const seenMimeticPaths = new Set<string>();
  const mimeticPaths = new Set<string>();
  const mimeticPropertyPaths = new Map<string, string>();
  for (const [
    structureIndex,
    structure,
  ] of tree.mimeticPathStructures.entries()) {
    for (const [pathIndex, mimeticPath] of structure.paths.entries()) {
      const propertyPath = `trees[${treeIndex}].mimeticPathStructures[${structureIndex}].paths[${pathIndex}]`;
      if (seenMimeticPaths.has(mimeticPath)) {
        outcomes.push(
          createOutcome('configuration/duplicate-mimetic-path', {
            element: mimeticPath,
            propertyPath,
          })
        );
        mimeticPaths.delete(mimeticPath);
        mimeticPropertyPaths.delete(mimeticPath);
      } else {
        seenMimeticPaths.add(mimeticPath);
        mimeticPaths.add(mimeticPath);
        mimeticPropertyPaths.set(mimeticPath, propertyPath);
      }
    }
  }

  return {
    context: {
      catalog: tree.catalog,
      foreignDomainPaths,
      foreignNodePaths: selection.foreignNodePaths,
      getRoleFromName,
      mimeticPaths,
      originKind: tree.originKind,
      originPath: tree.originPath,
      rootFragmentPaths: new Set(rootFragmentPropertyPaths.keys()),
      rootNodePaths,
    },
    mimeticPropertyPaths,
    outcomes,
    rootFragmentPropertyPaths,
    rootNodePropertyPaths,
  };
}
