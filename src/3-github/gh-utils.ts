import { getQueryParameter } from '../0-dom/getQueryParameter';
import { Note } from '../2-entities/Note';
import {
  AUTH_ENDPOINT,
  CLIENT_ID_DEV,
  CLIENT_ID_PROD,
  COMMIT_ENDPOINT,
  GH_SCOPE,
  VALID_ORIGINS,
} from '../config.json';
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

const isLocalHost = location.hostname === 'localhost';

export const appOrigin = getOrigin();
export const ghScope = GH_SCOPE;
export const ghClientId = isLocalHost ? CLIENT_ID_DEV : CLIENT_ID_PROD;

const endpointOrigin = isLocalHost ? VALID_ORIGINS[0] : appOrigin;

export const ghAuthEndpoint = `${endpointOrigin}${AUTH_ENDPOINT}`;
export const ghCommitEndpoint = `${endpointOrigin}${COMMIT_ENDPOINT}`;

function getOrigin() {
  const { origin } = location;
  const isValidOrigin = VALID_ORIGINS.some((x: string) => origin.startsWith(x));

  if (!isLocalHost && !isValidOrigin) {
    throw new Error(`Invalid origin: ${origin}`);
  }

  return origin;
}
