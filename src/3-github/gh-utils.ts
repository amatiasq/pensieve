import { getQueryParameter } from '../0-dom/getQueryParameter';
import { Note } from '../2-entities/Note';
import { GithubToken } from './GithubAuth';
import { GithubUsername } from './models/GHApiUser';

const GH_API = 'https://api.github.com';

export const ghRepository = getQueryParameter('repo', 'pensieve-data');

export function ghUrl(path: string) {
  const result = `${GH_API}${path}`;
  const booster = `p=${Date.now()}`;
  return result.includes('?') ? `${result}&${booster}` : `${result}?${booster}`;
}

export function ghAuthHeaders(token: GithubToken) {
  return { Authorization: `token ${token}` };
}

export function ghPublicPage(username: GithubUsername, note: Note) {
  return `https://github.com/${username}/${ghRepository}/blob/main/note/${note.id}`;
}
