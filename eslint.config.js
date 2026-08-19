import eslint from '@eslint/js';
import { dirname, relative, resolve, sep } from 'node:path';
import tseslint from 'typescript-eslint';

const SRC = resolve(import.meta.dirname, 'src');
const LAYER_NUMBER = /^(\d)-/;

// La raíz de composición monta hooks y componentes a propósito, así que es la
// única carpeta cuyo número miente. Renumerarla movería tres carpetas y no
// ganaría nada: por encima de 7 no hay capa a la que pudiera saltar.
const COMPOSITION_ROOT = '5-app';

const layers = {
  rules: {
    'no-upward-import': {
      meta: {
        type: 'problem',
        docs: { description: 'Una capa sólo importa de capas iguales o inferiores.' },
        schema: [],
      },
      create(context) {
        const own = layerOf(context.filename);
        if (own == null || folderOf(context.filename) === COMPOSITION_ROOT) return {};

        return {
          'ImportDeclaration, ImportExpression, ExportAllDeclaration, ExportNamedDeclaration'(
            node,
          ) {
            const { source } = node;
            if (source?.type !== 'Literal') return;
            if (typeof source.value !== 'string' || !source.value.startsWith('.')) return;

            const target = layerOf(resolve(dirname(context.filename), source.value));
            if (target == null || target <= own) return;

            context.report({
              node: source,
              message: `La capa ${own} no puede importar de la capa ${target}.`,
            });
          },
        };
      },
    },
  },
};

function layerOf(file) {
  const match = LAYER_NUMBER.exec(folderOf(file));
  return match ? Number(match[1]) : null;
}

function folderOf(file) {
  return relative(SRC, file).split(sep)[0];
}

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // `api/` es Deno y lo comprueban `deno check` y `deno lint`, no éste.
    ignores: [
      '.cache/**',
      'api/**',
      'dist/**',
      '**/node_modules/**',
      'playwright-report/**',
    ],
  },
  {
    plugins: { layers },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'layers/no-upward-import': 'error',
    },
  },
  {
    files: ['public/**/*.js'],
    languageOptions: { globals: { self: 'readonly' } },
  },
  {
    // Playwright deduce las dependencias de un fixture parseando su
    // destructuring, así que uno sin dependencias se escribe `{}` o no arranca.
    files: ['e2e/**'],
    rules: {
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
    },
  },
);
