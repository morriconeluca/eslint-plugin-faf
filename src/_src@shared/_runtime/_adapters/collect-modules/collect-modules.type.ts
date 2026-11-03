import type {
  TCollectModulesInput as TCollectModulesSharedInput,
  TModuleCollection as TModuleCollectionShared,
} from './_collect-modules@shared/_types/collect-modules.type.js';

/**
 * Arguments of the synchronous module collection adapter.
 */
export type TCollectModulesInput = TCollectModulesSharedInput;

/**
 * Ordered collection consumed by pure graph construction and project verification.
 */
export type TModuleCollection = TModuleCollectionShared;
