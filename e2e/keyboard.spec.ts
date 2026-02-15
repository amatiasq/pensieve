import { test, expect, clickNote, focusEditor, waitForEditor } from './fixtures';

test.describe('Keyboard shortcuts', () => {
  test('Ctrl+N creates a new note', async ({ app }) => {
    const noteCountBefore = await app.locator('h5').count();

    await app.keyboard.press('Control+n');

    // Should navigate to a new note
    await expect(app).toHaveURL(/\/note\//, { timeout: 5_000 });
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    // Sidebar should have one more note
    await expect(app.locator('h5')).toHaveCount(noteCountBefore + 1, { timeout: 5_000 });
  });

  test('Ctrl+S saves the current note', async ({ app, mockRepo }) => {
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    const commitsBefore = mockRepo.commits.length;

    // Edit content
    await focusEditor(app);
    await app.keyboard.press('End');
    await app.keyboard.type('\n// shortcut save');

    // Save with Ctrl+S
    await app.keyboard.press('Control+s');

    await expect(async () => {
      expect(mockRepo.commits.length).toBeGreaterThan(commitsBefore);
    }).toPass({ timeout: 5_000 });
  });

  test('Ctrl+B toggles sidebar visibility', async ({ app }) => {
    // Open a note first so we're not on the home page
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    const aside = app.locator('aside');
    await expect(aside).toBeVisible();

    // Toggle sidebar off
    await app.keyboard.press('Control+b');

    // Sidebar should be hidden
    await expect(aside).toBeHidden({ timeout: 3_000 });

    // Toggle sidebar back on
    await app.keyboard.press('Control+b');
    await expect(aside).toBeVisible({ timeout: 3_000 });
  });

  test('Ctrl+, navigates to settings', async ({ app }) => {
    await app.keyboard.press('Control+,');
    await expect(app).toHaveURL('/settings', { timeout: 5_000 });
    await expect(app.getByText('Settings', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('Ctrl+, from editor first unfocuses Monaco', async ({ app }) => {
    // Navigate to a note (editor gets focus)
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);
    await focusEditor(app);

    // Press Ctrl+, — the shortcut should reach the app despite Monaco focus
    // because keyboard.ts uses capture phase on document
    await app.keyboard.press('Control+,');
    await expect(app).toHaveURL('/settings', { timeout: 5_000 });
  });
});
