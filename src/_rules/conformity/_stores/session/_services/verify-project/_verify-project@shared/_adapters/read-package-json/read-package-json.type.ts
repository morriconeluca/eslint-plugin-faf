import type { TResult } from '../../../../../../../_conformity@shared/_types/outcome.type.js';

/**
 * Parsed payload of package.json containing optional object record and existence flag.
 */
export type TPackageJsonData = {
  /**
   * Parsed JSON dictionary content of package.json when present in the target directory.
   */
  readonly packageJson?: Record<string, unknown>;

  /**
   * Indicates whether a package.json file exists at the inspected location.
   */
  readonly present: boolean;
};

/**
 * Input arguments for reading package.json specifying the directory where lookup occurs.
 */
export type TReadPackageJsonInput = {
  /**
   * Directory path where package.json is synchronously looked up and parsed.
   */
  readonly directory: string;
};

/**
 * Result of reading package.json yielding parsed package data or diagnostic outcomes.
 */
export type TReadPackageJsonResult = TResult<TPackageJsonData>;
