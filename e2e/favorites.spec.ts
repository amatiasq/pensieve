import { test, expect, getVisibleNoteTitles } from './fixtures';

test.describe('Favorites', () => {
  test('favorite notes show filled star icon', async ({ app }) => {
    // hello-world.js is a favorite
    const noteItem = app.locator('h5').filter({ hasText: 'hello-world.js' }).first();

    // Favorite button should have "on" class (filled star)
    const starButton = noteItem.locator('button').first();
    await expect(starButton).toHaveClass(/on/);

    // Button accessible name should be "Remove from favorites"
    await expect(noteItem.getByRole('button', { name: 'Remove from favorites' })).toBeVisible();
  });

  test('non-favorite notes show empty star on hover', async ({ app }) => {
    // ideas.md is not a favorite
    const noteItem = app.locator('h5').filter({ hasText: 'ideas.md' }).first();
    await noteItem.hover();

    // FavoriteButton becomes visible on hover for non-favorites
    const starButton = noteItem.locator('button').first();
    await expect(starButton).toHaveClass(/off/);

    // Button accessible name should be "Add to favorites"
    await expect(noteItem.getByRole('button', { name: 'Add to favorites' })).toBeVisible();
  });

  test('clicking star toggles favorite status', async ({ app }) => {
    // ideas.md starts as non-favorite
    const noteItem = app.locator('h5').filter({ hasText: 'ideas.md' }).first();
    await noteItem.hover();

    const starButton = noteItem.locator('button').first();
    await expect(starButton).toHaveClass(/off/);

    // Click to make favorite
    await starButton.click();

    // Should now be a favorite — note may move in the list (favorites first)
    const updatedItem = app.locator('h5').filter({ hasText: 'ideas.md' }).first();
    await expect(updatedItem).toHaveClass(/favorite/, { timeout: 3_000 });

    // Star icon should show "Remove from favorites"
    await expect(
      updatedItem.getByRole('button', { name: 'Remove from favorites' }),
    ).toBeVisible();
  });

  test('toggling favorite triggers a commit', async ({ app, mockRepo }) => {
    const commitsBefore = mockRepo.commits.length;

    const noteItem = app.locator('h5').filter({ hasText: 'ideas.md' }).first();
    await noteItem.hover();
    await noteItem.locator('button').first().click();

    await expect(async () => {
      expect(mockRepo.commits.length).toBeGreaterThan(commitsBefore);
    }).toPass({ timeout: 5_000 });
  });

  test('favorites are listed before non-favorites', async ({ app }) => {
    const titles = await getVisibleNoteTitles(app);

    // Find indices of known favorites and non-favorites
    const helloIdx = titles.indexOf('hello-world.js'); // favorite
    const ideasIdx = titles.indexOf('ideas.md'); // not favorite

    // favorites should come before non-favorites at root level
    expect(helloIdx).toBeGreaterThanOrEqual(0);
    expect(ideasIdx).toBeGreaterThanOrEqual(0);
    expect(helloIdx).toBeLessThan(ideasIdx);
  });
});
