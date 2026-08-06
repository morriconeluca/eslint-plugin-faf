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
 * @fileoverview Rule: faf/no-private-category-leak
 * Enforces the FAF Law of Private Category Encapsulation.
 *
 * FAF Law: Category folders prefixed with `_` nested directly inside a Fragment/Root Fragment
 * are Private Categories containing internal implementation details.
 * Their contents are private to the owning Fragment/Root Fragment subtree and cannot leak or be imported externally.
 *
 * Valid:
 * - Sibling nodes within the owner Fragment importing from the Private Category (e.g. `example/example.component.tsx`
 *   importing from `example/_components/child/index.js`).
 *
 * Invalid:
 * - A rule inside `src/_rules/naming-conventions/` importing from `src/_rules/_rules@shared/_utils/_utils@shared/_stores/cache/` (leak).
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
      const info = getPrivateCategoryInfo(importedDir, config!);

      if (info) {
        const { owner, privateCategoryPath } = info;
        // Allowed if:
        // 1. Importer is a direct child of the owner
        // 2. OR Importer and imported resource share the same immediate sub-domain/sub-fragment under the Private Category
        // 3. OR the imported resource is inside a Fractal Branch and the importer is a descendant of that branch's owner
        const isDirectChild = path.dirname(relPath) === owner;

        const importerSubDomain = getImmediateSubDomain(
          relPath,
          privateCategoryPath
        );
        const importedSubDomain = getImmediateSubDomain(
          resolvedRelPath,
          privateCategoryPath
        );
        const isInsideSameSubDomain =
          importerSubDomain !== '' && importerSubDomain === importedSubDomain;

        let isFractalBranchAllowed = false;
        const fbOwner = getFractalBranchOwner(importedDir);
        if (fbOwner) {
          // The Fractal Branch must be nested inside (or be) the Private Category itself
          const isFbInsidePrivateCategory =
            fbOwner === privateCategoryPath ||
            fbOwner.startsWith(privateCategoryPath + '/');
          if (isFbInsidePrivateCategory) {
            isFractalBranchAllowed =
              relPath === fbOwner || relPath.startsWith(fbOwner + '/');
          }
        }

        if (
          !isDirectChild &&
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
        'Prevent leakage and unauthorized imports of Private Category internals',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
