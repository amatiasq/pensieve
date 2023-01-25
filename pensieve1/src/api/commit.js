import { GH_API } from '../config.json';

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export default async request => {
  const body = await request.json();
  const userAgent = request.headers.get('User-Agent');
  const { token, owner, repo, branch, files, message } = body;

  await githubCommit({
    token,
    owner,
    repo,
    branch,
    files,
    message,
    userAgent,
  });
};

async function githubCommit({
  token,
  owner,
  repo,
  branch,
  files,
  message,
  userAgent,
}) {
  const key = `${owner}/${repo}:${branch}`;
  const baseURL = `${GH_API}/repos/${owner}/${repo}`;
  const headers = { Authorization: `token ${token}`, 'User-Agent': userAgent };

  console.log(`${key} - Commit requests`);

  async function request(method, url, json) {
    const response = await fetch(`${baseURL}${url}`, {
      method,
      headers,
      body: JSON.stringify(json),
    });

    try {
      return await response.json();
    } catch (err) {
      console.log(`[Error from Github] ${await response.text()}`);
      throw err;
    }
  }

  const items = prepareFilesForRequest(files);

  console.log(`${key} - Requesting ref...`);
  const ref = await request('GET', `/git/refs/heads/${branch}`);
  console.log(`${key} - Creating tree...`);

  // Create tree
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-tree
  const tree = await request('POST', `/git/trees`, {
    tree: items,
    base_tree: ref.object.sha,
  });

  console.log(`${key} - Creating commit...`);

  // Create commit
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-commit
  const commit = await request('POST', `/git/commits`, {
    message,
    tree: tree.sha,
    parents: [ref.object.sha],
  });

  console.log(`${key} - Updating branch...`);

  // Update a reference
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#update-a-reference
  return request('POST', `/git/refs/heads/${branch}`, {
    sha: commit.sha,
    force: true,
  }).finally(() => {
    console.log(`${key} - Complete`);
  });
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
