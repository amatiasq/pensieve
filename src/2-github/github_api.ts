import { DELETE, GET, PATCH, POST, PUT } from '../1-core/http';
import { messageBus } from '../1-core/messageBus';
import { getGithubHeaders } from './github_auth';
import { RawGistDetails, RawGistItem } from './RawGist';
import { GistId } from './type-aliases';
import { UpdateGistRequest } from './UpdateGistRequest';

export const GH_API = 'https://api.github.com';

export const DEFAULT_FILE_CONTENT = 'Empty!\n';

const DEFAULT_GIST_CONTENT = {
  public: false,
  files: { 'New gist.md': { content: DEFAULT_FILE_CONTENT } },
};

function url(path: string) {
  const result = `${GH_API}${path}`;
  const booster = `p=${Date.now()}`;
  return result.includes('?') ? `${result}&${booster}` : `${result}?${booster}`;
}

// LISTENERS

const [notifyGistListChanged, onGistListchanged] = messageBus('LIST_CHANGED');

const [notifyGistChanged, onGistChanged] = messageBus<RawGistDetails>(
  'GIST_CHANGED',
);

const [notifyGistStarChanged, onGistStarChanged] = messageBus<GistId>(
  'GIST_STAR_CHANGED',
);

export {
  notifyGistChanged,
  onGistListchanged,
  onGistChanged,
  onGistStarChanged,
};

// ENDPOINTS

export const fetchGists = (page = 1) =>
  GET<RawGistItem[]>(url(`/gists?per_page=100&page=${page}`), withAuth());

export const fetchStarredGists = () =>
  GET<RawGistItem[]>(url(`/gists/starred`), withAuth());

export const fetchGist = (id: GistId) =>
  GET<RawGistDetails>(url(`/gists/${id}`), withAuth());

export const removeGist = (id: GistId) =>
  DELETE<unknown>(url(`/gists/${id}`), withAuth()).finally(
    notifyGistListChanged,
  );

export const starGist = (id: GistId) =>
  PUT<void>(url(`/gists/${id}/star`), null, withAuth()).finally(() =>
    notifyGistStarChanged(id),
  );

export const unstarGist = (id: GistId) =>
  DELETE<void>(url(`/gists/${id}/star`), withAuth()).finally(() =>
    notifyGistStarChanged(id),
  );

export const addGileToGist = (id: GistId, name: string, content: string) =>
  updateGist(id, { files: { [name]: { content } } });

export const removeFileFromGist = (id: GistId, name: string) =>
  updateGist(id, { files: { [name]: null } });

export const setFileContent = (id: GistId, filename: string, content: string) =>
  updateGist(id, { files: { [filename]: { content } } });

export const renameGistFile = (id: GistId, oldName: string, newName: string) =>
  updateGist(id, { files: { [oldName]: { filename: newName } } });

export function createGist(body: UpdateGistRequest = {}) {
  return POST<RawGistDetails>(
    url(`/gists`),
    { ...DEFAULT_GIST_CONTENT, ...body },
    withAuth(),
  ).finally(notifyGistListChanged);
}

export async function updateGist(id: GistId, body: UpdateGistRequest) {
  const raw = await PATCH<RawGistDetails>(
    url(`/gists/${id}`),
    JSON.stringify(body),
    withAuth(),
  );

  notifyGistChanged(raw);
  return raw;
}

function withAuth() {
  const headers = getGithubHeaders();
  return { headers };
}
