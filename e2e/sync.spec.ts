import { test, expect, clickNote, focusEditor, waitForEditor } from './fixtures';

test.describe('Sync indicator', () => {
  test('shows "Synchronized" after initial load', async ({ app }) => {
    // Wait for notes to load and sync indicator to settle
    await expect(app.locator('[title*="Synchronized"]')).toBeVisible({ timeout: 10_000 });
  });

  test('shows "Offline" when network drops', async ({ app }) => {
    await expect(app.locator('[title*="Synchronized"]')).toBeVisible({ timeout: 10_000 });

    await app.context().setOffline(true);

    await expect(app.locator('[title*="Offline"]')).toBeVisible({ timeout: 5_000 });

    await app.context().setOffline(false);
  });

  test('shows "Changes pending" when saving offline', async ({ app }) => {
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    // Go offline
    await app.context().setOffline(true);

    // Edit and save
    await focusEditor(app);
    await app.keyboard.press('End');
    await app.keyboard.type('\n// offline pending');
    await app.keyboard.press('Control+s');

    // Indicator should show pending state
    await expect(app.locator('[title*="Changes pending"]')).toBeVisible({ timeout: 5_000 });

    await app.context().setOffline(false);
  });

  test('transitions from pending to synchronized after flush', async ({ app, mockRepo }) => {
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    // Wait for any initial auto-save to settle
    await app.waitForTimeout(1000);
    const commitsBefore = mockRepo.commits.length;

    // Go offline, edit, save
    await app.context().setOffline(true);
    await focusEditor(app);
    await app.keyboard.press('End');
    await app.keyboard.type('\n// flush test');
    await app.keyboard.press('Control+s');

    await expect(app.locator('[title*="Changes pending"]')).toBeVisible({ timeout: 5_000 });

    // Come back online — should flush and return to synchronized
    await app.context().setOffline(false);

    await expect(async () => {
      expect(mockRepo.commits.length).toBeGreaterThan(commitsBefore);
    }).toPass({ timeout: 10_000 });

    await expect(app.locator('[title*="Synchronized"]')).toBeVisible({ timeout: 10_000 });
  });

  test('shows "Saving..." during active commit', async ({ app }) => {
    // Intercept commit endpoint with a delay to observe saving state
    await app.route('https://pensieve-api.amatiasq.workers.dev/commit**', async (route) => {
      // Delay response to give us time to observe the indicator
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' });
    });

    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    await focusEditor(app);
    await app.keyboard.press('End');
    await app.keyboard.type('\n// saving test');
    await app.keyboard.press('Control+s');

    // Should briefly show "Saving..."
    await expect(app.locator('[title*="Saving"]')).toBeVisible({ timeout: 5_000 });

    // Should eventually return to "Synchronized"
    await expect(app.locator('[title*="Synchronized"]')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Outbox behavior', () => {
  test('preserves multiple offline writes and flushes all on reconnect', async ({ app, mockRepo }) => {
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    // Go offline
    await app.context().setOffline(true);

    const commitsBefore = mockRepo.commits.length;

    // Make first edit + save
    await focusEditor(app);
    await app.keyboard.press('End');
    await app.keyboard.type('\n// write 1');
    await app.keyboard.press('Control+s');
    await app.waitForTimeout(500);

    // Make second edit + save
    await app.keyboard.press('End');
    await app.keyboard.type('\n// write 2');
    await app.keyboard.press('Control+s');
    await app.waitForTimeout(500);

    // No commits while offline
    expect(mockRepo.commits.length).toBe(commitsBefore);

    // Come back online
    await app.context().setOffline(false);

    // All pending writes should be flushed
    await expect(async () => {
      expect(mockRepo.commits.length).toBeGreaterThan(commitsBefore);
    }).toPass({ timeout: 10_000 });
  });
});
