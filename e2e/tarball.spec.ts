import {
  bulkRepo,
  exhaustRateLimit,
  setupTarballMocks,
} from './tarball-mock';
import type { Page } from '@playwright/test';
import { clickNote, expect, test } from './fixtures';

async function openAndClick(
  page: Page,
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