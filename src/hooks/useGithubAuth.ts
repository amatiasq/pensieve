import { useState } from 'react';

import { ClientStorage } from '@amatiasq/client-storage';

import { POST } from '../services/http';
import { parseParams, withParams } from '../services/url';

const isLocalHost = location.hostname === 'localhost';
const CLIENT_ID = isLocalHost ? '3e0c6862be8f7272c3d4' : '120875b87556e8c052e4';

const redirect_uri = isLocalHost
  ? location.origin
  : 'https://gist.amatiasq.com/';

const AUTH_ROOT = 'https://github.com/login/oauth';
const AUTH_ENDPOINT = 'https://gist.amatiasq.com/auth';

const requestState = new ClientStorage<string | null>('gists.gh-state', {});

const auth = new ClientStorage<string | null>('gists.gh-token', {});

export const getGithubHeaders = () => ({
  Authorization: `token ${auth.cache}`,
  Accept: 'application/vnd.github.v3+json',
});

export function useGithubAuth() {
  const [token, setToken] = useState<string | null>(auth.cache);

  const { code, state } = getCodeFromParams();

  if (code) {
    requestAccessToken(code, state).then(x => {
      const { access_token } = parseParams(`/?${x.result}`);
      auth.set(access_token);
      setToken(access_token);
    });
    return false;
  }

  if (token) {
    return token;
  }

  requestAccess();
  return false;
}

function requestAccessToken(code: string, state: string) {
  const url = withParams(AUTH_ENDPOINT, {
    redirect_uri,
    state,
    code,
  });

  return POST<any>(url);
}

function getCodeFromParams() {
  const { code, state } = parseParams(location.toString());

  if (state && state !== requestState.cache) {
    throw new Error(
      `Request state do not match: "${state}" - "${requestState.cache}`,
    );
  }

  if (code) {
    requestState.reset();
    history.pushState({}, '', redirect_uri);
  }

  return { code, state };
}

function requestAccess() {
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
