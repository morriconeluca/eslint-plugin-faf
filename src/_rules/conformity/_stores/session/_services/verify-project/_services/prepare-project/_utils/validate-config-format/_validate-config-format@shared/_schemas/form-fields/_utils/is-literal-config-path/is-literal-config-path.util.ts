import { INVALID_CONFIG_PATH_SEGMENTS } from './is-literal-config-path.constant.js';

export function isLiteralConfigPath(path: string): boolean {
  if (path === '.') {
    return true;
  }
  if (path.includes('\\')) {
    return false;
  }
  const segments = path.split('/');
  return segments.every(
    (segment) => !INVALID_CONFIG_PATH_SEGMENTS.has(segment)
  );
}
