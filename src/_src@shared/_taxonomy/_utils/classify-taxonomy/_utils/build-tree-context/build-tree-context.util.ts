import type { TEffectiveTree } from '../../../../../_declarations/_types/declarations.type.js';
import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';
import type {
  TGetRoleFromName,
  TTreeBuild,
} from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  CONFIGURATION_FAMILY,
  CONSTRAINT_INCOMPATIBLE_FOREIGN_ORIGIN,
  CONSTRAINT_INCOMPATIBLE_ROOT_IN_FOREIGN,
  DUPLICATE_MIMETIC_CONSTRAINT,
  NORMATIVE_CONFIG_8,
  NORMATIVE_SECTION_6_2,
  NORMATIVE_SECTION_6_7,
} from '../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { joinPosixPath } from '../../_classify-taxonomy@shared/_utils/join-posix-path/index.js';
import { isPathInside } from '../../_classify-taxonomy@shared/_utils/path-is-inside/index.js';

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
    outcomes.push({
      constraint: CONSTRAINT_INCOMPATIBLE_FOREIGN_ORIGIN,
      element: tree.originPath,
      family: CONFIGURATION_FAMILY,
      message: `Origin '${tree.originPath}' is also designated as a Foreign Domain.`,
      normativeReference: NORMATIVE_SECTION_6_7,
      propertyPath: `trees[${treeIndex}].foreignDomains`,
    });
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
      outcomes.push({
        constraint: CONSTRAINT_INCOMPATIBLE_ROOT_IN_FOREIGN,
        element: fragmentPath,
        family: CONFIGURATION_FAMILY,
        message: `Root Fragment '${fragmentPath}' is designated inside a Foreign Domain.`,
        normativeReference: NORMATIVE_SECTION_6_2,
        propertyPath,
      });
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
        outcomes.push({
          constraint: DUPLICATE_MIMETIC_CONSTRAINT,
          element: mimeticPath,
          family: CONFIGURATION_FAMILY,
          message: `Mimetic path '${mimeticPath}' is designated more than once.`,
          normativeReference: NORMATIVE_CONFIG_8,
          propertyPath,
        });
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
