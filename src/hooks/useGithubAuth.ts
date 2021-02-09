import { useState } from 'react';

import { ClientStorage } from '@amatiasq/client-storage';

import { POST } from '../services/api';
import { parseParams, withParams } from '../services/url';

const isLocalHost = location.hostname === 'localhost';
const redirect_uri = isLocalHost
  ? location.origin
  : 'https://amatiasq.github.io/np';

const AUTH_ROOT = 'https://github.com/login/oauth';
const AUTH_PROXY = 'https://api.amatiasq.com/np-auth';

const requestState = new ClientStorage<string>('np.gh-state');
const auth = new ClientStorage<string>('np.gh-token');

export const getGithubHeaders = () => ({
  Authorization: `token ${auth.get()}`,
  Accept: 'application/vnd.github.v3+json',
});

export function useGithubAuth() {
  const [token, setToken] = useState<string | null>(auth.get());

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
  const url = withParams(AUTH_PROXY, {
    redirect_uri,
    state,
    code,
  });

  return POST<any>(url);
}

function getCodeFromParams() {
  const { code, state } = parseParams(location.toString());

  if (state && state !== requestState.get()) {
    throw new Error(
      `Request state do not match: "${state}" - "${requestState.get()}`,
    );
  }

  if (code) {
    requestState.clear();
    history.pushState({}, '', redirect_uri);
  }

  return { code, state };
}

function requestAccess() {
  const state = Math.random().toString().substr(2);

  const url = withParams(`${AUTH_ROOT}/authorize`, {
    client_id: '120875b87556e8c052e4',
    scope: 'gist',
    redirect_uri,
    state,
  });

  requestState.set(state);
  location.replace(url);
}
