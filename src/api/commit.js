const axios = require('axios');
const config = import('../config.mjs');
const pipeAxiosToExpress = require('./_proxyAxiosToExpress');

module.exports = async (req, res) => {
  const { token, owner, repo, branch, files, message } = req.body;
  const promise = githubCommit({ token, owner, repo, branch, files, message });
  pipeAxiosToExpress(promise, req, res);
};

async function githubCommit({ token, owner, repo, branch, files, message }) {
  const { GH_API } = await config;

  const request = axios.create({
    baseURL: `${GH_API}/repos/${owner}/${repo}`,
    headers: { Authorization: `token ${token}` },
  });

  const items = prepareFilesForRequest(files);

  const { data: ref } = await request.get(`/git/refs/heads/${branch}`);

  // Create tree
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-tree
  const { data: tree } = await request.post(`/git/trees`, {
    tree: items,
    base_tree: ref.object.sha,
  });

  // Create commit
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#create-a-commit
  const { data: commit } = await request.post(`/git/commits`, {
    message,
    tree: tree.sha,
    parents: [ref.object.sha],
  });

  // Update a reference
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/git#update-a-reference
  return request.post(`/git/refs/heads/${branch}`, {
    sha: commit.sha,
    force: true,
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
