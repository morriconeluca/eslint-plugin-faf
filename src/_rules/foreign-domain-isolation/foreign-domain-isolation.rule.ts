import type { Rule } from 'eslint';

import type { TFafSettings } from '#_rules@shared/_types/faf.type.js';

import { resolveImportPath } from '#_rules@shared/_utils/_aggregates/resolve-import-path/index.js';
import { findTreeConfigIncludingExcluded } from '#_rules@shared/_utils/_primitives/find-tree-config-including-excluded/index.js';
import { toRelativePath } from '#_rules@shared/_utils/_primitives/to-relative-path/index.js';

/**
 * @fileoverview Rule: faf/foreign-domain-isolation
 * Enforces the FAF Law of Foreign Domain isolation.
 *
 * FAF Law: Foreign Domain files do not participate in the Dependency Graph: they must
 * never import a Logical Node, and a Logical Node must never import them.
 *
 * Invalid:
 * - A Logical Node importing a file from a Foreign Domain (e.g. `src/configs`).
 * - A Foreign Domain file importing a Logical Node from the FAF tree.
 */
const rule: Rule.RuleModule = {
  create(context) {
    const absPath = context.filename;
    const relPath = toRelativePath(absPath);
    const settings = context.settings as { faf?: TFafSettings };

    if (!settings.faf) {
      return {};
    }

    const config = findTreeConfigIncludingExcluded(relPath, settings.faf);
    if (!config) {
      return {};
    }

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

      // Case A (Logical Node ➔ Foreign Domain)
      if (!isCurrentFileExcluded && isImportedFileExcluded) {
        context.report({
          message: `Importing from Foreign Domain "${resolvedRelPath}" is forbidden for Logical Nodes.`,
          node,
        });
        return;
      }

      // Case B (Foreign Domain ➔ Logical Node)
      if (isCurrentFileExcluded && !isImportedFileExcluded) {
        context.report({
          message: `Foreign Domain files cannot import Logical Nodes from FAF tree ("${resolvedRelPath}").`,
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
        'Enforce isolation between Foreign Domains and Logical Nodes',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
