import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import {
  MockRepo,
  clickNote,
  expect,
  setupAuthAndMocks,
  test,
} from './fixtures';

// El arranque en frío de producción se lee de un tarball, y el resto de los
// mocks lo devuelven roto a propósito para que la suite pase por el listado por
// árbol. Aquí no: esto reproduce lo que hace el navegador de verdad.

const ROOT = 'test-user-pensieve-data-abc1234/';

/** `sha1("blob " + tamaño + "\0" + contenido)`, como hashea git. */
function gitBlobSha(content: string) {
  const body = Buffer.from(content, 'utf8');
  const header = Buffer.from(`blob ${body.length}\0`, 'utf8');
  return createHash('sha1').update(Buffer.concat([header, body])).digest('hex');
}

function tarHeader(path: string, size: number) {
  const block = Buffer.alloc(512);
  block.write(path, 0, 100, 'utf8');
  block.write('0000644\0', 100, 8, 'utf8');
  block.write('0000000\0', 108, 8, 'utf8');
  block.write('0000000\0', 116, 8, 'utf8');
  block.write(size.toString(8).padStart(11, '0') + '\0', 124, 12, 'utf8');
  block.write('00000000000\0', 136, 12, 'utf8');
  block.write('        ', 148, 8, 'utf8'); // checksum a espacios antes de sumar
  block.write('0', 156, 1, 'utf8');
  block.write('ustar\0', 257, 6, 'utf8');
  block.write('00', 263, 2, 'utf8');

  let sum = 0;
  for (const byte of block) sum += byte;
  block.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8');

  return block;
}

/** Una entrada pax `path=…`, que es como git manda las rutas de más de 100 bytes. */
function paxEntry(path: string) {
  const record = (() => {
    let length = 0;
    for (;;) {
      const candidate = `${length} path=${path}\n`;
      const size = Buffer.byteLength(candidate, 'utf8');
      if (size === length) return Buffer.from(candidate, 'utf8');
      length = size;
    }
  })();

  const header = tarHeader('PaxHeaders/pax', record.length);
  header.write('x', 156, 1, 'utf8');
  // El checksum cambia al cambiar el typeflag.
  header.write('        ', 148, 8, 'utf8');
  let sum = 0;
  for (const byte of header) sum += byte;
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8');

  return Buffer.concat([header, pad(record)]);
}

function pad(body: Buffer) {
  const padding = (512 - (body.length % 512)) % 512;
  return padding ? Buffer.concat([body, Buffer.alloc(padding)]) : body;
}

function buildTarball(repo: MockRepo) {
  const blocks: Buffer[] = [];

  for (const [path, content] of repo.files) {
    const full = ROOT + path;
    const body = Buffer.from(content, 'utf8');

    if (Buffer.byteLength(full, 'utf8') > 100) {
      blocks.push(paxEntry(full));
      blocks.push(tarHeader(`${ROOT}filler`, body.length));
    } else {
      blocks.push(tarHeader(full, body.length));
    }

    blocks.push(pad(body));
  }

  blocks.push(Buffer.alloc(1024)); // fin de archivo
  return gzipSync(Buffer.concat(blocks));
}

async function setupTarballMocks(
  page: import('@playwright/test').Page,
  repo: MockRepo,
) {
  await setupAuthAndMocks(page, repo);

  // Registrado después, así que gana: Playwright prueba los handlers del último
  // al primero.
  await page.route('**/tarball**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/gzip',
      body: buildTarball(repo),
    });
  });

  // El árbol tiene que dar los mismos SHA que el tarball, como en GitHub.
  await page.route(
    'https://api.github.com/repos/test-user/pensieve-data/git/trees/**',
    async route => {
      const tree = Array.from(repo.files.entries()).map(([path, content]) => ({
        path,
        mode: '100644',
        type: 'blob',
        sha: gitBlobSha(content),
        size: Buffer.byteLength(content, 'utf8'),
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sha: 'mock-tree-sha', tree, truncated: false }),
      });
    },
  );
}

