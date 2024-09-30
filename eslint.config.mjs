// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/*
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
*/

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-trailing-spaces': 'error',
      'no-console': 1
    }
  }
]