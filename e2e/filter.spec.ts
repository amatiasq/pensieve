import { test, expect, getVisibleNoteTitles } from './fixtures';

test.describe('Filter', () => {
  test('filter input is visible in sidebar header', async ({ app }) => {
    const filterInput = app.getByPlaceholder('Filter...');
    await expect(filterInput).toBeVisible();
  });

  test('typing in filter narrows the note list', async ({ app }) => {
    const noteCountBefore = await app.locator('h5').count();

    const filterInput = app.getByPlaceholder('Filter...');
    await filterInput.fill('hello');

    // Should show fewer notes (only matching ones)
    await expect(async () => {
      const count = await app.locator('h5').count();
      expect(count).toBeLessThan(noteCountBefore);
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 3_000 });

    const titles = await getVisibleNoteTitles(app);
    expect(titles).toContain('hello-world.js');
  });

  test('filter matches group names', async ({ app }) => {
    const filterInput = app.getByPlaceholder('Filter...');
    await filterInput.fill('utils');

    // After filtering by "utils", the utils group should be visible
    // Notes inside may be in a closed group, so check all h5 links (including hidden)
    await expect(async () => {
      const allTitles = await app.locator('h5 a').allTextContents();
      const hasUtilsNote = allTitles.some(t => t === 'helpers.ts' || t === 'api-client.ts');
      expect(hasUtilsNote).toBeTruthy();
    }).toPass({ timeout: 3_000 });
  });

  test('clearing filter shows all notes again', async ({ app }) => {
    const noteCountBefore = await app.locator('h5').count();

    const filterInput = app.getByPlaceholder('Filter...');
    await filterInput.fill('hello');

    // Wait for filter to apply
    await expect(async () => {
      expect(await app.locator('h5').count()).toBeLessThan(noteCountBefore);
    }).toPass({ timeout: 3_000 });

    // Clear filter
    await filterInput.fill('');

    // All notes should be back
    await expect(app.locator('h5')).toHaveCount(noteCountBefore, { timeout: 3_000 });
  });

  test('clear button removes filter text', async ({ app }) => {
    const filterInput = app.getByPlaceholder('Filter...');
    await filterInput.fill('hello');

    // The clear button (X icon) should appear
    const clearButton = app.getByRole('button', { name: 'Clear filter' });
    await expect(clearButton).toBeVisible({ timeout: 3_000 });

    await clearButton.click();

    // Filter input should be empty
    await expect(filterInput).toHaveValue('');
  });

  test('filter with no matches shows empty state', async ({ app }) => {
    const filterInput = app.getByPlaceholder('Filter...');
    await filterInput.fill('xyznonexistent');

    // No notes should match
    await expect(app.locator('h5')).toHaveCount(0, { timeout: 3_000 });
  });
});
