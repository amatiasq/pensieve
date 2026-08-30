import type { Page } from '@playwright/test';
import { test, expect, clickNote, MockRepo, NOTE_IDS } from './fixtures';

const CAKE = '# recipes/cake.md\n\n## Chocolate Cake\n\n- 200g flour\n- 100g sugar\n- 50g cocoa\n';
const IDEAS = '# ideas.md\n\n- Learn Rust\n- Build a CLI tool\n- Read more books\n';

test.describe('Snapshot', () => {
  test('the copy is named after the folder and today', async ({ app, mockRepo }) => {
    await openGroup(app, 'recipes');
    await snapshotNote(app, 'cake.md');

    const copy = await waitForSnapshot(mockRepo, `# recipes / ${today()}`);
    expect(copy).toBe(`# recipes / ${today()}\n\n## Chocolate Cake\n\n- 200g flour\n- 100g sugar\n- 50g cocoa\n`);
  });

  test('a note without folder gets just the date', async ({ app, mockRepo }) => {
    await snapshotNote(app, 'ideas.md');

    const copy = await waitForSnapshot(mockRepo, `# ${today()}`);
    expect(copy).toBe(`# ${today()}\n\n- Learn Rust\n- Build a CLI tool\n- Read more books\n`);
  });

  test('a note named "folder - name" keeps the prefix', async ({ app, mockRepo }) => {
    await snapshotNote(app, 'travel - japan.md');

    const copy = await waitForSnapshot(mockRepo, `# travel - ${today()}`);
    expect(copy).toBe(`# travel - ${today()}\n\n- Kyoto\n- Osaka\n`);
  });

  test('the copy shows up in the sidebar', async ({ app, mockRepo }) => {
    await openGroup(app, 'recipes');
    await snapshotNote(app, 'cake.md');
    await waitForSnapshot(mockRepo, `# recipes / ${today()}`);

    const group = app.locator('details').filter({ hasText: 'recipes' });
    await expect(group.locator('h5').filter({ hasText: today() })).toBeVisible({ timeout: 5_000 });
  });

  test('the original is left alone and the view stays on it', async ({ app, mockRepo }) => {
    await openGroup(app, 'recipes');
    await clickNote(app, 'cake.md');
    await expect(app).toHaveURL(new RegExp(NOTE_IDS.cake));

    await snapshotNote(app, 'cake.md');
    await waitForSnapshot(mockRepo, `# recipes / ${today()}`);

    await expect(app).toHaveURL(new RegExp(NOTE_IDS.cake));
    expect(mockRepo.getFile(`note/${NOTE_IDS.cake}`)).toBe(CAKE);
    expect(mockRepo.getFile(`note/${NOTE_IDS.ideas}`)).toBe(IDEAS);
  });
});

/** Expand a folder in the sidebar so its notes can be clicked */
async function openGroup(page: Page, group: string) {
  const details = page.locator('details').filter({ hasText: group });

  if ((await details.getAttribute('open')) === null) {
    await details.locator('summary').click();
  }

  await expect(details.locator('h5').first()).toBeVisible({ timeout: 5_000 });
}

/** Open a note's menu in the sidebar and click Snapshot */
async function snapshotNote(page: Page, title: string) {
  const noteItem = page.locator('h5').filter({ hasText: title }).first();
  await noteItem.hover();
  await noteItem.locator('button').last().click();
  await page.locator('[role="menuitem"]').filter({ hasText: 'Snapshot' }).click();
}

/** The committed content of the note whose first line is `firstLine` */
async function waitForSnapshot(repo: MockRepo, firstLine: string) {
  await expect(() => expect(findNote(repo, firstLine)).not.toBeNull()).toPass({ timeout: 10_000 });
  return findNote(repo, firstLine);
}

function findNote(repo: MockRepo, firstLine: string) {
  for (const [path, content] of repo.files) {
    if (path.startsWith('note/') && content.startsWith(`${firstLine}\n`)) {
      return content;
    }
  }

  return null;
}

/** `daystr()` in local time, same as the app */
function today() {
  const now = new Date();
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
