import { test as base, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

export const NOTE_IDS = {
  helloWorld: 'aaa11111-1111-4111-8111-111111111111',
  helpers: 'bbb22222-2222-4222-8222-222222222222',
  apiClient: 'ccc33333-3333-4333-8333-333333333333',
  ideas: 'ddd44444-4444-4444-8444-444444444444',
  cake: 'eee55555-5555-4555-8555-555555555555',
} as const;

interface TestNote {
  id: string;
  title: string;
  group: string | null;
  favorite: boolean;
  created: string;
  modified: string;
  bumped?: string;
  content: string;
}

export const TEST_NOTES: TestNote[] = [
  {
    id: NOTE_IDS.helloWorld,
    title: 'hello-world.js',
    group: null,
    favorite: true,
    created: '2024-01-15 10:00:00',
    modified: '2024-06-01 09:00:00',
    bumped: '2024-06-01 09:00:00',
    content: '// hello-world.js\nconsole.log("Hello World");\n',
  },
  {
    id: NOTE_IDS.helpers,
    title: 'helpers.ts',
    group: 'utils',
    favorite: false,
    created: '2024-02-10 14:00:00',
    modified: '2024-02-10 14:00:00',
    content: '// utils/helpers.ts\nexport function add(a: number, b: number) {\n  return a + b;\n}\n',
  },
  {
    id: NOTE_IDS.apiClient,
    title: 'api-client.ts',
    group: 'utils',
    favorite: true,
    created: '2024-03-05 08:30:00',
    modified: '2024-03-05 08:30:00',
    content: '// utils/api-client.ts\nexport async function fetchData(url: string) {\n  return fetch(url).then(r => r.json());\n}\n',
  },
  {
    id: NOTE_IDS.ideas,
    title: 'ideas.md',
    group: null,
    favorite: false,
    created: '2024-04-20 16:00:00',
    modified: '2024-04-20 16:00:00',
    content: '# ideas.md\n\n- Learn Rust\n- Build a CLI tool\n- Read more books\n',
  },
  {
    id: NOTE_IDS.cake,
    title: 'cake.md',
    group: 'recipes',
    favorite: false,
    created: '2024-05-01 11:00:00',
    modified: '2024-05-01 11:00:00',
    content: '# recipes/cake.md\n\n## Chocolate Cake\n\n- 200g flour\n- 100g sugar\n- 50g cocoa\n',
  },
];

const FAKE_TOKEN = 'ghp_test_e2e_fake_token_000000000000';
const FAKE_USER = 'test-user';
const FAKE_REPO = 'pensieve-data';

const DEFAULT_SETTINGS = {
  autosave: 5,
  reloadIfAwayForSeconds: 5,
  renderIndentGuides: false,
  rulers: [],
  sidebarVisible: true,
  sidebarWidth: 400,
  starNewNotes: true,
  tabSize: 2,
  wordWrap: true,
  highlight: { '~~[^~]*~~': '#505050', '@(\\w|-)+': '#6fb9ef' },
  links: { '\\[(\\w+/\\w+)]': 'https://github.com/$1' },
  folders: { Snippets: {} },
};

const DEFAULT_SHORTCUTS = {
  'CTRL+TAB': 'goBack',
  'CTRL+SHIFT+TAB': 'goForward',
  'ALT+N': 'toggleWordWrap',
  'CMD+S': 'save',
  'CMD+,': 'settings',
  'CMD+B': 'hideSidebar',
  'CMD+W': 'goHome',
  'CMD+N': 'newNote',
  'CMD+SHIFT+E': 'clearFilter',
  'CTRL+S': 'save',
  'CTRl+,': 'settings',
  'CTRL+B': 'hideSidebar',
  'CTRL+W': 'goHome',
  'CTRL+N': 'newNote',
};

// ---------------------------------------------------------------------------
// In-memory mock repo
// ---------------------------------------------------------------------------

export class MockRepo {
  readonly files = new Map<string, string>();
  readonly commits: Array<{ message: string; files: Record<string, string | null> }> = [];

  constructor(notes: TestNote[] = TEST_NOTES) {
    for (const note of notes) {
      const meta = { ...note, content: undefined };
      delete (meta as any).content;
      this.files.set(`meta/${note.id}.json`, JSON.stringify(meta, null, 2));
      this.files.set(`note/${note.id}`, note.content);
    }
    this.files.set('settings.json', JSON.stringify(DEFAULT_SETTINGS, null, 2));
    this.files.set('shortcuts.json', JSON.stringify(DEFAULT_SHORTCUTS, null, 2));
  }

  /** GraphQL-style directory listing (legacy, used by readFileCool fallback) */
  getDir(prefix: string): Array<{ path: string; object: { text: string } }> {
    const entries: Array<{ path: string; object: { text: string } }> = [];
    for (const [key, value] of this.files) {
      if (key.startsWith(prefix)) {
        entries.push({ path: key, object: { text: value } });
      }
    }
    return entries;
  }

  /** Git Trees API-style listing (all files in repo with SHAs) */
  getTree(): Array<{ path: string; mode: string; type: string; sha: string; size: number }> {
    const entries: Array<{ path: string; mode: string; type: string; sha: string; size: number }> = [];
    for (const [key, value] of this.files) {
      entries.push({
        path: key,
        mode: '100644',
        type: 'blob',
        sha: simpleHash(value),
        size: value.length,
      });
    }
    return entries;
  }

  getFile(path: string): string | null {
    return this.files.get(path) ?? null;
  }

  applyCommit(message: string, files: Record<string, string | null>) {
    this.commits.push({ message, files });
    for (const [path, content] of Object.entries(files)) {
      if (content === null) {
        this.files.delete(path);
      } else {
        this.files.set(path, content);
      }
    }
  }
}

/** Deterministic hash for mock SHAs */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// Route mocking
// ---------------------------------------------------------------------------

async function setupMocks(page: Page, repo: MockRepo) {
  // GitHub GraphQL API — used by readDir (list files in a tree)
  await page.route('https://api.github.com/graphql**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const expression: string = body.variables?.path || '';
    // expression looks like "main:meta/" — extract the prefix after ":"
    const prefix = expression.split(':')[1] || '';
    const entries = repo.getDir(prefix);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          repository: {
            files: { entries },
            file: entries[0] ? { text: entries[0].object.text } : null,
          },
        },
      }),
    });
  });

  // GitHub REST API — repo existence check
  await page.route(
    `https://api.github.com/repos/${FAKE_USER}/${FAKE_REPO}`,
    async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ name: FAKE_REPO, full_name: `${FAKE_USER}/${FAKE_REPO}` }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    },
  );

  // GitHub REST API — tarball (cold-start optimization, not needed in E2E)
  await page.route(
    `https://api.github.com/repos/${FAKE_USER}/${FAKE_REPO}/tarball/**`,
    async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"Not Found"}' });
    },
  );

  // GitHub REST API — Git Trees API (used by readDir for file listing)
  await page.route(
    `https://api.github.com/repos/${FAKE_USER}/${FAKE_REPO}/git/trees/**`,
    async (route) => {
      const tree = repo.getTree();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sha: 'mock-tree-sha', tree, truncated: false }),
      });
    },
  );

  // GitHub REST API — individual file read (raw content)
  await page.route(
    `https://api.github.com/repos/${FAKE_USER}/${FAKE_REPO}/contents/**`,
    async (route) => {
      const url = new URL(route.request().url());
      const fullPath = url.pathname.replace(
        `/repos/${FAKE_USER}/${FAKE_REPO}/contents/`,
        '',
      );

      const content = repo.getFile(fullPath);

      if (content !== null) {
        await route.fulfill({
          status: 200,
          contentType: 'text/plain',
          body: content,
        });
      } else {
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"Not Found"}' });
      }
    },
  );

  // GitHub REST API — create repo
  await page.route('https://api.github.com/user/repos**', async (route) => {
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
  });

  // Cloudflare Worker — commit endpoint
  await page.route('https://pensieve-api.amatiasq.workers.dev/commit**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    repo.applyCommit(body.message || '', body.files || {});
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' });
  });

  // Cloudflare Worker — auth endpoint
  await page.route('https://pensieve-api.amatiasq.workers.dev/auth**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'access_token=fake' });
  });
}

