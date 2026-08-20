import type { Context } from 'hono';
import config from '../src/config.json' with { type: 'json' };

type StagedFiles = Record<string, string | Record<string, unknown> | null>;

interface CommitRequest {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: StagedFiles;
}

// `committed: false` es «el árbol ya estaba así», no un fallo: un fallo es un 500.
export interface CommitResult {
  sha: string;
  committed: boolean;
}

// La punta de la rama en una llamada: el commit y el sha de su árbol, que es
// con lo que se compara el árbol nuevo. `/git/refs` sólo traía el commit.
interface BranchHead {
  commit: { sha: string; commit: { tree: { sha: string } } };
}

// El token de GitHub del usuario viaja en el body, así que aquí no se loguea
// nada de la petición: ni el body, ni a qué repo commitea.
export async function commit(c: Context) {
  const request = (await c.req.json()) as CommitRequest;
  const userAgent = c.req.header('User-Agent') ?? 'pensieve';

  return c.json(await commitToGithub(request, userAgent));
}

// Un commit son cuatro llamadas a la API de git de GitHub: leer la rama, crear
// el árbol sobre ella, crear el commit y mover la rama.
// https://docs.github.com/en/rest/git
export async function commitToGithub(
  { token, owner, repo, branch, files, message }: CommitRequest,
  userAgent: string,
): Promise<CommitResult> {
  const baseUrl = `${config.GH_API}/repos/${owner}/${repo}`;
  const headers = { Authorization: `token ${token}`, 'User-Agent': userAgent };

  async function send<T>(method: string, path: string, json?: unknown) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: json == null ? undefined : JSON.stringify(json),
    });

    const body = await response.text();

    // El worker de Cloudflare se comía los fallos de GitHub y contestaba 200,
    // así que un guardado que no se guardaba parecía guardado. Ahora falla, y
    // el outbox lo reintenta.
    if (!response.ok) {
      throw new Error(`GitHub ${method} ${path}: ${response.status} ${body}`);
    }

    return JSON.parse(body) as T;
  }

  const head = await send<BranchHead>('GET', `/branches/${branch}`);
  const parent = head.commit.sha;

  const tree = await send<{ sha: string }>('POST', '/git/trees', {
    tree: toTreeItems(files),
    base_tree: parent,
  });

  // Guardar una nota sin haberla tocado manda el mismo contenido, así que el
  // árbol sale idéntico al del padre y GitHub aceptaría un commit vacío.
  if (tree.sha === head.commit.commit.tree.sha) {
    return { sha: parent, committed: false };
  }

  const created = await send<{ sha: string }>('POST', '/git/commits', {
    message,
    tree: tree.sha,
    parents: [parent],
  });

  await send('POST', `/git/refs/heads/${branch}`, {
    sha: created.sha,
    force: true,
  });

  return { sha: created.sha, committed: true };
}

function toTreeItems(files: StagedFiles) {
  return Object.entries(files).map(([path, content]) => ({
    path,
    mode: '100644',
    type: 'blob',
    // Sin contenido se borra el fichero; lo que no es texto se guarda como JSON.
    ...(content == null
      ? { sha: null }
      : {
          content:
            typeof content === 'string'
              ? content
              : JSON.stringify(content, null, 2),
        }),
  }));
}
