import type { Rule } from 'eslint';

import path from 'path';

import type { TFafSettings } from '#_rules@shared/_types/faf.type.js';

import { classifyFolder } from '#_rules@shared/_utils/_aggregates/classify-folder/index.js';
import { resolveImportPath } from '#_rules@shared/_utils/_aggregates/resolve-import-path/index.js';
import { findTreeConfig } from '#_rules@shared/_utils/_primitives/find-tree-config/index.js';
import { getFileRole } from '#_rules@shared/_utils/_primitives/get-file-role/index.js';
import { getLcaAndSubBranches } from '#_rules@shared/_utils/_primitives/get-lca-and-sub-branches/index.js';
import { getRoleHierarchyIndex } from '#_rules@shared/_utils/_primitives/get-role-hierarchy-index/index.js';
import { getRootFragmentConfig } from '#_rules@shared/_utils/_primitives/get-root-fragment-config/index.js';
import { getRootNodeIndex } from '#_rules@shared/_utils/_primitives/get-root-node-index/index.js';
import { resolveHorizontalHierarchy } from '#_rules@shared/_utils/_primitives/resolve-horizontal-hierarchy/index.js';
import { toRelativePath } from '#_rules@shared/_utils/_primitives/to-relative-path/index.js';
import { isInsidePrivateCategoryOfLca } from '#_rules@shared/_utils/_systems/is-inside-private-category-of-lca/index.js';

/**
 * @fileoverview Rule: faf/no-peer-dependency
 * Enforces the FAF Law of Separation between Peers.
 *
 * FAF Law: Sibling directories and files (at the same filesystem level) must not import each other
 * unless a horizontal hierarchy flow is explicitly configured (via local/global horizontal hierarchies).
 * For files inside a Fragment, peer imports flow according to the index order defined in the `roles` configuration.
 *
 * Valid:
 * - A compound utility importing from a primitive utility (if compounds ➔ primitives is configured).
 * - Sibling Fragment Nodes importing from each other according to the roles scale order (e.g. `util` imports `type`).
 *
 * Invalid:
 * - A primitive utility importing from a compound utility (violating horizontal hierarchy).
 * - Circular imports between sibling folders with no configured hierarchy.
 */
const rule: Rule.RuleModule = {
  create(context) {
    const absPath = context.filename;
    const relPath = toRelativePath(absPath);
    const settings = context.settings as { faf?: TFafSettings };

    if (!settings.faf) {
      return {};
    }

    const config = findTreeConfig(relPath, settings.faf);
    if (!config) {
      return {};
    }

    const currentDir = path.dirname(relPath);
    const isCurrentFileExcluded =
      config.excludes?.some(
        (exc) => relPath === exc || relPath.startsWith(exc + '/')
      ) ?? false;

    function checkImport(node: Rule.Node, importValue: string) {
      const resolvedRelPath = resolveImportPath(
        importValue,
        relPath,
        settings.faf!
      );
      if (!resolvedRelPath) {
        return; // External import
      }

      const isImportedFileExcluded =
        config?.excludes?.some(
          (exc) =>
            resolvedRelPath === exc || resolvedRelPath.startsWith(exc + '/')
        ) ?? false;

      // Foreign Domain imports are handled by foreign-domain-isolation
      if (isCurrentFileExcluded || isImportedFileExcluded) {
        return;
      }

      const importedDir = path.dirname(resolvedRelPath);

      // Scenario 1: Same directory (Fragment Nodes or direct siblings)
      if (currentDir === importedDir) {
        const fileA = path.basename(relPath);
        const fileB = path.basename(resolvedRelPath);

        const roleA = getFileRole(fileA, config!);
        const roleB = getFileRole(fileB, config!);

        if (roleA && roleB) {
          const idxA = getRoleHierarchyIndex(roleA, config!);
          const idxB = getRoleHierarchyIndex(roleB, config!);

          if (idxA !== -1 && idxB !== -1) {
            if (idxB >= idxA) {
              context.report({
                message: `Sibling import violation: "${fileA}" (role "${roleA}", level ${idxA}) cannot import from "${fileB}" (role "${roleB}", level ${idxB}). Imports must flow from lower to higher levels.`,
                node,
              });
            }
          }
        }
        return;
      }

      // Scenario 2: Different directories
      const lcaInfo = getLcaAndSubBranches(currentDir, importedDir);
      if (!lcaInfo) {
        return;
      }

      const { lca, subA, subB } = lcaInfo;

      // Exception: Fractal Branch
      if (subB.startsWith('_') && subB.includes('@shared')) {
        // Allowed to import from own Fractal Branch
        return;
      }

      // Exception: Private Category of the LCA
      if (isInsidePrivateCategoryOfLca(importedDir, lca, config!)) {
        return;
      }

      // A descendant reaching for the Fragment root has no privileged access to it
      if (subB === '' && classifyFolder(lca, config!) === 'fragment') {
        context.report({
          message: `Peer separation violation: "${subA}" cannot import directly from the root of Fragment "${lca}". A node nested inside a Private Category or Fractal Branch has no privileged access to its owning Fragment's other direct children; promote the shared resource to a Fractal Branch if the sharing need is genuine.`,
          node,
        });
        return;
      }

      // Dependency direction between Root Nodes is handled by root-node-dependency-direction
      const rfConfig = getRootFragmentConfig(lca, config!);
      if (rfConfig) {
        const idxRootA = getRootNodeIndex(relPath, rfConfig, lca);
        const idxRootB = getRootNodeIndex(resolvedRelPath, rfConfig, lca);
        if (idxRootA !== -1 && idxRootB !== -1) {
          return;
        }
      }

      const isSubARootFragment =
        classifyFolder(path.posix.join(lca, subA), config!) === 'root-fragment';
      const isSubBRootFragment =
        classifyFolder(path.posix.join(lca, subB), config!) === 'root-fragment';

      if (isSubARootFragment || isSubBRootFragment) {
        return;
      }

      // Determine if there is a defined horizontal hierarchy at LCA and whether the import is allowed
      const { allowed, defined: hasDefinedHierarchy } =
        resolveHorizontalHierarchy(lca, subA, subB, config!);

      if (hasDefinedHierarchy) {
        if (!allowed) {
          context.report({
            message: `Horizontal hierarchy violation: "${subA}" cannot import from "${subB}" under parent "${lca}".`,
            node,
          });
        }
      } else {
        context.report({
          message: `Peer separation violation: sibling directories "${subA}" and "${subB}" cannot import each other because no horizontal hierarchy is defined under parent "${lca}".`,
          node,
        });
      }
    }

    return {
      ExportAllDeclaration(node) {
        checkImport(node, node.source.value as string);
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          checkImport(node, node.source.value as string);
        }
      },
      ImportDeclaration(node) {
        checkImport(node, node.source.value as string);
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce the Law of Separation between Peers (no-peer-dependency)',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
