import { RawGist, RawGistDetails } from '../contracts/RawGist';
import { GistId } from '../contracts/type-aliases';
import { UpdateGistRequest } from '../contracts/UpdateGistRequest';
import { getGithubHeaders } from '../hooks/useGithubAuth';
import { GET, PATCH } from './api';

export const GH_API = 'https://api.github.com';
const url = (path: string) => `${GH_API}${path}`;

export const fetchGists = (page = 1) =>
  GET<RawGist[]>(url(`/gists?per_page=100&page=${page}`), withAuth());

export const fetchGist = (id: GistId) =>
  GET<RawGistDetails>(url(`/gists/${id}`), withAuth());

export const updateGist = (id: GistId, body: UpdateGistRequest) =>
  PATCH<RawGistDetails>(url(`/gists/${id}`), JSON.stringify(body), withAuth());

function withAuth() {
  const headers = getGithubHeaders();
  return { headers };
}
