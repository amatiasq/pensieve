import { GithubToken } from './GithubAuth';

const GH_API = 'https://api.github.com';

export function ghUrl(path: string) {
  const result = `${GH_API}${path}`;
  const booster = `p=${Date.now()}`;
  return result.includes('?') ? `${result}&${booster}` : `${result}?${booster}`;
}

export function ghAuthHeaders(token: GithubToken) {
  return { Authorization: `token ${token}` };
}
