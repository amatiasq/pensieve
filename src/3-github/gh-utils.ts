import { getQueryParameter } from '../0-dom/getQueryParameter.ts';
import { Note } from '../2-entities/Note.ts';
import {
  AUTH_ENDPOINT,
  CLIENT_ID_DEV,
  CLIENT_ID_PROD,
  COMMIT_ENDPOINT,
  GH_SCOPE,
  VALID_ORIGINS,
} from '../config.json' with { type: 'json' };
import { GithubToken } from './GithubAuth.ts';
import { GithubUsername } from './models/GHApiUser.ts';

const GH_API = 'https://api.github.com';

export const ghRepository = getQueryParameter('repo', 'pensieve-data');

export function ghUrl(path: string) {
  return new URL(`${GH_API}${path}`).toString();
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

// Rutas relativas: la API la sirve el mismo origen que la app, así que no hay
// petición cross-origin y no hay CORS. En local lo resuelve el proxy de vite.
export const ghAuthEndpoint = AUTH_ENDPOINT;
export const ghCommitEndpoint = COMMIT_ENDPOINT;

function getOrigin() {
  const { origin } = location;
  const isValidOrigin = VALID_ORIGINS.some((x: string) => origin.startsWith(x));

  if (!isLocalHost && !isValidOrigin) {
    throw new Error(`Invalid origin: ${origin}`);
  }

  return origin;
}
