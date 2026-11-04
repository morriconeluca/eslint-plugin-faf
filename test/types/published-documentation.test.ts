import type { Node, PropertySignature, TypeAliasDeclaration } from 'typescript';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'tsup';
import {
  createSourceFile,
  forEachChild,
  getJSDocCommentsAndTags,
  isPropertySignature,
  isTypeAliasDeclaration,
  ScriptTarget,
} from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

const UTF8 = 'utf8';

const EXPECTED_TFAF_TYPE_NAMES = [
  'TFAFCommonConfig',
  'TFAFConfig',
  'TFAFExternalDependency',
  'TFAFForeignNodeFamily',
  'TFAFHierarchy',
  'TFAFLocalConfig',
  'TFAFLocalHorizontalHierarchy',
  'TFAFMimeticPathStructure',
  'TFAFNonEmptyArray',
  'TFAFRole',
  'TFAFRoles',
  'TFAFRootDependencyEdge',
  'TFAFRootFragment',
  'TFAFSharedConfig',
  'TFAFSubGraphRole',
  'TFAFTreeDependency',
] as const;

const collectPropertySignatures = (
  rootNode: Node
): readonly PropertySignature[] => {
  const propertySignatures: PropertySignature[] = [];
  const visitChild = (node: Node): void => {
    if (isPropertySignature(node)) {
      propertySignatures.push(node);
    }
    forEachChild(node, visitChild);
  };
  visitChild(rootNode);
  return propertySignatures;
};

const newestMtime = (directory: string): number => {
  let newest = fs.statSync(directory).mtimeMs;
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    const entryMtime = entry.isDirectory()
      ? newestMtime(entryPath)
      : fs.statSync(entryPath).mtimeMs;
    if (entryMtime > newest) {
      newest = entryMtime;
    }
  }
  return newest;
};

const resolveDeclarationSource = async (): Promise<string> => {
  const rootDirectory = process.cwd();
  const distributionPath = path.resolve(rootDirectory, 'dist/main.d.ts');
  const mainTsPath = path.resolve(rootDirectory, 'src/main.ts');
  const sourceRoot = path.resolve(rootDirectory, 'src');

  const hasDistribution = fs.existsSync(distributionPath);
  if (hasDistribution) {
    const distributionMtime = fs.statSync(distributionPath).mtimeMs;
    const isDistributionFresh = distributionMtime >= newestMtime(sourceRoot);
    if (isDistributionFresh) {
      return fs.readFileSync(distributionPath, UTF8);
    }
  }

  const temporaryDirectory = path.join(
    os.tmpdir(),
    `eslint-plugin-faf-dts-${Date.now()}`
  );
  await build({
    clean: true,
    dts: {
      compilerOptions: {
        ignoreDeprecations: '6.0',
      },
      only: true,
    },
    entry: [mainTsPath],
    outDir: temporaryDirectory,
    silent: true,
  });

  const generatedPath = path.join(temporaryDirectory, 'main.d.ts');
  const generatedContent = fs.readFileSync(generatedPath, UTF8);
  fs.rmSync(temporaryDirectory, { force: true, recursive: true });
  return generatedContent;
};

describe('published declaration documentation', () => {
  const WARMUP_TIMEOUT_MS = 30_000;
  let declarationSource = '';
  const typeAliasDeclarations = new Map<string, TypeAliasDeclaration>();

  beforeAll(async () => {
    declarationSource = await resolveDeclarationSource();
    const sourceFile = createSourceFile(
      'main.d.ts',
      declarationSource,
      ScriptTarget.ES2022,
      true
    );

    for (const statement of sourceFile.statements) {
      if (isTypeAliasDeclaration(statement)) {
        typeAliasDeclarations.set(statement.name.text, statement);
      }
    }
  }, WARMUP_TIMEOUT_MS);

  it('declares all expected TFAF types in published main.d.ts', () => {
    for (const typeName of EXPECTED_TFAF_TYPE_NAMES) {
      expect(typeAliasDeclarations.has(typeName)).toBe(true);
    }
  });

  it('includes JSDoc blocks on every exported TFAF type alias', () => {
    for (const typeName of EXPECTED_TFAF_TYPE_NAMES) {
      const declaration = typeAliasDeclarations.get(typeName);
      expect(declaration).toBeDefined();
      if (declaration === undefined) {
        continue;
      }
      const comments = getJSDocCommentsAndTags(declaration);
      expect(
        comments.length,
        `Expected JSDoc on type alias ${typeName}`
      ).toBeGreaterThan(0);
    }
  });

  it('includes JSDoc blocks on every property of TFAFConfig and related types', () => {
    let verifiedPropertiesCount = 0;

    for (const typeName of EXPECTED_TFAF_TYPE_NAMES) {
      const declaration = typeAliasDeclarations.get(typeName);
      expect(declaration).toBeDefined();
      if (declaration === undefined) {
        continue;
      }
      const properties = collectPropertySignatures(declaration.type);
      for (const property of properties) {
        verifiedPropertiesCount += 1;
        const comments = getJSDocCommentsAndTags(property);
        const propertyName = property.name.getText();
        expect(
          comments.length,
          `Expected JSDoc on property ${typeName}.${propertyName}`
        ).toBeGreaterThan(0);
      }
    }

    expect(verifiedPropertiesCount).toBeGreaterThan(40);
  });
});
