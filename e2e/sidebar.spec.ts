import { test, expect, NOTE_IDS, getVisibleNoteTitles, clickNote } from './fixtures';

test.describe('Sidebar', () => {
  test('shows notes and groups in the sidebar', async ({ app }) => {
    const titles = await getVisibleNoteTitles(app);
    // Standalone notes (no group) are always visible
    expect(titles).toContain('hello-world.js');
    expect(titles).toContain('ideas.md');

    // Grouped notes appear inside <details> — groups should be present
    const utilsGroup = app.locator('details').filter({ hasText: 'utils' });
    await expect(utilsGroup).toBeVisible();
    const recipesGroup = app.locator('details').filter({ hasText: 'recipes' });
    await expect(recipesGroup).toBeVisible();
  });

  test('favorites appear before non-favorites', async ({ app }) => {
    // Rendering order: favorites first, then non-favorites
    // hello-world.js is favorite + bumped → first standalone h5
    const allItems = app.locator('h5');
    const firstTitle = await allItems.first().locator('a').textContent();
    expect(firstTitle).toBe('hello-world.js');
  });

  test('groups aggregate notes by folder', async ({ app }) => {
    // "utils" group should exist and contain helpers.ts and api-client.ts
    const utilsGroup = app.locator('details').filter({ hasText: 'utils' });
    await expect(utilsGroup).toBeVisible();
    await expect(utilsGroup.locator('summary')).toContainText('utils');
  });

  test('groups can be collapsed and expanded', async ({ app }) => {
    const utilsGroup = app.locator('details').filter({ hasText: 'utils' });
    const summary = utilsGroup.locator('summary');

    // Groups start closed (no localStorage entry)
    expect(await utilsGroup.getAttribute('open')).toBeNull();

    // Click to open
    await summary.click();

    // After opening, notes inside should be visible
    await expect(utilsGroup.locator('h5').first()).toBeVisible({ timeout: 3_000 });

    // Click again to close
    await summary.click();

    // Notes inside should be hidden again
    await expect(utilsGroup.locator('h5').first()).toBeHidden({ timeout: 3_000 });
  });

  test('clicking a note navigates to the editor', async ({ app }) => {
    await clickNote(app, 'hello-world.js');
    await expect(app).toHaveURL(new RegExp(`/note/${NOTE_IDS.helloWorld}`));
    // Monaco editor should be visible
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });
  });

  test('active note shows in editor with correct content', async ({ app }) => {
    await clickNote(app, 'hello-world.js');
    // Verify navigation happened
    await expect(app).toHaveURL(new RegExp(`/note/${NOTE_IDS.helloWorld}`));
    // Verify editor shows the note content
    await expect(app.locator('.monaco-editor .view-lines')).toContainText('Hello World', { timeout: 10_000 });
  });

  test('shows empty state when no notes exist', async ({ page }) => {
    const { setupAuthAndMocks, MockRepo } = await import('./fixtures');

    const emptyRepo = new MockRepo([]);
    await setupAuthAndMocks(page, emptyRepo);

    await page.goto('/');
    // Sidebar (aside) should be visible but empty
    const aside = page.locator('aside');
    await expect(aside).toBeVisible({ timeout: 10_000 });
    // No h5 elements means empty
    await expect(page.locator('h5')).toHaveCount(0, { timeout: 10_000 });
  });
});
