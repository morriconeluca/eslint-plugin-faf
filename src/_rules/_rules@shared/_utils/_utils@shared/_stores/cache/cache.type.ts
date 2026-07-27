import type {
  TCategoryConfig,
  TFolderType,
  TTreeConfig,
} from '../../../../_types/faf.type.js';

export type TCacheState = {
  categoryConfigCache: TCategoryConfigCache;
  classifyCache: TClassifyCache;
  dirCache: TDirCache;
  packageImports: TPackageImports;
  projectRoot: string;
  resolvedImportPathCache: TResolvedImportPathCache;
  rolesCache: TRolesCache;
  treeConfigCache: TTreeConfigCache;
  treeConfigIncludingExcludedCache: TTreeConfigCache;
};
export type TCategoryConfigCache = Map<string, null | TCategoryConfig>;
export type TClassifyCache = Map<string, TFolderType>;
export type TDirCache = Record<string, { dirs: string[]; files: string[] }>;
export type TPackageImports = null | Record<string, string>;
export type TResolvedImportPathCache = Map<string, string>;
export type TRolesCache = WeakMap<TTreeConfig, Set<string>>;

export type TTreeConfigCache = Map<string, null | TTreeConfig>;
