import type { Rule } from 'eslint';

import path from 'path';

import type { TFafSettings } from '#_rules@shared/_types/faf.type.js';

import { resolveImportPath } from '#_rules@shared/_utils/_aggregates/resolve-import-path/index.js';
import { findTreeConfig } from '#_rules@shared/_utils/_primitives/find-tree-config/index.js';
import { toRelativePath } from '#_rules@shared/_utils/_primitives/to-relative-path/index.js';
import { getPrivateCategoryOwner } from '#_rules@shared/_utils/_systems/get-private-category-owner/index.js';

/**
 * Returns the owner of the closest Fractal Branch ancestor, or null.
 */
function getFractalBranchOwner(relPath: string): null | string {
  let current = relPath;
  while (current && current !== '.' && current !== '/') {
    const folderName = path.basename(current);
    if (folderName.startsWith('_') && folderName.includes('@shared')) {
      return path.dirname(current).replace(/\\/g, '/');
    }
    const parent = path.dirname(current).replace(/\\/g, '/');
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return null;
}

/**
 * @fileoverview Rule: faf/no-fractal-branch-leak
 * Enforces the FAF Law of Fractal Branch Encapsulation.
 *
 * FAF Law: Fractal Branches (directories following the `_<Scope>@shared` naming convention)
 * hold internal shared implementations. They are private to their parent Scope's subtree
 * and cannot leak or be imported by files outside of that scope.
 *
 * Valid:
 * - A utility inside `src/_rules/_rules@shared/_utils/` importing from `src/_rules/_rules@shared/`.
 *
 * Invalid:
 * - A rule inside `src/_rules/naming-conventions/` importing from `src/_rules/_rules@shared/_utils/_utils@shared/` (out-of-scope).
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

    function checkImport(node: Rule.Node, importValue: string) {
      const resolvedRelPath = resolveImportPath(
        importValue,
        relPath,
        settings.faf!
      );
      if (!resolvedRelPath) {
        return; // External import or unresolved alias
      }

      const importedDir = path.dirname(resolvedRelPath);
      const owner = getFractalBranchOwner(importedDir);

      if (owner) {
        // The importing file must be inside the owner's sub-tree
        const isDescendant =
          relPath === owner || relPath.startsWith(owner + '/');
        if (!isDescendant) {
          context.report({
            message: `Importing from Fractal Branch is forbidden. The imported resource is private to "${owner}" and its descendants.`,
            node,
          });
        } else {
          // FAF Guideline G2: Private Category Leak check. Even within an authorized Fractal Branch scope,
          // importing from a Private Category is forbidden unless the importer is inside the owner Fragment's subtree.
          const privateOwner = getPrivateCategoryOwner(importedDir, config!);
          if (privateOwner) {
            const isPrivateDescendant =
              relPath === privateOwner ||
              relPath.startsWith(privateOwner + '/');
            if (!isPrivateDescendant) {
              context.report({
                message: `Importing from Private Category is forbidden. The imported resource is private to "${privateOwner}".`,
                node,
              });
            }
          }
        }
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
        'Prevent leakage of Fractal Branch internals outside their owner scope',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
