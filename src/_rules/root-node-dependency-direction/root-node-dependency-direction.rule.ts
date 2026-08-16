import type { Rule } from 'eslint';

import path from 'path';

import type { TFafSettings } from '#_rules@shared/_types/faf.type.js';

import { classifyFolder } from '#_rules@shared/_utils/_aggregates/classify-folder/index.js';
import { resolveImportPath } from '#_rules@shared/_utils/_aggregates/resolve-import-path/index.js';
import { findTreeConfig } from '#_rules@shared/_utils/_primitives/find-tree-config/index.js';
import { getLcaAndSubBranches } from '#_rules@shared/_utils/_primitives/get-lca-and-sub-branches/index.js';
import { getRootFragmentConfig } from '#_rules@shared/_utils/_primitives/get-root-fragment-config/index.js';
import { getRootNodeIndex } from '#_rules@shared/_utils/_primitives/get-root-node-index/index.js';
import { toRelativePath } from '#_rules@shared/_utils/_primitives/to-relative-path/index.js';
import { isInsidePrivateCategoryOfLca } from '#_rules@shared/_utils/_systems/is-inside-private-category-of-lca/index.js';

/**
 * @fileoverview Rule: faf/root-node-dependency-direction
 * Enforces the FAF Law of dependency direction between Root Nodes.
 *
 * FAF Law: Root Nodes are exempt from the Role naming convention, so relationships between
 * them (sibling or nested Root Fragments) can never fall back to the Role scale: they must
 * always be explicitly authorized by the architect via "rootNodes" at the common ancestor.
 *
 * Valid:
 * - `main.tsx` importing `main.css` when `rootNodes: [['main.css'], ['main.tsx']]` authorizes it.
 *
 * Invalid:
 * - Two sibling Root Nodes importing each other with no "rootNodes" relationship configured.
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

      // Sibling Fragment Nodes (same directory) never involve Root Nodes
      if (currentDir === importedDir) {
        return;
      }

      const lcaInfo = getLcaAndSubBranches(currentDir, importedDir);
      if (!lcaInfo) {
        return;
      }

      const { lca, subA, subB } = lcaInfo;

      // Exception: Fractal Branch (handled by its own encapsulation law)
      if (subB.startsWith('_') && subB.includes('@shared')) {
        return;
      }

      // Exception: Private Category of the LCA (handled by no-peer-dependency)
      if (isInsidePrivateCategoryOfLca(importedDir, lca, config!)) {
        return;
      }

      // A descendant reaching for the Fragment root: handled by no-peer-dependency
      if (subB === '' && classifyFolder(lca, config!) === 'fragment') {
        return;
      }

      // Check if LCA is a Root Fragment and we are importing between Root Nodes
      const rfConfig = getRootFragmentConfig(lca, config!);
      if (rfConfig) {
        const idxRootA = getRootNodeIndex(relPath, rfConfig, lca);
        const idxRootB = getRootNodeIndex(resolvedRelPath, rfConfig, lca);

        if (idxRootA !== -1 && idxRootB !== -1) {
          if (idxRootB >= idxRootA) {
            context.report({
              message: `Root Node import violation: "${path.basename(relPath)}" cannot import from "${path.basename(resolvedRelPath)}" under Root Fragment "${lca}".`,
              node,
            });
          }
          return;
        }
      }

      // Root Nodes are exempt from the Role naming convention, so relationships involving them
      // (including nested or sibling Root Fragments) can never fall back to the Role scale: they
      // must always be explicitly authorized by the architect via "rootNodes" at the common ancestor.
      const isSubARootFragment =
        classifyFolder(path.posix.join(lca, subA), config!) === 'root-fragment';
      const isSubBRootFragment =
        classifyFolder(path.posix.join(lca, subB), config!) === 'root-fragment';

      if (isSubARootFragment || isSubBRootFragment) {
        context.report({
          message: `Root Node import violation: "${relPath}" cannot import from "${resolvedRelPath}" because no "rootNodes" relationship is configured under Root Fragment "${lca}". Relationships between Root Nodes must always be explicitly authorized by the architect.`,
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
        'Enforce explicit, non-Role-based dependency direction between Root Nodes',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
