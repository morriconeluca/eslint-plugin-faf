import type { Rule } from 'eslint';

import path from 'path';

import {
  classifyFolder,
  findTreeConfig,
  type TFafSettings,
  toRelativePath,
} from '#_rules@shared/_utils/context/index.js';

const rule: Rule.RuleModule = {
  create(context) {
    const absPath = context.filename;
    const relPath = toRelativePath(absPath);
    const fileName = path.basename(relPath);

    // This rule only applies to Access Nodes (index.ts / index.js)
    if (fileName !== 'index.ts' && fileName !== 'index.js') {
      return {};
    }

    const settings = context.settings as { faf?: TFafSettings };
    if (!settings.faf) {
      return {};
    }

    const config = findTreeConfig(relPath, settings.faf);
    if (!config) {
      return {};
    }

    const relDir = path.dirname(relPath);
    const parentType = classifyFolder(relDir, config);

    // If it's not a Fragment, naming-conventions handles it, but let's ignore it here
    if (parentType !== 'fragment') {
      return {};
    }

    function checkSource(node: Rule.Node, sourceVal: string) {
      // Must be a relative import pointing to a file in the same directory (no subfolders, no parent folders)
      // Allowed format: "./filename" or "./filename.js" etc.
      // Must start with "./" and not contain any further "/"
      const isValidSibling = /^\.\/[^/]+$/.test(sourceVal);
      if (!isValidSibling) {
        context.report({
          message: `Access Node (index file) can only import or export its own sibling Fragment Nodes using simple relative paths (e.g. "./example.component"). Got "${sourceVal}".`,
          node,
        });
        return;
      }

      // FAF Guideline G1: The Access Node (barrel file) must only re-export
      // its sibling Fragment Nodes that reside within the same Fragment directory.
      const importedFilename = path.basename(sourceVal);
      if (
        importedFilename === 'index' ||
        importedFilename === 'index.ts' ||
        importedFilename === 'index.js' ||
        importedFilename === 'README.md' ||
        importedFilename === 'package.json'
      ) {
        return;
      }

      const fragmentName = path.basename(relDir);
      if (!importedFilename.startsWith(fragmentName + '.')) {
        context.report({
          message: `Access Node (index file) can only re-export its own Fragment Nodes (names starting with "${fragmentName}."). Got "${importedFilename}".`,
          node,
        });
      }
    }

    return {
      ExportAllDeclaration(node) {
        checkSource(node, node.source.value as string);
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          checkSource(node, node.source.value as string);
        }
      },
      ImportDeclaration(node) {
        checkSource(node, node.source.value as string);
      },
    };
  },
  meta: {
    docs: {
      description: 'Enforce Access Node rules for Fragments',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
