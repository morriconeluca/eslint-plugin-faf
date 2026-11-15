import type {
  TClassifyTaxonomyInput as TClassifyTaxonomySharedInput,
  TGetRoleFromName as TGetRoleFromNameShared,
  TTaxonomyClassification as TTaxonomyClassificationShared,
} from './_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

/**
 * Inputs required to classify every fractal tree in one inventory.
 */
export type TClassifyTaxonomyInput = TClassifyTaxonomySharedInput;

/**
 * Function resolving a file Role from its name and the tree catalog.
 */
export type TGetRoleFromName = TGetRoleFromNameShared;

/**
 * Classifier product: taxonomy model plus configuration outcomes.
 */
export type TTaxonomyClassification = TTaxonomyClassificationShared;
