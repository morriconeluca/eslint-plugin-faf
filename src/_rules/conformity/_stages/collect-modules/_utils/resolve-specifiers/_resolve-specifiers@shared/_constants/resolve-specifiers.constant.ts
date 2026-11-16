export const CSS_NON_BARE_PREFIXES = ['./', '../', '/', '#'] as const;

export const DISCORDANCE_REASON =
  'Path alias resolution falls outside the declared alias targets';

export const NON_LITERAL_DYNAMIC_IMPORT_REASON =
  'Non-literal dynamic import cannot be resolved statically';

export const NODE_MODULES_MARKER = '/node_modules/';

export const NODE_MODULES_PREFIX = 'node_modules/';

export const RELATIVE_OR_ABSOLUTE_PREFIXES = ['./', '../', '/'] as const;

export const RESOLVER_OPTIONS = {
  builtinModules: true,
  conditionNames: ['import', 'require', 'node', 'types', 'style', 'default'],
  extensionAlias: {
    '.cjs': ['.cts', '.cjs'],
    '.js': ['.ts', '.tsx', '.js'],
    '.jsx': ['.tsx', '.jsx'],
    '.mjs': ['.mts', '.mjs'],
  },
  extensions: [
    '.ts',
    '.tsx',
    '.mts',
    '.cts',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.json',
    '.css',
  ],
  importsFields: [['imports']],
};
