import { KEBAB_CASE_PATTERN } from './is-kebab-case.constant.js';

export function isKebabCase(candidate: string): boolean {
  return KEBAB_CASE_PATTERN.test(candidate);
}
