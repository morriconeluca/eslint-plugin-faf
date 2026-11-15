import type { TConfigOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TGetRoleFromName,
  TTreeBuild,
} from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import {
  DOT_PATH,
  SLASH,
} from '../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';

export function buildTreeContext(
  tree: TEffectiveTree,
  treeIndex: number,
  getRoleFromName: TGetRoleFromName,
  selection: {
    readonly foreignDomainPaths: ReadonlySet<string>;
    readonly foreignNodePaths: ReadonlySet<string>;
  }
): TTreeBuild {
  const isPathInside = (
    path: string,
    ancestorPaths: ReadonlySet<string>
  ): boolean => {
    for (const ancestorPath of ancestorPaths) {
      if (path === ancestorPath || path.startsWith(`${ancestorPath}${SLASH}`)) {
        return true;
      }
    }
    return false;
  };

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

  const indexRootFragments = (
    rootFragments: TEffectiveTree['rootFragments'],
    propertyPath: string
  ): void => {
    for (const [index, rootFragment] of rootFragments.entries()) {
      const rootFragmentPropertyPath = `${propertyPath}[${index}]`;
      rootFragmentPropertyPaths.set(
        rootFragment.path,
        rootFragmentPropertyPath
      );
      for (const node of rootFragment.rootNodes) {
        const nodePath =
          rootFragment.path === DOT_PATH
            ? node.name
            : `${rootFragment.path}${SLASH}${node.name}`;
        rootNodePaths.add(nodePath);
        rootNodePropertyPaths.set(
          nodePath,
          `${rootFragmentPropertyPath}.rootNodes`
        );
      }
      indexRootFragments(
        rootFragment.subRootFragments,
        `${rootFragmentPropertyPath}.subRootFragments`
      );
    }
  };

  indexRootFragments(tree.rootFragments, `trees[${treeIndex}].rootFragments`);

  for (const [rootFragmentPath, propertyPath] of rootFragmentPropertyPaths) {
    if (isPathInside(rootFragmentPath, selection.foreignDomainPaths)) {
      outcomes.push(
        createOutcome('configuration/incompatible-root-in-foreign-domain', {
          element: rootFragmentPath,
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
