import type { Linter } from 'eslint';

import { LINTABLE_EXTENSIONS } from '../_src@shared/_constants/faf.constant.js';

export const recommended: Linter.Config = {
  files: LINTABLE_EXTENSIONS.map((extension) => `**/*${extension}`),
  rules: {
    'faf/conformity': 'error',
  },
};
