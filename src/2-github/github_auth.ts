import { ClientStorage } from '@amatiasq/client-storage';

import { POST } from '../1-core/http';
import { parseParams, withParams } from '../1-core/url';

const isLocalHost = location.hostname === 'localhost';
const CLIENT_ID = isLocalHost ? '3e0c6862be8f7272c3d4' : '120875b87556e8c052e4';

const redirect_uri = isLocalHost
  ? location.origin
  : 'https://gist.amatiasq.com/';

const AUTH_ROOT = 'https://github.com/login/oauth';
const AUTH_ENDPOINT = 'https://gist.amatiasq.com/auth';

const requestState = new ClientStorage<string | null>('bg.gh-state', {});
const auth = new ClientStorage<string | null>('bg.gh-token', {});

export function getGithubAccessToken() {
  return auth.cache;
}

export const getGithubHeaders = () => ({
  Authorization: `token ${auth.cache}`,
  Accept: 'application/vnd.github.v3+json',
});

export function requestGithubAuthorization() {
  const state = Math.random().toString().substr(2);

  const url = withParams(`${AUTH_ROOT}/authorize`, {
    client_id: CLIENT_ID,
    scope: 'gist',
    redirect_uri,
    state,
  });

  requestState.set(state);
  location.replace(url);
}

export async function processGithubAuthCode(code: string, state: string) {
  if (state && state !== requestState.cache) {
    throw new Error(
      `Request state do not match: "${state}" - "${requestState.cache}`,
    );
  }

  if (code) {
    requestState.reset();
    history.pushState({}, '', redirect_uri);
  }

  const { result } = await requestAccessToken(code, state);
  const { access_token } = parseParams(`/?${result}`);
  auth.set(access_token);
  return access_token;
}

function requestAccessToken(code: string, state: string) {
  const url = withParams(AUTH_ENDPOINT, {
    redirect_uri,
    state,
    code,
  });

  return POST<{ result: string }>(url);
}
