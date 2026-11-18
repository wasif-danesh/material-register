import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/', '**/dist/', '**/build/', '**/.react-router/', 'api/drizzle/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // The rules of hooks, for the React code only.
  { files: ['web/**/*.{ts,tsx}'], ...reactHooks.configs.flat.recommended },
  // Last, so it switches off any rule that would fight Prettier's formatting.
  prettier,
);
