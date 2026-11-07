import type {
  TFAFConfig,
  TFAFLocalHorizontalHierarchy,
  TFAFRoles,
} from '../../src/_src@shared/_types/faf-config.type.js';

export type TEdgeLawDeclaration = {
  readonly categoryNames: readonly string[];
  readonly externalAuthorizations: readonly TExternalAuthorization[];
  readonly horizontalHierarchies: readonly THorizontalHierarchy[];
  readonly rootFragmentPaths: readonly string[];
  readonly rootLayerPaths: readonly string[];
  readonly treeOrigins: readonly string[];
};

export type TExternalAuthorization = {
  readonly from: readonly string[];
  readonly to: readonly string[];
};

export type THorizontalHierarchy = readonly (readonly string[])[];

type TRoleCategory = {
  readonly category: string;
};

const isRoleCategory = (value: unknown): value is TRoleCategory =>
  typeof value === 'object' &&
  value !== null &&
  'category' in value &&
  typeof value.category === 'string';

const pushRoleCategories = (names: string[], value: unknown): void => {
  if (isRoleCategory(value)) {
    names.push(value.category);
    return;
  }
  if (!Array.isArray(value)) {
    return;
  }
  for (const role of value) {
    if (isRoleCategory(role)) {
      names.push(role.category);
    }
  }
};

const collectCategoryNames = (roles: TFAFRoles | undefined): string[] => {
  if (roles === undefined) {
    return [];
  }
  const names: string[] = [];
  for (const entry of roles) {
    pushRoleCategories(names, entry);
  }
  return names;
};

export function declarationFromFafConfig(
  config: TFAFConfig
): TEdgeLawDeclaration {
  const categoryNames: string[] = [];
  const externalAuthorizations: TExternalAuthorization[] = [];
  const horizontalHierarchies: THorizontalHierarchy[] = [];
  const rootFragmentPaths: string[] = [];
  const rootLayerPaths: string[] = [];
  const treeOrigins: string[] = [];

  appendAuthorizations(
    externalAuthorizations,
    config.faf.common?.externalDependencies
  );
  appendHierarchies(
    horizontalHierarchies,
    config.faf.common?.horizontalHierarchies
  );
  appendLocalHierarchies(
    horizontalHierarchies,
    config.faf.common?.localHorizontalHierarchies
  );
  categoryNames.push(...collectCategoryNames(config.faf.common?.roles));

  for (const local of config.faf.locals) {
    appendAuthorizations(externalAuthorizations, local.externalDependencies);
    appendHierarchies(horizontalHierarchies, local.horizontalHierarchies);
    appendLocalHierarchies(
      horizontalHierarchies,
      local.localHorizontalHierarchies
    );
    categoryNames.push(...collectCategoryNames(local.roles));
    if (local.rootFragments !== undefined) {
      for (const rootFragment of local.rootFragments) {
        rootFragmentPaths.push(rootFragment.path);
        treeOrigins.push(rootFragment.path);
      }
    }
    appendRootLayers(rootLayerPaths, treeOrigins, local.rootLayers);
  }

  return {
    categoryNames,
    externalAuthorizations,
    horizontalHierarchies,
    rootFragmentPaths,
    rootLayerPaths,
    treeOrigins,
  };
}

function appendAuthorizations(
  target: TExternalAuthorization[],
  authorizations: readonly TExternalAuthorization[] | undefined
): void {
  if (authorizations === undefined) {
    return;
  }
  target.push(...authorizations);
}

function appendHierarchies(
  target: THorizontalHierarchy[],
  hierarchies: readonly THorizontalHierarchy[] | undefined
): void {
  if (hierarchies === undefined) {
    return;
  }
  target.push(...hierarchies);
}

function appendLocalHierarchies(
  target: THorizontalHierarchy[],
  localHierarchies: readonly TFAFLocalHorizontalHierarchy[] | undefined
): void {
  if (localHierarchies === undefined) {
    return;
  }
  for (const entry of localHierarchies) {
    target.push(entry.hierarchies);
  }
}

function appendRootLayers(
  paths: string[],
  origins: string[],
  layers: readonly string[] | undefined
): void {
  if (layers === undefined) {
    return;
  }
  paths.push(...layers);
  origins.push(...layers);
}
