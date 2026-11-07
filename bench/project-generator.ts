import nodeFs from 'node:fs';
import nodeOs from 'node:os';
import nodePath from 'node:path';

import type {
  TGeneratedProject,
  TGenerateProjectOptions,
} from './benchmark.type.js';

const CONFIG_FILE_NAME = 'fafconfig.ts';
const MANIFEST_FILE_NAME = 'package.json';
const UTF8_ENCODING = 'utf8';

const FAF_CONFIG_TEMPLATE = `export default {
  faf: {
    locals: [
      {
        roles: [{ category: '_utils', name: 'util' }],
        rootLayers: ['src'],
        subGraphRoles: [{ name: 'spec' }],
      },
    ],
  },
};
`;

const PACKAGE_JSON_TEMPLATE = JSON.stringify(
  {
    name: 'synthetic-faf-benchmark',
    private: true,
    type: 'module',
    version: '1.0.0',
  },
  null,
  2
);

const resolveProjectDirectory = (explicitTarget?: string): string => {
  if (explicitTarget !== undefined && explicitTarget.length > 0) {
    nodeFs.mkdirSync(explicitTarget, { recursive: true });
    return explicitTarget;
  }
  const prefix = nodePath.join(nodeOs.tmpdir(), 'faf-bench-');
  return nodeFs.mkdtempSync(prefix);
};

export const generateBenchmarkProject = (
  options: TGenerateProjectOptions
): TGeneratedProject => {
  const projectPath = resolveProjectDirectory(options.targetDirectory);
  const srcDirectory = nodePath.join(projectPath, 'src');
  const utilsDirectory = nodePath.join(srcDirectory, '_utils');

  nodeFs.mkdirSync(utilsDirectory, { recursive: true });
  nodeFs.writeFileSync(
    nodePath.join(projectPath, MANIFEST_FILE_NAME),
    PACKAGE_JSON_TEMPLATE,
    UTF8_ENCODING
  );
  nodeFs.writeFileSync(
    nodePath.join(projectPath, CONFIG_FILE_NAME),
    FAF_CONFIG_TEMPLATE,
    UTF8_ENCODING
  );

  const fragmentCount = Math.max(1, Math.floor(options.logicalNodeCount / 2));

  for (let index = 0; index < fragmentCount; index += 1) {
    const fragmentName = `fn-${index.toString()}`;
    const fragmentDirectory = nodePath.join(utilsDirectory, fragmentName);
    nodeFs.mkdirSync(fragmentDirectory, { recursive: true });

    const masterFileName = `${fragmentName}.util.ts`;
    const masterPath = nodePath.join(fragmentDirectory, masterFileName);
    const masterSource = `export const fn${index.toString()} = () => ${index.toString()};\n`;
    nodeFs.writeFileSync(masterPath, masterSource, UTF8_ENCODING);

    const accessPath = nodePath.join(fragmentDirectory, 'index.ts');
    const accessSource = `export { fn${index.toString()} } from './${fragmentName}.util.js';\n`;
    nodeFs.writeFileSync(accessPath, accessSource, UTF8_ENCODING);
  }

  const entryFile = 'src/_utils/fn-0/fn-0.util.ts';
  const secondFile =
    fragmentCount > 1
      ? 'src/_utils/fn-1/fn-1.util.ts'
      : 'src/_utils/fn-0/index.ts';

  const cleanup = (): void => {
    nodeFs.rmSync(projectPath, { force: true, recursive: true });
  };

  return {
    cleanup,
    entryFile,
    logicalNodeCount: fragmentCount * 2,
    projectPath,
    secondFile,
  };
};
