import { test, expect } from './fixtures';

test.describe('Settings', () => {
  test('navigating to /settings shows the settings editor', async ({ app }) => {
    await app.goto('/settings');

    // Tab bar should be visible with Settings, Shortcuts, etc.
    await expect(app.getByText('Settings', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(app.getByText('Shortcuts', { exact: true })).toBeVisible();
    await expect(app.getByText('Default settings')).toBeVisible();
    await expect(app.getByText('Default shortcuts')).toBeVisible();
  });

  test('settings tab shows JSON in Monaco editor', async ({ app }) => {
    await app.goto('/settings');

    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    // Should contain settings keys
    const viewLines = app.locator('.monaco-editor .view-lines');
    await expect(viewLines).toContainText('autosave');
  });

  test('switching tabs changes editor content', async ({ app }) => {
    await app.goto('/settings');
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    // Click Shortcuts tab (exact match to avoid "Default shortcuts")
    await app.getByText('Shortcuts', { exact: true }).click();

    // Editor should now show shortcuts content
    const viewLines = app.locator('.monaco-editor .view-lines');
    await expect(viewLines).toContainText('save', { timeout: 5_000 });
  });

  test('default settings tab is readonly', async ({ app }) => {
    await app.goto('/settings');
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    // Click "Default settings" tab
    await app.getByText('Default settings').click();
    await expect(app.locator('.monaco-editor .view-lines')).toContainText('autosave', { timeout: 5_000 });
  });

  test('sidebar is still visible on settings page (desktop)', async ({ app }) => {
    await app.goto('/settings');
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    // Sidebar (aside with notes list) should still be visible
    const aside = app.locator('aside');
    await expect(aside).toBeVisible();
  });
});
