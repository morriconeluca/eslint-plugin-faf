import type { TFAFConfig } from '../../../../_src@shared/_types/faf-config.type.js';
import type { TOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEffectiveDeclarations,
  TEffectivePathAlias,
} from '../../_conformity@shared/_types/verification-model.type.js';

/**
 * Declaration-resolution result before inventory construction and reference checks.
 */
export type TResolveDeclarationsResult =
  | {
      /**
       * Absolute directory hosting faf.config.ts.
       */
      readonly baseDirectory: string;

      /**
       * Absolute path of faf.config.ts.
       */
      readonly configPath: string;

      /**
       * Discriminant indicating declaration resolution failed with blocking outcomes.
       */
      readonly kind: 'blocked';

      /**
       * Local files loaded while evaluating faf.config.ts, empty when loading failed.
       */
      readonly loadedFiles: readonly string[];

      /**
       * Blocking outcomes stopping the verification pipeline.
       */
      readonly outcomes: readonly TOutcome[];
    }
  | {
      /**
       * Path aliases acquired from package.json or the common configuration.
       */
      readonly aliases: readonly TEffectivePathAlias[];

      /**
       * Absolute directory hosting faf.config.ts.
       */
      readonly baseDirectory: string;

      /**
       * Validated raw configuration object.
       */
      readonly config: TFAFConfig;

      /**
       * Absolute path of faf.config.ts.
       */
      readonly configPath: string;

      /**
       * Effective declarations composed for every Fractal Tree.
       */
      readonly declarations: TEffectiveDeclarations;

      /**
       * Discriminant indicating declaration resolution succeeded.
       */
      readonly kind: 'ready';

      /**
       * Local files loaded while evaluating faf.config.ts.
       */
      readonly loadedFiles: readonly string[];
    };
