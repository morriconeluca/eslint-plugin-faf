export const EXCLUDED_PREFIXES = [
  '#',
  '//',
  'data:',
  'http:',
  'https:',
] as const;

export const INTERPOLATION_MARKERS = ['#{', '@{', 'var('] as const;

export const QUOTE_WRAP_PATTERN = /^(['"])([\s\S]*)\1$/;
