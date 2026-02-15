import { test, expect, clickNote, clickCreateNote } from './fixtures';

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

  test('can create a note from mobile sidebar', async ({ app }) => {
    const noteCountBefore = await app.locator('h5').count();

    await clickCreateNote(app);

    // Should navigate to the new note
    await expect(app).toHaveURL(/\/note\//, { timeout: 5_000 });

    // Navigate back to home to see the sidebar
    await app.goto('/');
    await expect(app.locator('h5')).toHaveCount(noteCountBefore + 1, { timeout: 5_000 });
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
