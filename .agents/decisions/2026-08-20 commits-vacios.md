# 2026-08-20 — Se acabaron los commits vacíos en pensieve-data

`api/commit.ts` creaba el commit sin comparar nada, así que guardar una nota sin
tocarla dejaba un commit igual al padre —GitHub los acepta—. **El árbol nuevo
trae su sha, y compararlo con el del padre es toda la guarda**: si coinciden se
devuelve el commit de la punta y no se crea commit ni se mueve la rama.

- La punta se lee con `GET /branches/{branch}`, que trae el commit y el sha de su
  árbol de una vez: cuatro llamadas cuando hay cambios, dos cuando no.
- `/commit` contesta `{ sha, committed }`; el 200 sin cuerpo de antes no dejaba
  distinguir «no había nada que guardar» de «se guardó». Un fallo sigue siendo un
  500 que el outbox reintenta.
- `api/commit_test.ts` cubre las dos ramas con `fetch` sustituido, y `amq
  pensieve check` corre `deno test` además de `deno check`: entra en CI sin tocar
  el workflow.
- Sin probar contra GitHub de verdad — los e2e van contra un mock del repo en
  memoria ([`retirar-cloudflare-y-pages.md`](../plans/retirar-cloudflare-y-pages.md)).
