import type { Rule } from 'eslint';

import path from 'path';

import {
  classifyFolder,
  findTreeConfig,
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
      const importedFile = path.basename(resolvedRelPath);

      // If the imported file is inside a Fragment
      const importedFolderType = classifyFolder(importedDir, config!);
      if (importedFolderType === 'fragment') {
        const isAccessNode =
          importedFile === 'index.ts' || importedFile === 'index.js';
        if (!isAccessNode) {
          // Check if the importing file is outside B's Fragment
          const isInside =
            relPath === importedDir || relPath.startsWith(importedDir + '/');
          if (!isInside) {
            context.report({
              message: `Direct import of Fragment internal file "${importedFile}" is forbidden. You must import through its Access Node (index file) in "${importedDir}".`,
              node,
            });
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
        'Prevent direct import of Fragment internal files from outside the Fragment',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
