import { GistId, UserName } from './../contracts/type-aliases';
import { Gist } from '../contracts/Gist';
import { GistDetails } from '../contracts/GistDetails';

const GH_USER = 'amatiasq';
const GH_TOKEN = '472722b21a619ff5965bf1a68c55d704f567e557';

const API_ROOT = `https://api.github.com`;
const url = (path: string) => `${API_ROOT}${path}`;

const request = <T>(path: string, extras?: any) =>
  fetch(url(path), { ...(extras || {}) }).then(x => x.json() as Promise<T>);

const GET = <T>(path: string, options?: any) => request<T>(path, options);
const POST = <T>(path: string, body: string) => request<T>(path, { body });

export const createGist = (content: string) => POST('/gists', content);
export const getGist = (id: GistId) => GET<GistDetails>(`/gists/${id}`);
export const getGistsByUser = (user: UserName) =>
  GET<Gist[]>(`/users/${user}/gists`, {
    headers: { Authorization: `Basic ${btoa(`${GH_USER}:${GH_TOKEN}`)}` },
  });
