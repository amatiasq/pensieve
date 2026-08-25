import { loader } from '@monaco-editor/react';

// La versión la inyecta `vite.config.ts` desde la dependencia de desarrollo,
// que es de donde salen los tipos: así lo que compila y lo que se ejecuta no
// pueden separarse.
export function loadMonacoFromCdn() {
  loader.config({
    paths: {
      vs: `https://cdn.jsdelivr.net/npm/monaco-editor@${__MONACO_VERSION__}/min/vs`,
    },
  });
}