// ---------------------------------------------------------------------------
// Setup mocks on a bare page (for tests that manage their own lifecycle)
// ---------------------------------------------------------------------------

export async function setupAuthAndMocks(page: Page, repo: MockRepo) {
  await page.addInitScript(
    ({ token, user }) => {
      const wrap = (data: unknown) =>
        JSON.stringify({ data, version: 1, updated: Date.now() });
      localStorage.setItem('notes.gh-token', wrap(token));
      localStorage.setItem('notes.gh-user', wrap(user));
    },
    { token: FAKE_TOKEN, user: FAKE_USER },
  );
  await setupMocks(page, repo);
}

// ---------------------------------------------------------------------------
// Custom test fixture
// ---------------------------------------------------------------------------

interface TestFixtures {
  app: Page;
  mockRepo: MockRepo;
}

export const test = base.extend<TestFixtures>({
  mockRepo: async ({}, use) => {
    await use(new MockRepo());
  },

  app: async ({ page, mockRepo }, use) => {
    await setupAuthAndMocks(page, mockRepo);

    // Navigate to the app
    await page.goto('/');

    // Wait for notes to load (sidebar shows h5 elements)
    await expect(page.locator('h5').first()).toBeVisible({ timeout: 10_000 });

    await use(page);
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Click the "Create note" button in the sidebar header */
export async function clickCreateNote(page: Page) {
  await page.getByRole('button', { name: 'Create note' }).click();
}

/** Click a note by its title in the sidebar */
export async function clickNote(page: Page, title: string) {
  await page.getByRole('link', { name: title }).first().click();
}

/** Focus the Monaco editor and type text */
export async function focusEditor(page: Page) {
  // Click on the editor container to focus Monaco
  await page.locator('.monaco-editor').first().click();
}

/** Wait for Monaco editor to be ready and return view-lines locator */
export async function waitForEditor(page: Page) {
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10_000 });
  // Wait for content to render
  await expect(page.locator('.monaco-editor .view-lines')).toBeVisible();
  return page.locator('.monaco-editor .view-lines');
}

/** Get all visible note titles from the sidebar (only visible h5 > a) */
export async function getVisibleNoteTitles(page: Page): Promise<string[]> {
  const links = page.locator('h5:visible a');
  return links.allTextContents();
}
