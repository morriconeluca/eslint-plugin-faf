export type TCategoryConfig = {
  allowedExtensions?: string[];
  allowSingleFiles?: boolean;
  name: string;
  role?: string;
};

export type TFafSettings = {
  aliases?: Record<string, string>;
  trees: TTreeConfig[];
};

export type TFolderType =
  | 'category'
  | 'foreign'
  | 'fractal-branch'
  | 'fragment'
  | 'invalid-fragment'
  | 'layer'
  | 'root-fragment'
  | 'unknown';

export type TLocalHierarchyConfig = {
  hierarchies: string[][];
  paths: string[];
};

export type TRootFragmentConfig = {
  paths: string[];
  rootNodes: string[][];
  subRootFragments?: TRootFragmentConfig[];
};

export type TRouteHierarchyConfig = {
  paths: string[];
  role: string;
};

export type TTreeConfig = {
  categories?: TCategoryConfig[];
  excludes?: string[];
  globalHorizontalHierarchies?: string[][][];
  includes: string[];
  localHorizontalHierarchies?: TLocalHierarchyConfig[];
  roles: string[][];
  rootFragments?: TRootFragmentConfig[];
  routeHierarchies?: TRouteHierarchyConfig[];
};
