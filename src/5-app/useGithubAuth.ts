import { useState } from 'react';

import { parseParams } from '../1-core/url';
import { GithubAuth, GithubToken } from '../3-github/GithubAuth';

const isLocalHost = location.hostname === 'localhost';

const auth = new GithubAuth({
  scope: 'repo gist',
  endpoint: 'https://gist.amatiasq.com/auth',
  clientId: isLocalHost ? '3e0c6862be8f7272c3d4' : '120875b87556e8c052e4',
  redirectUri: isLocalHost ? location.origin : 'https://gist.amatiasq.com/',
});

export function useGithubAuth() {
  const [token, setToken] = useState<GithubToken | null>(auth.token);
  const { code, state } = parseParams(location.toString());

  if (code) {
    auth.processGithubAuthCode(code, state).then(setToken);
    return null;
  }

  if (token) {
    return token;
  }

  auth.requestGithubAuthorization();
  return null;
}
