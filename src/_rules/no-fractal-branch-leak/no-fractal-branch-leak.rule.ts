import type { Rule } from 'eslint';

import path from 'path';

import type { TFafSettings } from '#_rules@shared/_types/faf.type.js';

import { resolveImportPath } from '#_rules@shared/_utils/_aggregates/resolve-import-path/index.js';
import { findTreeConfig } from '#_rules@shared/_utils/_primitives/find-tree-config/index.js';
import { getFractalBranchOwner } from '#_rules@shared/_utils/_primitives/get-fractal-branch-owner/index.js';
import { getImmediateSubDomain } from '#_rules@shared/_utils/_primitives/get-immediate-sub-domain/index.js';
import { toRelativePath } from '#_rules@shared/_utils/_primitives/to-relative-path/index.js';
import { getPrivateCategoryInfo } from '#_rules@shared/_utils/_systems/get-private-category-info/index.js';

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
      const fractalBranchOwner = getFractalBranchOwner(importedDir);

      if (fractalBranchOwner) {
        // The importing file must be inside the owner's sub-tree
        const isDescendant =
          relPath === fractalBranchOwner ||
          relPath.startsWith(fractalBranchOwner + '/');
        if (!isDescendant) {
          context.report({
            message: `Importing from Fractal Branch is forbidden. The imported resource is private to "${fractalBranchOwner}" and its descendants.`,
            node,
          });
        } else {
          // Even within an authorized Fractal Branch scope, a Private Category nested
          // inside it still applies its own, narrower access restriction
          const info = getPrivateCategoryInfo(importedDir, config!);
          if (info) {
            const { owner, privateCategoryPath } = info;
            const isPrivateDirectChild = path.dirname(relPath) === owner;

            const importerSubDomain = getImmediateSubDomain(
              relPath,
              privateCategoryPath
            );
            const importedSubDomain = getImmediateSubDomain(
              resolvedRelPath,
              privateCategoryPath
            );
            const isInsideSameSubDomain =
              importerSubDomain !== '' &&
              importerSubDomain === importedSubDomain;

            // `fractalBranchOwner` is already the closest Fractal Branch to importedDir (same
            // input as above), so if it lies inside the Private Category, `isDescendant` above
            // has already proven the importer's access to it.
            const isFractalBranchAllowed =
              fractalBranchOwner === privateCategoryPath ||
              fractalBranchOwner.startsWith(privateCategoryPath + '/');

            if (
              !isPrivateDirectChild &&
              !isInsideSameSubDomain &&
              !isFractalBranchAllowed
            ) {
              context.report({
                message: `Importing from Private Category is forbidden. The imported resource is private to "${owner}".`,
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
