# La API de pensieve: /auth y /commit, sin estado.
#
# El contexto de build es `pensieve/`, no `pensieve/api/`, porque los CLIENT_ID
# salen de `src/config.json` — el mismo fichero que lee el cliente, para que no
# puedan divergir.
FROM denoland/deno:latest

WORKDIR /app

COPY src/config.json src/config.json
COPY api api

RUN deno cache --config api/deno.json api/index.ts

CMD ["deno", "run", "--allow-net", "--allow-env", "--config", "api/deno.json", "api/index.ts"]
