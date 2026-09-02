import { test, expect, clickNote, clickCreateNote } from './fixtures';
import { bulkRepo, setupTarballMocks } from './tarball-mock';

test.describe('Mobile layout', () => {
  test('shows sidebar on home page', async ({ app }) => {
    // On mobile, the home page shows the sidebar (list only, no editor)
    const aside = app.locator('aside');
    await expect(aside).toBeVisible();

    // Notes should be visible
    await expect(app.locator('h5').first()).toBeVisible();
  });

  test('clicking a note shows the content', async ({ app }) => {
    await clickNote(app, 'hello-world.js');

    // On mobile, clicking a note navigates to the editor view
    await expect(app).toHaveURL(/\/note\//);

    // MobileFallback renders as <pre><code> in preview mode
    // Wait for content to appear (either Monaco, textarea, or code preview)
    await expect(
      app.locator('.monaco-editor').or(app.locator('textarea')).or(app.locator('pre code')).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // El layout de móvil vive entero en la clase `page-*` del contenedor: cada
  // página tiene su propio `grid-template-areas`. Si la clase no sigue a la URL
  // se ve el header de la sidebar encima de la nota, y al volver atrás una
  // pantalla en blanco.
  test('layout follows navigation without a reload', async ({ app }) => {
    await expect(app.locator('div.page-home')).toBeAttached();

    await clickNote(app, 'hello-world.js');

    await expect(app).toHaveURL(/\/note\//);
    await expect(app.locator('div.page-note')).toBeAttached();
    await expect(app.locator('div.page-home')).toHaveCount(0);

    await app.goBack();

    await expect(app).toHaveURL(/\/$/);
    await expect(app.locator('div.page-home')).toBeAttached();
    await expect(app.locator('div.page-note')).toHaveCount(0);
    await expect(app.locator('h5').first()).toBeVisible();
  });

  test('can create a note from mobile sidebar', async ({ app, mockRepo }) => {
    const noteCountBefore = await app.locator('h5').count();
    const commitsBefore = mockRepo.commits.length;

    await clickCreateNote(app);

    // Should navigate to the new note
    await expect(app).toHaveURL(/\/note\//, { timeout: 5_000 });

    // La recarga lee la lista del repo, y lo remoto gana: sin esperar al commit
    // la nota nueva todavía no está allí y la lista vuelve con las de antes.
    await expect(async () => {
      expect(mockRepo.commits.length).toBeGreaterThan(commitsBefore);
    }).toPass({ timeout: 5_000 });

    // Navigate back to home to see the sidebar
    await app.goto('/');
    await expect(app.locator('h5')).toHaveCount(noteCountBefore + 1, { timeout: 5_000 });
  });

  // El bug que se veía en el móvil: sin red, una nota que nunca se abrió tiene
  // su contenido donde lo dejó el tarball, pero la capa de offline rechazaba la
  // lectura antes de llegar a ese disco. La nota estaba guardada y la app no la
  // pintaba. La causa es estar sin red, no el móvil — en escritorio no se ve
  // porque allí nunca se está sin red.
  test('sin red se abre una nota que sólo bajó el tarball', async ({ page }) => {
    const repo = bulkRepo();
    await setupTarballMocks(page, repo);
    await page.goto('/');
    await expect(page.locator('h5').first()).toBeVisible({ timeout: 15_000 });

    // En escritorio el editor es Monaco y se baja del CDN: sin abrirlo antes,
    // sin red no habría editor que enseñara nada. En móvil es un `<pre>`.
    const editor = page.locator('.monaco-editor .view-lines, pre code');
    await clickNote(page, 'note-0258.md');
    await expect(editor).toContainText('contenido de la nota 0258', {
      timeout: 15_000,
    });
    await page.goBack();
    await expect(page.locator('h5').first()).toBeVisible({ timeout: 10_000 });

    await page.context().setOffline(true);

    // La precarga va de la más vieja a la más nueva y ésta es la última, así
    // que a local no ha llegado: sólo la tiene la caché del tarball.
    await clickNote(page, 'note-0259.md');
    await expect(editor).toContainText('contenido de la nota 0259', {
      timeout: 10_000,
    });

    await page.context().setOffline(false);
  });

  test('filter works on mobile', async ({ app }) => {
    const filterInput = app.getByPlaceholder('Filter...');
    await expect(filterInput).toBeVisible();

    await filterInput.fill('hello');

    await expect(async () => {
      const titles = await app.locator('h5 a').allTextContents();
      expect(titles).toContain('hello-world.js');
      expect(titles.length).toBeLessThan(5);
    }).toPass({ timeout: 3_000 });
  });

  test('groups are visible and interactive on mobile', async ({ app }) => {
    const group = app.locator('details').filter({ hasText: 'utils' });
    await expect(group).toBeVisible();

    // Toggle group
    const summary = group.locator('summary');
    await summary.click();
    await summary.click();
    // Should not crash
    await expect(group).toBeVisible();
  });
});
