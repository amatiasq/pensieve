import type { Context } from 'hono';
// Los mismos ids que usa el cliente: si divergen, el canje del code falla.
import config from '../src/config.json' with { type: 'json' };

const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';

// El `client_secret` de la OAuth App no puede tocar el bundle del cliente: este
// canje es la única razón por la que pensieve necesita servidor.
//
// El `redirect_uri` lo manda el cliente y decide qué OAuth App se usa, la de
// desarrollo o la de producción; aquí sólo se elige el par id/secreto.
export function createAuthHandler(secrets: { dev: string; prod: string }) {
  return async (c: Context) => {
    const { searchParams } = new URL(c.req.url);
    const redirectUri = searchParams.get('redirect_uri') ?? '';
    const isDev = redirectUri.startsWith('http://localhost');

    const params = new URLSearchParams({
      client_id: isDev ? config.CLIENT_ID_DEV : config.CLIENT_ID_PROD,
      client_secret: isDev ? secrets.dev : secrets.prod,
      redirect_uri: redirectUri,
      state: searchParams.get('state') ?? '',
      code: searchParams.get('code') ?? '',
    });

    const response = await fetch(`${ACCESS_TOKEN_URL}?${params}`);

    // Sólo el cuerpo y el content-type. Devolver la respuesta de GitHub tal
    // cual pasa sus cabeceras enteras —CSP, cookies, rate limits— al navegador,
    // y son tantas que nginx contesta 502: "upstream sent too big header".
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('Content-Type') ??
          'application/x-www-form-urlencoded',
      },
    });
  };
}
