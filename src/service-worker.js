/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */

const OFFLINE_VERSION = 1;
const CACHE_NAME = 'offline';
const OFFLINE_URL = 'offline.html';
const GH_API = 'https://api.github.com';

const MESSAGES = {
  commit: event => event.waitUntil(githubCommit(event.data)),
};

self.addEventListener('install', event => {});
self.addEventListener('activate', event => {});
self.addEventListener('fetch', event => {});

self.addEventListener('message', event => {
  const action = MESSAGES[event.data.type];

  if (typeof action === 'function') {
    action(event);
  }
});

async function githubCommit({ token, owner, repo, branch, files, message }) {
  const items = prepareFilesForRequest(files);

  const ref = await request('GET', `/git/refs/heads/${branch}`);

  // Create tree
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-tree
  const tree = await request('POST', `/git/trees`, {
    tree: items,
    base_tree: ref.object.sha,
  });

  // Create commit
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-commit
  const commit = await request('POST', `/git/commits`, {
    message,
    tree: tree.sha,
    parents: [ref.object.sha],
  });

  // Update a reference
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#update-a-reference
  return request('POST', `/git/refs/heads/${branch}`, {
    sha: commit.sha,
    force: true,
  });

  function request(method, path, body) {
    return fetch(`${GH_API}/repos/${owner}/${repo}/${path}`, {
      method,
      body: JSON.stringify(body),
      headers: { Authorization: `token ${token}` },
    }).then(x => x.json());
  }
}

function prepareFilesForRequest(files) {
  return Object.entries(files)
    .map(([path, content]) => {
      if (content == null) {
        // delete file
        return { path, sha: null };
      }

      if (typeof content === 'string') {
        return { path, content };
      }

      return { path, content: JSON.stringify(content, null, 2) };
    })
    .map(x => Object.assign(x, { mode: '100644', type: 'blob' }));
}
