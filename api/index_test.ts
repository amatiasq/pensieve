import assert from 'node:assert/strict';
import { createApp } from './index.ts';

const app = createApp({ dev: 'dev', prod: 'prod' });

for (const route of ['/commit', '/tarball']) {
  Deno.test(`${route} sin token contesta 401`, async () => {
    githubRejectsEveryToken();

    const response = await app.request(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner: 'amatiasq', repo: 'pensieve-data', branch: 'main', files: {} }),
    });

    assert.equal(response.status, 401);
  });
}

// Lo que GitHub contesta a una petición sin token válido.
function githubRejectsEveryToken() {
  globalThis.fetch = () =>
    Promise.resolve(Response.json({ message: 'Bad credentials' }, { status: 401 }));
}
