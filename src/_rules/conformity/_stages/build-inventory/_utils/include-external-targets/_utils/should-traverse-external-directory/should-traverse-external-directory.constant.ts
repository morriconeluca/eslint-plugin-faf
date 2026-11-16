export const NODE_MODULES_DIRECTORY = 'node_modules';

export const SKIPPED_DOT_DIRECTORIES: ReadonlySet<string> = new Set([
  '.agents',
  '.cache',
  '.changeset',
  '.git',
  '.github',
  '.husky',
  '.idea',
  '.next',
  '.nuxt',
  '.pnpm-store',
  '.stryker-tmp',
  '.svelte-kit',
  '.turbo',
  '.vercel',
  '.vscode',
  '.yarn',
]);

export const SKIPPED_ROOT_DIRECTORIES: ReadonlySet<string> = new Set([
  'build',
  'coverage',
  'dist',
  'out',
  'reports',
  'tmp',
]);
