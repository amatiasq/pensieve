import { Hono } from 'hono';
import { createAuthHandler } from './auth.ts';
import { commit } from './commit.ts';
import { tarball } from './tarball.ts';

// El nginx de al lado sirve la app y proxea /auth, /commit y /tarball aquí, así
// que para el navegador esto es el mismo origen: no hay CORS que acertar.
if (import.meta.main) {
  const app = createApp({
    dev: requireSecret('CLIENT_SECRET_DEV'),
    prod: requireSecret('CLIENT_SECRET_PROD'),
  });

  Deno.serve({ port: Number(Deno.env.get('PORT') ?? 8080) }, app.fetch);
}

export function createApp(secrets: { dev: string; prod: string }): Hono {
  return new Hono()
    .post('/auth', createAuthHandler(secrets))
    .post('/commit', commit)
    .post('/tarball', tarball);
}

// Al arrancar y no al atender: sin el secreto el contenedor no debe levantarse,
// porque si el login falla la app no carga.
function requireSecret(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Falta ${name}: /auth no puede canjear el code sin él`);
  }

  return value;
}
