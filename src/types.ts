import type { ESLint, Linter } from 'eslint';

/**
 * Custom type definition for the ESLint Fractal Architecture Framework (FAF) plugin.
 * Omits and refines the native ESLint Plugin configs to strictly enforce Flat Configuration types
 * compatible with ESLint v9 and v10.
 */
export type TFafPlugin = Omit<ESLint.Plugin, 'configs'> & {
  configs: {
    /**
     * Recommended FAF preset. Enables all FAF architecture constraints as blocking errors.
     */
    recommended: Linter.Config;
  };
};
