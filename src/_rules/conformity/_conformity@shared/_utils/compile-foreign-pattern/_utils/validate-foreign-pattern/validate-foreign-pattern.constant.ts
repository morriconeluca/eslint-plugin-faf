export const SLASH = '/';
export const BRACE_REGEX = /[{}]/u;
export const REGEX_SHAPE_PATTERN = /^\^|\$$|^\/.+\/$/u;
export const INVALID_GLOBSTAR_REGEX = /(?:[^*]\*\*|\*\*[^*]|\*{3,})/u;
export const DOT_SEGMENTS = new Set(['.', '..']);
