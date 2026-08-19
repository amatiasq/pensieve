import { Hono } from 'hono';
import { createAuthHandler } from './auth.ts';
import { commit } from './commit.ts';

// El nginx de al lado sirve la app y proxea /auth y /commit aquí, así que para
// el navegador esto es el mismo origen: no hay CORS que acertar.
const app = new Hono();

app.post(
  '/auth',
  createAuthHandler({
    dev: requireSecret('CLIENT_SECRET_DEV'),
    prod: requireSecret('CLIENT_SECRET_PROD'),
  }),
);

app.post('/commit', commit);

Deno.serve({ port: Number(Deno.env.get('PORT') ?? 8080) }, app.fetch);

// Al arrancar y no al atender: sin el secreto el contenedor no debe levantarse,
// porque si el login falla la app no carga.
function requireSecret(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Falta ${name}: /auth no puede canjear el code sin él`);
  }

  return value;
}
