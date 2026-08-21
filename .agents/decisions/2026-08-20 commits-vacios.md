# 2026-08-20 — Se acabaron los commits vacíos en pensieve-data

Cierra `pensieve/.agents/plans/commits-vacios.md`.

`api/commit.ts` creaba el commit sin comparar nada, así que guardar una nota sin
haberla tocado dejaba un commit igual al padre —GitHub los acepta— y el
historial se llenaba de ellos.

**El árbol nuevo trae su sha, y compararlo con el del padre es toda la guarda.**
Si coinciden no hay cambios: se devuelve el commit de la punta y no se crean ni
el commit ni el movimiento de la rama. Es una comparación, no un diff, y ahorra
las dos llamadas de escritura.

- La punta de la rama se lee ahora con `GET /branches/{branch}`, que trae el
  commit **y el sha de su árbol** en una llamada; `GET /git/refs/heads/…` sólo
  traía el primero, y sacar el árbol de ahí costaba una llamada extra. El total
  no sube: siguen siendo cuatro cuando hay cambios, dos cuando no.
- `/commit` contestaba 200 sin cuerpo, así que el cliente no podía distinguir
  «no había nada que guardar» de «se guardó». Ahora contesta
  `{ sha, committed }`; un fallo sigue siendo un 500 y el outbox lo reintenta.
- El indicador de sync no cambia: sin commit el guardado igualmente resuelve, y
  `synced` sigue siendo verdad.

`api/commit_test.ts` cubre las dos ramas con `fetch` sustituido, y comprueba las
llamadas que salen: con el árbol idéntico no se llega a `POST /git/commits`.
`amq pensieve check` corre ahora `deno test` además de `deno check`, así que
entra en CI sin tocar el workflow.

**Sin probar contra GitHub de verdad**: los e2e corren contra un mock del repo en
memoria, y el guardado real con la cuenta real sigue pendiente
([`retirar-cloudflare-y-pages.md`](../plans/retirar-cloudflare-y-pages.md)).
