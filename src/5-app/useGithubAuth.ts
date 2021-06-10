import { useState } from 'react';

import { parseParams } from '../1-core/url';
import {
  getGithubAccessToken,
  processGithubAuthCode,
  requestGithubAuthorization
} from '../2-github/github_auth';
import { GithubToken } from '../storage/gh/GithubApi';

export function useGithubAuth() {
  const [token, setToken] = useState<GithubToken | null>(getGithubAccessToken());

  const { code, state } = parseParams(location.toString());

  if (code) {
    processGithubAuthCode(code, state).then(setToken);
    return null;
  }

  if (token) {
    return token;
  }

  requestGithubAuthorization();
  return null;
}
