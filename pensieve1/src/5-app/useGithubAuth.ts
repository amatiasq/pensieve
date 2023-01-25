import { ClientStorage } from '@amatiasq/client-storage';
import { useState } from 'react';
import { parseParams } from '../1-core/url';
import {
  appOrigin,
  ghAuthEndpoint,
  ghClientId,
  ghScope,
} from '../3-github/gh-utils';
import { GithubAuth, GithubToken } from '../3-github/GithubAuth';
import { GithubUsers } from '../3-github/GithubUsers';
import { GithubUsername } from '../3-github/models/GHApiUser';

const auth = new GithubAuth({
  scope: ghScope,
  endpoint: ghAuthEndpoint,
  clientId: ghClientId,
  redirectUri: appOrigin,
});

const user = new ClientStorage<GithubUsername | null>('notes.gh-user', {
  default: null,
  version: 1,
});

export interface GithubAuthData {
  token: GithubToken;
  username: GithubUsername;
}

export function useGithubAuth(): Record<string, never> | GithubAuthData {
  const { code, state } = parseParams(location.toString());
  const [data, setData] = useState<GithubAuthData | null>(
    auth.token && user.cache
      ? { token: auth.token, username: user.cache }
      : null,
  );

  if (code) {
    history.replaceState(null, document.title, location.pathname);
    requestTokenAndUsername(code, state).then(setData);
    return {};
  }

  if (data) {
    return data;
  }

  if (location.pathname === '/halt') {
    return {};
  }

  auth.requestGithubAuthorization();
  return {};
}

async function requestTokenAndUsername(code: string, state: string) {
  const token = await auth.processGithubAuthCode(code, state);
  const requester = new GithubUsers(token);
  const username = await requester.fetchCurrentUsername();
  user.set(username);
  return { token, username };
}
