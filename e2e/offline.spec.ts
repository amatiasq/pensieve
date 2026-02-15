import { test, expect, clickNote, clickCreateNote, focusEditor, waitForEditor } from './fixtures';

test.describe('Offline behavior', () => {
  // Note: the app doesn't have a service worker yet, so it can't load from scratch
  // when offline. These tests verify behavior when going offline AFTER initial load.

  test('editing offline does not crash the app', async ({ app }) => {
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    // Go offline
    await app.context().setOffline(true);

    // Edit content
    await focusEditor(app);
    await app.keyboard.press('End');
    await app.keyboard.type('\n// offline edit');

    // The app should not crash — content should show the edit
    const viewLines = app.locator('.monaco-editor .view-lines');
    await expect(viewLines).toContainText('offline edit');

    // Try saving — should not throw visible errors
    await app.keyboard.press('Control+s');

    // Wait a moment for any potential error handling
    await app.waitForTimeout(1000);

    // App should still be functional
    await expect(viewLines).toContainText('offline edit');

    // Restore online
    await app.context().setOffline(false);
  });

  test('creating a note offline adds it to the sidebar', async ({ app }) => {
    // Go offline
    await app.context().setOffline(true);

    const noteCountBefore = await app.locator('h5').count();

    // Create a note
    await clickCreateNote(app);

    // Should navigate to a new note
    await expect(app).toHaveURL(/\/note\//, { timeout: 5_000 });

    // Sidebar is visible on desktop — new note should appear
    await expect(app.locator('h5')).toHaveCount(noteCountBefore + 1, { timeout: 5_000 });

    // Restore online
    await app.context().setOffline(false);
  });

  test('pending writes are flushed when coming back online', async ({ app, mockRepo }) => {
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    // Go offline
    await app.context().setOffline(true);

    const commitsBefore = mockRepo.commits.length;

    // Edit and save
    await focusEditor(app);
    await app.keyboard.press('End');
    await app.keyboard.type('\n// pending write');
    await app.keyboard.press('Control+s');

    // No commit should happen while offline
    await app.waitForTimeout(1000);
    expect(mockRepo.commits.length).toBe(commitsBefore);

    // Come back online
    await app.context().setOffline(false);

    // The pending write should eventually be committed
    // (ResilientOnlineStore flushes on 'online' event)
    await expect(async () => {
      expect(mockRepo.commits.length).toBeGreaterThan(commitsBefore);
    }).toPass({ timeout: 10_000 });
  });

  test('navigating between notes works offline', async ({ app }) => {
    // Load both notes into cache first
    await clickNote(app, 'hello-world.js');
    await expect(app.locator('.monaco-editor .view-lines')).toContainText('Hello World', { timeout: 10_000 });

    await clickNote(app, 'ideas.md');
    await expect(app.locator('.monaco-editor .view-lines')).toContainText('Learn Rust', { timeout: 10_000 });

    // Go offline
    await app.context().setOffline(true);

    // Navigate back to first note — should work from cache
    await clickNote(app, 'hello-world.js');
    await expect(app.locator('.monaco-editor .view-lines')).toContainText('Hello World', { timeout: 10_000 });

    // And back to second
    await clickNote(app, 'ideas.md');
    await expect(app.locator('.monaco-editor .view-lines')).toContainText('Learn Rust', { timeout: 10_000 });

    // Restore online
    await app.context().setOffline(false);
  });
});
