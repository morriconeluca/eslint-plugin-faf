export type TAncestorEntry = {
  dir: string;
  folderName: string;
  parentDir: string;
  parentFolderName: string;
  parentType: TFolderType;
  type: TFolderType;
};

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

export type THttpMethod =
  | 'connect'
  | 'delete'
  | 'get'
  | 'head'
  | 'options'
  | 'patch'
  | 'post'
  | 'put'
  | 'trace';

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
  httpMethods?: THttpMethod[];
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
