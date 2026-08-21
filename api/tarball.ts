import type { Context } from 'hono';
import config from '../src/config.json' with { type: 'json' };

interface TarballRequest {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

// Un tarball es una llamada en vez de una por nota, pero codeload no permite
// el origen del navegador: el redirect se sigue aquí, sin CORS, y el .tar.gz
// llega por el mismo origen. El token viaja en el body, como en /commit:
// nginx no loguea bodies.
export async function tarball(c: Context) {
  const { token, owner, repo, branch } = (await c.req.json()) as TarballRequest;
  const userAgent = c.req.header('User-Agent') ?? 'pensieve';

  const response = await fetch(
    `${config.GH_API}/repos/${owner}/${repo}/tarball/${branch}`,
    { headers: { Authorization: `token ${token}`, 'User-Agent': userAgent } },
  );

  // Sin tarball el cliente cae a pedir fichero a fichero, que es justo lo que
  // revienta el rate limit: que el fallo se vea.
  if (!response.ok) {
    return c.json(
      {
        error: `GitHub tarball ${owner}/${repo}@${branch}: ${response.status}`,
      },
      502,
    );
  }

  // Se pasa el body tal cual, sin bufferearlo: son megas de gzip.
  return new Response(response.body, {
    headers: {
      'Content-Type': 'application/gzip',
      'Cache-Control': 'no-store',
    },
  });
}
