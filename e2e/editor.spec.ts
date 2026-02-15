import { test, expect, clickNote, focusEditor, waitForEditor } from './fixtures';

test.describe('Editor', () => {
  test('opens note content in Monaco editor', async ({ app }) => {
    await clickNote(app, 'hello-world.js');

    const editor = app.locator('.monaco-editor');
    await expect(editor).toBeVisible({ timeout: 10_000 });

    // The editor should contain the note content
    const viewLines = app.locator('.monaco-editor .view-lines');
    await expect(viewLines).toContainText('Hello World');
  });

  test('detects language from file extension', async ({ app }) => {
    await clickNote(app, 'hello-world.js');
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    // The editor should have loaded and rendered content
    const viewLines = app.locator('.monaco-editor .view-lines');
    await expect(viewLines).toBeVisible();
  });

  test('markdown notes use markdown language', async ({ app }) => {
    await clickNote(app, 'ideas.md');
    await expect(app.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });

    const viewLines = app.locator('.monaco-editor .view-lines');
    await expect(viewLines).toContainText('Learn Rust');
  });

  test('editing updates the editor content', async ({ app }) => {
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    // Focus and type
    await focusEditor(app);
    await app.keyboard.press('End');
    await app.keyboard.type('\n// new line added');

    const viewLines = app.locator('.monaco-editor .view-lines');
    await expect(viewLines).toContainText('new line added');
  });

  test('Ctrl+S triggers save (commits to mock)', async ({ app, mockRepo }) => {
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    const commitsBefore = mockRepo.commits.length;

    // Edit the content
    await focusEditor(app);
    await app.keyboard.press('End');
    await app.keyboard.type('\n// saved line');

    // Trigger manual save
    await app.keyboard.press('ControlOrMeta+s');

    // Wait for the commit to be recorded
    await expect(async () => {
      expect(mockRepo.commits.length).toBeGreaterThan(commitsBefore);
    }).toPass({ timeout: 5_000 });
  });

  test('auto-save triggers after inactivity', async ({ app, mockRepo }) => {
    await clickNote(app, 'hello-world.js');
    await waitForEditor(app);

    const commitsBefore = mockRepo.commits.length;

    // Edit the content
    await focusEditor(app);
    await app.keyboard.press('End');
    await app.keyboard.type('\n// auto-saved');

    // Wait for auto-save (configured at 5 seconds)
    await expect(async () => {
      expect(mockRepo.commits.length).toBeGreaterThan(commitsBefore);
    }).toPass({ timeout: 10_000 });
  });

  test('editing title updates sidebar in real-time', async ({ app }) => {
    await clickNote(app, 'ideas.md');
    await waitForEditor(app);

    // Select all and replace content
    await focusEditor(app);
    await app.keyboard.press('ControlOrMeta+a');
    await app.keyboard.type('# new-title.md\n\nNew content here');

    // The sidebar should reflect the draft title
    await expect(
      app.locator('h5').filter({ hasText: 'new-title.md' }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('navigating to another note loads its content', async ({ app }) => {
    // Open first note
    await clickNote(app, 'hello-world.js');
    await expect(app.locator('.monaco-editor .view-lines')).toContainText('Hello World', { timeout: 10_000 });

    // Navigate to second note
    await clickNote(app, 'ideas.md');
    await expect(app.locator('.monaco-editor .view-lines')).toContainText('Learn Rust', { timeout: 10_000 });
  });
});
