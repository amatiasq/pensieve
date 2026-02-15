import { test, expect, clickNote, clickCreateNote } from './fixtures';

test.describe('Create & Delete notes', () => {
  test('create note button adds a new note', async ({ app }) => {
    const noteCountBefore = await app.locator('h5').count();

    await clickCreateNote(app);

    // Should navigate to the new note
    await expect(app).toHaveURL(/\/note\//);

    // Monaco editor should be visible
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    // Sidebar should have one more note
    await expect(app.locator('h5')).toHaveCount(noteCountBefore + 1, { timeout: 5_000 });
  });

  test('new note has date-based default title', async ({ app }) => {
    await clickCreateNote(app);
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    // The default content is "{datestr()}.md\n" which becomes the title
    // It should contain the current year
    const year = new Date().getFullYear().toString();
    const noteItem = app.locator('h5').filter({ hasText: new RegExp(`${year}.*\\.md`) });
    await expect(noteItem.first()).toBeVisible({ timeout: 5_000 });
  });

  test('new note is marked as favorite by default', async ({ app }) => {
    await clickCreateNote(app);
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    // Wait for new note to appear in sidebar
    const year = new Date().getFullYear().toString();
    const noteItem = app.locator('h5').filter({ hasText: new RegExp(`${year}.*\\.md`) }).first();
    await expect(noteItem).toBeVisible({ timeout: 5_000 });

    // New notes are favorites (starNewNotes: true in settings)
    // The h5 should have 'favorite' class
    await expect(noteItem).toHaveClass(/favorite/);
  });

  test('new note triggers a commit', async ({ app, mockRepo }) => {
    const commitsBefore = mockRepo.commits.length;

    await clickCreateNote(app);
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    // Creating a note should commit the metadata and content
    await expect(async () => {
      expect(mockRepo.commits.length).toBeGreaterThan(commitsBefore);
      const lastCommit = mockRepo.commits[mockRepo.commits.length - 1];
      expect(lastCommit.message).toContain('Create note');
    }).toPass({ timeout: 5_000 });
  });

  test('delete note removes it from sidebar', async ({ app }) => {
    const noteCountBefore = await app.locator('h5').count();

    // Hover to reveal menu button, then click delete
    const noteItem = app.locator('h5').filter({ hasText: 'ideas.md' }).first();
    await noteItem.hover();

    // Click the menu button (three dots icon — last button in the h5)
    const menuButton = noteItem.locator('button').last();
    await menuButton.click();

    // Click "Remove ideas.md" in the menu
    const removeItem = app.getByText(/Remove ideas\.md/);

    // Handle the confirm dialog
    app.on('dialog', dialog => dialog.accept());
    await removeItem.click();

    // Note should be removed from sidebar
    await expect(app.locator('h5')).toHaveCount(noteCountBefore - 1, { timeout: 5_000 });
    await expect(app.locator('h5').filter({ hasText: 'ideas.md' })).toHaveCount(0);
  });

  test('delete note triggers a commit', async ({ app, mockRepo }) => {
    const commitsBefore = mockRepo.commits.length;

    const noteItem = app.locator('h5').filter({ hasText: 'ideas.md' }).first();
    await noteItem.hover();
    const menuButton = noteItem.locator('button').last();
    await menuButton.click();

    app.on('dialog', dialog => dialog.accept());
    await app.getByText(/Remove ideas\.md/).click();

    await expect(async () => {
      expect(mockRepo.commits.length).toBeGreaterThan(commitsBefore);
      const lastCommit = mockRepo.commits[mockRepo.commits.length - 1];
      expect(lastCommit.message).toContain('Delete');
    }).toPass({ timeout: 5_000 });
  });

  test('delete navigates to root if deleted note was active', async ({ app }) => {
    // First open the note
    await clickNote(app, 'ideas.md');
    await expect(app).toHaveURL(/\/note\//);

    // Then delete it
    const noteItem = app.locator('h5').filter({ hasText: 'ideas.md' }).first();
    await noteItem.hover();
    const menuButton = noteItem.locator('button').last();
    await menuButton.click();

    app.on('dialog', dialog => dialog.accept());
    await app.getByText(/Remove ideas\.md/).click();

    // Should navigate back to root
    await expect(app).toHaveURL('/');
  });
});
