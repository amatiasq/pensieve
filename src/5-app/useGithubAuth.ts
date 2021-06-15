import { useState } from 'react';

import { ClientStorage } from '@amatiasq/client-storage';

import { parseParams } from '../1-core/url';
import { GithubAuth, GithubToken } from '../3-github/GithubAuth';
import { GithubUsers } from '../3-github/GithubUsers';
import { GithubUsername } from '../3-github/models/GHApiUser';

const isLocalHost = location.hostname === 'localhost';

const auth = new GithubAuth({
  scope: 'repo gist',
  endpoint: 'https://gist.amatiasq.com/auth',
  clientId: isLocalHost ? '3e0c6862be8f7272c3d4' : '120875b87556e8c052e4',
  redirectUri: isLocalHost ? location.origin : 'https://gist.amatiasq.com/',
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
    requestTokenAndUsername(code, state).then(setData);
    return {};
  }

  if (data) {
    return data;
  }

  auth.requestGithubAuthorization();
  return {};
}

async function requestTokenAndUsername(code: string, state: string) {
  const token = await auth.processGithubAuthCode(code, state);
  const requester = new GithubUsers(token);
  const username = await requester.fetchCurrentUsername();
  return { token, username };
}
