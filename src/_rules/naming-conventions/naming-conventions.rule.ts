import type { Rule } from 'eslint';

import path from 'path';

import {
  classifyFolder,
  findTreeConfig,
  getCategoryConfig,
  getFileRole,
  getProjectRoot,
  getRootFragmentConfig,
  readDirCached,
  type TFafSettings,
  toRelativePath,
} from '#_rules@shared/_utils/context/index.js';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const rule: Rule.RuleModule = {
  create(context) {
    return {
      Program(node) {
        const absPath = context.filename;
        const relPath = toRelativePath(absPath);
        const settings = context.settings as { faf?: TFafSettings };

        if (!settings.faf) {
          return;
        }

        const config = findTreeConfig(relPath, settings.faf);
        if (!config) {
          return;
        }

        const relDir = path.dirname(relPath);
        const folderName = path.basename(relDir);
        const parentType = classifyFolder(relDir, config);

        // 1. Check if file is in a Foreign Domain
        if (parentType === 'foreign') {
          return;
        }

        const fileName = path.basename(relPath);

        // 2. Validate folder name casing and conventions (including all ancestors)
        let currentDir = relDir;
        while (currentDir && currentDir !== '.' && currentDir !== '/') {
          const isInTree = config.includes.some(
            (inc) => currentDir === inc || currentDir.startsWith(inc + '/')
          );
          const isExcluded =
            config.excludes?.some(
              (exc) => currentDir === exc || currentDir.startsWith(exc + '/')
            ) ?? false;

          if (!isInTree || isExcluded) {
            break;
          }

          const currentFolderName = path.basename(currentDir);
          const currentType = classifyFolder(currentDir, config);

          // FAF Guideline G3: Layer/Category Underscore Prefix. All organizational folders (Layers and Categories)
          // must start with an underscore (e.g. "_my-layer") to separate them from Fragments.
          if (
            (currentType === 'layer' || currentType === 'category') &&
            !currentFolderName.startsWith('_')
          ) {
            context.report({
              message: `Layer/Category directory "${currentFolderName}" must be prefixed with an underscore (e.g. "_${currentFolderName}").`,
              node,
            });
          }

          // FAF Guideline G4: Fragment Underscore Absence. Logical Fragment directories must NOT be prefixed
          // with an underscore since they represent clean domain-driven entrypoints.
          if (
            currentFolderName.startsWith('_') &&
            !currentFolderName.includes('@shared')
          ) {
            const contents = readDirCached(currentDir);
            const hasIndex =
              contents.files.includes('index.ts') ||
              contents.files.includes('index.js');
            if (hasIndex) {
              context.report({
                message: `Directory "${currentFolderName}" has an Access Node (index.ts) but its name starts with "_". Fragments must not be prefixed with underscore.`,
                node,
              });
            }
          }

          // Validate casing
          if (currentFolderName !== 'src') {
            let baseFolderName = currentFolderName.replace(/@shared$/, '');
            if (baseFolderName.startsWith('_')) {
              baseFolderName = baseFolderName.substring(1);
            }
            if (
              baseFolderName.startsWith('[') &&
              baseFolderName.endsWith(']')
            ) {
              baseFolderName = baseFolderName.substring(
                1,
                baseFolderName.length - 1
              );
            }
            const isKebab = KEBAB_CASE_REGEX.test(baseFolderName);
            if (!isKebab) {
              context.report({
                message: `Folder name "${currentFolderName}" must be in kebab-case (e.g. "_my-folder" or "_[my-param]").`,
                node,
              });
            }
          }

          // Validate Fractal Branch naming
          if (currentType === 'fractal-branch') {
            const expectedScope = path.basename(path.dirname(currentDir));
            const normalizedExpectedScope = expectedScope.startsWith('_')
              ? expectedScope.substring(1)
              : expectedScope;
            const expectedName = `_${normalizedExpectedScope}@shared`;
            if (currentFolderName !== expectedName) {
              context.report({
                message: `Fractal Branch name "${currentFolderName}" must match its parent scope name: "${expectedName}".`,
                node,
              });
            }
          }

          // Validate invalid fragments (missing index file)
          if (currentType === 'invalid-fragment') {
            context.report({
              message: `Fragment directory "${currentFolderName}" is missing an Access Node (index.ts/index.js).`,
              node,
            });
          }

          // Validate Fragment inside Layer restriction
          if (
            currentType === 'fragment' ||
            currentType === 'invalid-fragment'
          ) {
            const relParentDir = path.dirname(currentDir).replace(/\\/g, '/');
            const parentFolderName = path.basename(relParentDir);
            const relParentType = classifyFolder(relParentDir, config);
            if (relParentType === 'layer') {
              const isParentRoute =
                config.routeHierarchies &&
                config.routeHierarchies.some((rh) =>
                  rh.paths.some(
                    (rp) =>
                      relParentDir === rp || relParentDir.startsWith(rp + '/')
                  )
                );
              if (!isParentRoute) {
                context.report({
                  message: `Fragment directory "${currentFolderName}" cannot be placed directly inside Layer "${parentFolderName}". Fragments must be contained within a Category.`,
                  node,
                });
              }
            }
          }

          currentDir = path.dirname(currentDir).replace(/\\/g, '/');
        }

        // 3. Validate direct parent type restrictions on files
        if (parentType === 'layer') {
          context.report({
            message: `Layers cannot contain files directly. File "${fileName}" is placed directly inside Layer "${folderName}".`,
            node,
          });
          return;
        }

        if (parentType === 'fractal-branch') {
          context.report({
            message: `Fractal Branches cannot contain files directly. File "${fileName}" is placed directly inside Fractal Branch "${folderName}".`,
            node,
          });
          return;
        }

        if (parentType === 'invalid-fragment') {
          return; // Already reported by ancestor loop
        }

        // 5. File level validation
        if (fileName === 'index.ts' || fileName === 'index.js') {
          // Access Node
          if (parentType !== 'fragment') {
            context.report({
              message: `Access Nodes ("index.ts/index.js") are exclusive to Fragments. Found index file directly inside "${folderName}" (classified as ${parentType}).`,
              node,
            });
          }
          return;
        }

        // Check if file is a Root Node
        const rfConfig = getRootFragmentConfig(relDir, config);
        if (rfConfig) {
          const flatRootNodes = rfConfig.rootNodes.flat();
          // Check if file matches any relative rootNode path (or simple filename)
          const isMatchedRootNode = flatRootNodes.some((rn) => {
            if (rn.includes('/')) {
              const rfPath = rfConfig.paths[0] ?? '';
              const absRn = path.resolve(getProjectRoot(), rfPath, rn);
              return toRelativePath(absRn) === relPath;
            }
            return rn === fileName;
          });

          if (isMatchedRootNode) {
            return; // Valid Root Node
          }
        }

        // Check if file is README or config file that is not a Logical Node
        if (
          fileName === 'README.md' ||
          fileName === 'package.json' ||
          fileName === 'tsconfig.json'
        ) {
          return;
        }

        const role = getFileRole(fileName, config);
        const ext = path.extname(fileName);

        if (parentType === 'fragment') {
          // Check route hierarchy role constraint
          const matchedRoute = config.routeHierarchies?.find((rh) =>
            rh.paths.some((rp) => relDir === rp || relDir.startsWith(rp + '/'))
          );
          if (matchedRoute) {
            const contents = readDirCached(relDir);
            const fileRoles = contents.files.map((f) => getFileRole(f, config));
            if (!fileRoles.includes(matchedRoute.role)) {
              context.report({
                message: `Route terminal Fragment "${folderName}" must contain a Master Node with role "${matchedRoute.role}" (e.g. "${folderName}.${matchedRoute.role}.ts").`,
                node,
              });
            }
          }

          // Check that it shares the Fragment's name
          if (!fileName.startsWith(folderName + '.')) {
            context.report({
              message: `Fragment Node "${fileName}" must share the parent Fragment name: "${folderName}.<role>${ext}".`,
              node,
            });
          }

          // In a Fragment, ALL files must have a role, even if they have whitelisted extensions
          if (!role) {
            context.report({
              message: `File "${fileName}" inside Fragment "${folderName}" must have an explicit role suffix (e.g. "${folderName}.style${ext}").`,
              node,
            });
          }
        }

        if (parentType === 'category') {
          const catConfig = getCategoryConfig(relDir, config);
          if (catConfig) {
            const allowedExts = catConfig.allowedExtensions ?? [
              '.js',
              '.jsx',
              '.ts',
              '.tsx',
            ];
            if (!allowedExts.includes(ext)) {
              context.report({
                message: `File extension "${ext}" is not allowed in Category "${folderName}". Allowed extensions: ${allowedExts.join(', ')}.`,
                node,
              });
              return;
            }

            const isCodeExt = ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
            if (isCodeExt) {
              if (!role) {
                context.report({
                  message: `Logical Node "${fileName}" inside Category "${folderName}" must have a role suffix.`,
                  node,
                });
              } else if (role !== catConfig.role) {
                context.report({
                  message: `Role "${role}" for file "${fileName}" does not match the expected Category role "${catConfig.role}".`,
                  node,
                });
              }
            } else {
              // Asset files
              if (role && role !== catConfig.role) {
                context.report({
                  message: `Role "${role}" for asset "${fileName}" does not match the expected Category role "${catConfig.role}".`,
                  node,
                });
              }
            }
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce naming conventions and folder taxonomy in FAF architecture',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