/** Lo que contesta GitHub cuando la cuenta se quedó sin llamadas por hora. */
async function exhaustRateLimit(page: import('@playwright/test').Page) {
  await page.route(
    'https://api.github.com/repos/test-user/pensieve-data/contents/**',
    route =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        headers: { 'x-ratelimit-remaining': '0' },
        body: '{"message":"API rate limit exceeded"}',
      }),
  );
}

// El repo de verdad tiene miles de notas, y los caminos que se saltan el
// tarball están puestos por número de ficheros: con cinco notas no se pisan.
const BULK_COUNT = 260;

function bulkRepo() {
  return new MockRepo(
    Array.from({ length: BULK_COUNT }, (_, i) => {
      const n = String(i).padStart(4, '0');
      return {
        id: `bbbb${n}-1111-4111-8111-1111111111${n.slice(0, 2)}`,
        title: `note-${n}.md`,
        group: null,
        favorite: false,
        created: `2024-01-01 ${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`,
        modified: '2024-06-01 09:00:00',
        content: `# note-${n}.md\n\ncontenido de la nota ${n}\n`,
      };
    }),
  );
}

async function openAndClick(
  page: import('@playwright/test').Page,
  titles: string[],
) {
  for (const title of titles) {
    await clickNote(page, title);
    const marker = title.replace('note-', 'contenido de la nota ').replace('.md', '');
    await expect(page.locator('.monaco-editor .view-lines')).toContainText(
      marker,
      { timeout: 10_000 },
    );
  }
}

test.describe('Cold start via tarball', () => {
  test('the note list loads from the tarball', async ({ page, mockRepo }) => {
    await setupTarballMocks(page, mockRepo);
    await page.goto('/');

    await expect(page.locator('h5').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('h5')).toHaveCount(6);
  });

  test('clicking a second note loads its content', async ({
    page,
    mockRepo,
  }) => {
    await setupTarballMocks(page, mockRepo);
    await page.goto('/');
    await expect(page.locator('h5').first()).toBeVisible({ timeout: 10_000 });

    await clickNote(page, 'hello-world.js');
    await expect(page.locator('.monaco-editor .view-lines')).toContainText(
      'Hello World',
      { timeout: 10_000 },
    );

    await clickNote(page, 'ideas.md');
    await expect(page.locator('.monaco-editor .view-lines')).toContainText(
      'Learn Rust',
      { timeout: 10_000 },
    );
  });

  test('many notes: several notes in a row load their content', async ({
    page,
  }) => {
    const repo = bulkRepo();
    await setupTarballMocks(page, repo);
    await page.goto('/');
    await expect(page.locator('h5').first()).toBeVisible({ timeout: 15_000 });

    await openAndClick(page, [
      'note-0259.md',
      'note-0258.md',
      'note-0257.md',
      'note-0250.md',
    ]);
  });

  test('many notes: after a reload the notes still load', async ({ page }) => {
    const repo = bulkRepo();
    await setupTarballMocks(page, repo);
    await page.goto('/');
    await expect(page.locator('h5').first()).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page.locator('h5').first()).toBeVisible({ timeout: 15_000 });

    await openAndClick(page, [
      'note-0259.md',
      'note-0258.md',
      'note-0257.md',
    ]);
  });

  // El bug: el tarball baja el contenido de todas las notas, pero cada nota que
  // se abría se pedía otra vez a la API. Con el rate limit agotado la lista
  // seguía saliendo —era del tarball— y el editor abría vacío, sin decir nada:
  // igual que si la nota se hubiera perdido.
  test('with the rate limit spent the notes still open', async ({ page }) => {
    const repo = bulkRepo();
    await setupTarballMocks(page, repo);
    await page.goto('/');
    await expect(page.locator('h5').first()).toBeVisible({ timeout: 15_000 });

    await exhaustRateLimit(page);

    await openAndClick(page, ['note-0259.md', 'note-0258.md', 'note-0257.md']);
  });
});