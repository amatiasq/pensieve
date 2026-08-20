import assert from 'node:assert/strict';
import { commitToGithub } from './commit.ts';

const PARENT = 'parent-commit-sha';
const PARENT_TREE = 'parent-tree-sha';

Deno.test('un árbol idéntico al del padre no crea commit', async () => {
  const calls = stubGithub(PARENT_TREE);

  const result = await commitToGithub(saveRequest(), 'test');

  assert.deepEqual(result, { sha: PARENT, committed: false });
  assert.deepEqual(calls, ['GET /branches/main', 'POST /git/trees']);
});

Deno.test('un árbol distinto crea commit y mueve la rama', async () => {
  const calls = stubGithub('otro-tree-sha');

  const result = await commitToGithub(saveRequest(), 'test');

  assert.deepEqual(result, { sha: 'nuevo-commit-sha', committed: true });
  assert.deepEqual(calls, [
    'GET /branches/main',
    'POST /git/trees',
    'POST /git/commits',
    'POST /git/refs/heads/main',
  ]);
});

function saveRequest() {
  return {
    token: 'token',
    owner: 'amatiasq',
    repo: 'pensieve-data',
    branch: 'main',
    message: 'Update note "hola"',
    files: { 'note/abc': 'hola\n' },
  };
}

// Deja `fetch` contestando lo que contestaría GitHub y devuelve la lista de
// llamadas, que es donde se ve si el commit vacío llegó a crearse.
function stubGithub(treeSha: string) {
  const calls: string[] = [];

  globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
    const { pathname } = new URL(String(input));
    const path = pathname.replace('/repos/amatiasq/pensieve-data', '');
    calls.push(`${init?.method ?? 'GET'} ${path}`);
    return Promise.resolve(Response.json(answerFor(path)));
  };

  return calls;

  function answerFor(path: string) {
    switch (path) {
      case '/branches/main':
        return { commit: { sha: PARENT, commit: { tree: { sha: PARENT_TREE } } } };
      case '/git/trees':
        return { sha: treeSha };
      case '/git/commits':
        return { sha: 'nuevo-commit-sha' };
      default:
        return {};
    }
  }
}
