import type { Page } from '@playwright/test';
import {
  MockRepo,
  NOTE_IDS,
  clickNote,
  expect,
  setupAuthAndMocks,
  test,
  waitForEditor,
} from './fixtures';

// Sin precarga sólo se lee sin red lo que se abrió alguna vez, así que las
// notas viejas no están cuando hacen falta. Estos tests miran las peticiones de
// contenido —`/contents/note/…`— porque son las que gasta la precarga.

/** Las notas de prueba, de la más reciente a la más vieja. */
const NEWEST_FIRST = [
  NOTE_IDS.helloWorld,
  NOTE_IDS.cake,
  NOTE_IDS.ideas,
  NOTE_IDS.apiClient,
  NOTE_IDS.helpers,
  NOTE_IDS.japan,
];

/** El log de contenidos pedidos a GitHub, en orden. */
function watchContentRequests(page: Page) {
  const requested: string[] = [];

  page.on('request', request => {
    const match = /\/contents\/note\/([^/?]+)/.exec(request.url());
    if (match) requested.push(match[1]);
  });

  return requested;
}

async function loadApp(page: Page, repo: MockRepo) {
  await setupAuthAndMocks(page, repo);
  await page.goto('/');
  await expect(page.locator('h5').first()).toBeVisible({ timeout: 10_000 });
}

test.describe('Precarga offline', () => {
  test('una nota que nunca se abrió se lee sin red', async ({
    page,
    mockRepo,
  }) => {
    const requested = watchContentRequests(page);
    await loadApp(page, mockRepo);

    // El rato de uso: Monaco se baja del CDN y en dev no hay service worker que
    // lo guarde, así que sin abrir una nota antes no hay editor que enseñe nada.
    await clickNote(page, 'hello-world.js');
    await waitForEditor(page);

    // Una por segundo, e `ideas.md` es la tercera de la cola. Va sin carpeta
    // porque las carpetas de la barra lateral abren cerradas.
    await expect(() =>
      expect(requested).toContain(NOTE_IDS.ideas),
    ).toPass({ timeout: 20_000 });

    await page.context().setOffline(true);

    // Ésta no se ha abierto en toda la sesión: lo único que la trajo es la cola.
    await clickNote(page, 'ideas.md');
    await expect(page.locator('.monaco-editor .view-lines')).toContainText(
      'Learn Rust',
      { timeout: 10_000 },
    );

    await page.context().setOffline(false);
  });

  test('la cola va de la más reciente a la más vieja', async ({
    page,
    mockRepo,
  }) => {
    const requested = watchContentRequests(page);
    await loadApp(page, mockRepo);

    await expect(() =>
      expect(requested).toHaveLength(NEWEST_FIRST.length),
    ).toPass({ timeout: 20_000 });

    expect(requested).toEqual(NEWEST_FIRST);
  });

  test('lo que ya está en local no se vuelve a pedir', async ({
    page,
    mockRepo,
  }) => {
    const requested = watchContentRequests(page);
    await loadApp(page, mockRepo);

    await expect(() =>
      expect(requested).toHaveLength(NEWEST_FIRST.length),
    ).toPass({ timeout: 20_000 });

    // Tres turnos más de cola: si la precarga no mirara lo local, aquí habría
    // más peticiones de las mismas notas.
    await page.waitForTimeout(3_000);
    expect(requested).toHaveLength(NEWEST_FIRST.length);
  });
});
