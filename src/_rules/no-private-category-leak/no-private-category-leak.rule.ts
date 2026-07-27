import type { Rule } from 'eslint';

import path from 'path';

import {
  findTreeConfig,
  getPrivateCategoryOwner,
  resolveImportPath,
  type TFafSettings,
  toRelativePath,
} from '#_rules@shared/_utils/context/index.js';

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
      const owner = getPrivateCategoryOwner(importedDir, config!);

      if (owner) {
        // The importing file must be inside the owner's sub-tree
        const isDescendant =
          relPath === owner || relPath.startsWith(owner + '/');
        if (!isDescendant) {
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
